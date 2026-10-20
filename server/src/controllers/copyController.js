import Product from '../models/Product.js'
import MarketingAsset from '../models/MarketingAsset.js'
import { generateCopy } from '../services/copyService.js'
import { streamChat } from '../services/llmClient.js'
import { buildCopyMessages } from '../services/promptBuilder.js'
import { findViolations, maskViolations } from '../middlewares/compliance.js'

// 生成多语言营销文案（依赖作业 4 的 aiAnalysis 卖点）
export async function generate(req, res, next) {
  try {
    const { productId, language, channel, extra } = req.body
    const product = await Product.findById(productId).catch(() => null)
    if (!product) return res.status(404).json({ code: 4004, message: '商品不存在' })
    if (!product.aiAnalysis?.core_selling_points?.length)
      return res.status(400).json({ code: 4001, message: '请先对该商品执行“AI 一键识别”' })

    const data = await generateCopy({ product, language, channel, extra })
    res.json({ code: 0, message: 'ok', data })
  } catch (e) {
    next(e)
  }
}

// 流式生成文案（SSE）。事件约定：delta / done / error
export async function stream(req, res) {
  const { productId, language, channel, extra } = req.body

  // 1) 参数校验：必须在开启 SSE 之前，仍然用普通 JSON 返回错误
  const product = await Product.findById(productId).catch(() => null)
  if (!product) return res.status(404).json({ code: 4004, message: '商品不存在' })
  if (!product.aiAnalysis?.core_selling_points?.length)
    return res.status(400).json({ code: 4001, message: '请先对该商品执行“AI 一键识别”' })

  let messages
  try {
    messages = buildCopyMessages({ product, language, channel, extra })
  } catch (e) {
    return res.status(e.status || 400).json({ code: 4001, message: e.message })
  }

  // 2) 开启 SSE
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 告诉 Nginx 不要缓冲，作业 9 会再配置
  })
  res.flushHeaders()

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  // 3) 用户点“停止生成”（浏览器断开连接）时，同步中断上游请求，避免白白消耗额度
  const upstream = new AbortController()
  let clientGone = false
  res.on('close', () => {
    // 必须监听 res 而不是 req：较新 Node 中请求体读完 req 的 close 就会触发
    if (!res.writableEnded) {
      clientGone = true
      upstream.abort()
      console.log('[copy/stream] 客户端断开，已中断上游请求')
    }
  })

  let full = ''
  try {
    for await (const ev of streamChat({
      model: process.env.TEXT_MODEL || 'qwen-plus',
      messages,
      purpose: 'copy',
      signal: upstream.signal,
    })) {
      if (ev.type === 'delta') {
        full += ev.text
        send('delta', { text: ev.text })
      }
    }

    // 4) 生成完毕：遮蔽敏感词、保存、通知前端
    const warnings = findViolations(full)
    const content = maskViolations(full)
    const asset = await MarketingAsset.create({
      productId,
      type: 'copy',
      language,
      channel,
      content,
      status: 'done',
    })
    send('done', { assetId: asset._id, content, warnings })
  } catch (e) {
    if (!clientGone) send('error', { message: e.message || '生成失败' })
    else console.log('[copy/stream] 客户端已断开：', e.message)
  } finally {
    res.end()
  }
}
