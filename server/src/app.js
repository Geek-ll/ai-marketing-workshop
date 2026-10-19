import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import routes from './routes/index.js'
// 注册数据模型：连接建立后 Mongoose 会自动创建对应集合（数据库初始化）
import './models/Product.js'
import './models/MarketingAsset.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', routes)

// 统一错误处理：必须放在所有路由之后
app.use((err, req, res, next) => {
  console.error('[error]', err)
  res.status(err.status || 500).json({
    code: err.code || 5001,
    message: err.message || '服务器内部错误',
  })
})

const port = process.env.PORT || 3000

connectDB()
  .then(() => app.listen(port, () => console.log(`[server] http://localhost:${port}`)))
  .catch((e) => {
    console.error('[启动失败]', e.message)
    process.exit(1)
  })
