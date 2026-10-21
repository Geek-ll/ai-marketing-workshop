import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { UPLOAD_DIR } from '../middlewares/upload.js'
import { LLMError } from './llmClient.js'
import { recordUsage } from './usageLogger.js'

// 万相（DashScope）原生接口，与 OpenAI 兼容模式的 BASE 不同，这里单独写
const DS = process.env.IMAGE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'

const headers = (extra = {}) => ({
  Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
  'Content-Type': 'application/json',
  ...extra,
})

// 1) 下发异步任务，返回 taskId
// 生图不消耗文本 Token，但要计入调用次数与成功率
export async function createImageTask(prompt, size = '1024*1024') {
  const started = Date.now()
  const model = process.env.IMAGE_MODEL || 'wanx2.1-t2i-turbo'
  try {
    const res = await fetch(`${DS}/services/aigc/text2image/image-synthesis`, {
      method: 'POST',
      headers: headers({ 'X-DashScope-Async': 'enable' }), // 异步模式必须带这个请求头
      body: JSON.stringify({
        model,
        input: { prompt },
        parameters: { size, n: 1 },
      }),
    }).catch((e) => {
      throw new LLMError('创建生图任务失败：' + e.message)
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.output?.task_id) {
      // 只透出上游 message/code，不打印请求头，避免泄露 Key
      throw new LLMError(`创建生图任务失败：${data.message || data.code || res.status}`)
    }
    recordUsage({ purpose: 'image', model, success: true, latencyMs: Date.now() - started })
    return data.output.task_id
  } catch (e) {
    recordUsage({
      purpose: 'image',
      model,
      success: false,
      latencyMs: Date.now() - started,
      errorMessage: e.message,
    })
    throw e
  }
}

// 2) 查询任务：PENDING / RUNNING / SUCCEEDED / FAILED
export async function queryImageTask(taskId) {
  const res = await fetch(`${DS}/tasks/${taskId}`, { headers: headers() }).catch((e) => {
    throw new LLMError('查询生图任务失败：' + e.message)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new LLMError(`查询任务失败：${data.message || res.status}`)
  const out = data.output || {}
  return {
    status: out.task_status,
    url: out.results?.[0]?.url,
    message: out.message || out.results?.[0]?.message,
  }
}

// 3) 把结果图下载到本地（官方图片链接只保留 24 小时，必须自己存一份）
export async function downloadImage(url) {
  const res = await fetch(url).catch((e) => {
    throw new LLMError('下载生成图片失败：' + e.message)
  })
  if (!res.ok) throw new LLMError('下载生成图片失败')
  const dir = path.join(UPLOAD_DIR, 'generated')
  fs.mkdirSync(dir, { recursive: true })
  const name = randomUUID() + '.png'
  fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()))
  return '/uploads/generated/' + name
}
