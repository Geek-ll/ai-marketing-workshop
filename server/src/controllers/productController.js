import Product from '../models/Product.js'
import { analyzeProduct } from '../services/visionService.js'

export async function createProduct(req, res, next) {
  try {
    const { name, audience = '', category = '' } = req.body
    if (!name?.trim()) return res.status(400).json({ code: 4001, message: '商品名称不能为空' })
    if (!req.files?.length) return res.status(400).json({ code: 4001, message: '请至少上传一张图片' })

    const images = req.files.map((f) => '/uploads/' + f.filename)
    const product = await Product.create({ name, audience, category, images })
    res.json({ code: 0, message: 'ok', data: product })
  } catch (e) {
    next(e)
  }
}

export async function listProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const size = Math.min(parseInt(req.query.size) || 20, 50)
    const [list, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip((page - 1) * size).limit(size),
      Product.countDocuments(),
    ])
    res.json({ code: 0, message: 'ok', data: { list, total, page, size } })
  } catch (e) {
    next(e)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ code: 4004, message: '商品不存在' })
    res.json({ code: 0, message: 'ok', data: product })
  } catch (e) {
    next(e)
  }
}

// AI 一键识别：调用视觉大模型分析商品图，结果写回 aiAnalysis
export async function analyze(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).catch(() => null)
    if (!product) return res.status(404).json({ code: 4004, message: '商品不存在' })

    const result = await analyzeProduct(product)
    product.aiAnalysis = { ...result, analyzedAt: new Date() }
    await product.save()

    res.json({ code: 0, message: 'ok', data: product.aiAnalysis })
  } catch (e) {
    next(e)
  }
}
