import 'dotenv/config'
import mongoose from 'mongoose'
import TokenLog from '../models/TokenLog.js'

await mongoose.connect(process.env.MONGO_URI)
const purposes = ['vision', 'copy', 'prompt', 'image']
const docs = []
// 只补过去 6 天，今天保留真实调用数据；全部带 demo: true 标记
for (let d = 6; d >= 1; d--) {
  for (let i = 0; i < 8; i++) {
    const p = purposes[i % purposes.length]
    const ts = new Date(Date.now() - d * 24 * 3600 * 1000 + i * 3600 * 1000)
    docs.push({
      purpose: p,
      model: 'demo',
      success: Math.random() > 0.1,
      promptTokens: p === 'image' ? 0 : 300 + Math.floor(Math.random() * 900),
      completionTokens: p === 'image' ? 0 : 200 + Math.floor(Math.random() * 700),
      latencyMs: 1000 + Math.floor(Math.random() * 4000),
      demo: true,
      createdAt: ts,
      updatedAt: ts,
    })
  }
}
await TokenLog.insertMany(docs)
console.log('已插入演示数据', docs.length, '条')
await mongoose.disconnect()
