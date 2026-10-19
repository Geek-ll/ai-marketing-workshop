import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('缺少 MONGO_URI 环境变量')
  await mongoose.connect(uri)
  console.log('[db] MongoDB 已连接')
}
