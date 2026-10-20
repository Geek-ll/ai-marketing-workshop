import MarketingAsset from '../models/MarketingAsset.js'

// 营销资产列表：支持按商品 / 类型过滤，附带商品名称
export async function listAssets(req, res, next) {
  try {
    const { productId, type } = req.query
    const filter = {}
    if (productId) filter.productId = productId
    if (type) filter.type = type
    const list = await MarketingAsset.find(filter).sort({ createdAt: -1 }).limit(100).populate('productId', 'name')
    res.json({ code: 0, message: 'ok', data: list })
  } catch (e) {
    next(e)
  }
}

export async function removeAsset(req, res, next) {
  try {
    await MarketingAsset.findByIdAndDelete(req.params.id)
    res.json({ code: 0, message: 'ok' })
  } catch (e) {
    next(e)
  }
}
