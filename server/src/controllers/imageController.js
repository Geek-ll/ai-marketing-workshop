import Product from '../models/Product.js'
import MarketingAsset from '../models/MarketingAsset.js'
import { expandImagePrompt } from '../services/imagePromptService.js'
import { createImageTask, queryImageTask, downloadImage } from '../services/imageService.js'

const TIMEOUT_MS = 5 * 60 * 1000

// POST /api/images/generate  { productId, sceneIndex }
// 异步模式：这里只负责下发任务并立刻返回 assetId，绝不同步等待出图
export async function generate(req, res, next) {
  try {
    const { productId, sceneIndex = 0 } = req.body
    const product = await Product.findById(productId).catch(() => null)
    if (!product) return res.status(404).json({ code: 4004, message: '商品不存在' })

    const scene = product.aiAnalysis?.scene_suggestions?.[sceneIndex]
    if (!scene)
      return res.status(400).json({ code: 4001, message: '该商品没有场景建议，请先执行“AI 一键识别”' })

    const prompt = await expandImagePrompt({ product, scene })
    const taskId = await createImageTask(prompt)
    const asset = await MarketingAsset.create({
      productId,
      type: 'image',
      prompt,
      taskId,
      status: 'pending',
    })
    res.json({ code: 0, message: 'ok', data: { assetId: asset._id, prompt, scene } })
  } catch (e) {
    next(e)
  }
}

// GET /api/images/tasks/:assetId
export async function taskStatus(req, res, next) {
  try {
    const asset = await MarketingAsset.findById(req.params.assetId).catch(() => null)
    if (!asset) return res.status(404).json({ code: 4004, message: '任务不存在' })

    const reply = (extra = {}) =>
      res.json({
        code: 0,
        message: 'ok',
        data: { status: asset.status, imageUrl: asset.imageUrl, ...extra },
      })

    if (asset.status !== 'pending') return reply()

    if (Date.now() - asset.createdAt.getTime() > TIMEOUT_MS) {
      asset.status = 'failed'
      await asset.save()
      return reply({ message: '生成超时，请重试' })
    }

    const r = await queryImageTask(asset.taskId)
    if (r.status === 'SUCCEEDED') {
      asset.imageUrl = await downloadImage(r.url)
      asset.status = 'done'
      await asset.save()
      return reply()
    }
    if (r.status === 'FAILED') {
      asset.status = 'failed'
      await asset.save()
      return reply({ message: r.message || '生图失败' })
    }
    reply() // PENDING / RUNNING：仍在进行中，保持 pending
  } catch (e) {
    next(e)
  }
}
