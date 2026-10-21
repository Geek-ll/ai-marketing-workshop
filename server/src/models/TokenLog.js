import mongoose from 'mongoose'

const tokenLogSchema = new mongoose.Schema(
  {
    purpose: { type: String, enum: ['vision', 'copy', 'prompt', 'image', 'chat'], index: true },
    model: String,
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    latencyMs: Number,
    errorMessage: String,
    demo: { type: Boolean, default: false }, // 演示数据标记（步骤 5 用）
  },
  { timestamps: true }
)

tokenLogSchema.index({ createdAt: 1 })

export default mongoose.model('TokenLog', tokenLogSchema)
