import Product from '../models/Product.js'
import { generateCopy } from '../services/copyService.js'

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
