import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: ['copy', 'image'], required: true },
    language: String, // en / ja / es
    channel: String, // amazon / tiktok / instagram
    content: String, // 文案正文
    imageUrl: String, // 场景图路径
    prompt: String, // 生图提示词
    taskId: String, // 生图异步任务 ID
    status: { type: String, enum: ['pending', 'done', 'failed'], default: 'done' },
  },
  { timestamps: true }
)

export default mongoose.model('MarketingAsset', assetSchema)
