// 一次性校验脚本：确认 Mongoose 模型可用、能写入 MongoDB。
// 运行：npm run seed-check；验证完在 Compass 里删除这条测试数据。
import 'dotenv/config'
import mongoose from 'mongoose'
import Product from './models/Product.js'

const uri = process.env.MONGO_URI
if (!uri) throw new Error('缺少 MONGO_URI 环境变量')

await mongoose.connect(uri)
const doc = await Product.create({ name: '测试商品' })
console.log('[seed] 已写入测试文档：', doc._id.toString())
await mongoose.disconnect()
