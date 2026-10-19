import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    audience: { type: String, default: '' }, // 目标受众
    category: { type: String, default: '' }, // 品类
    images: [{ type: String }], // 图片相对路径，如 /uploads/xxx.png
    aiAnalysis: {
      // 作业 4 回写
      visual_elements: [String],
      core_selling_points: [String],
      scene_suggestions: [String],
      analyzedAt: Date,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)
