import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import routes from './routes/index.js'
import { UPLOAD_DIR } from './middlewares/upload.js'
// 注册数据模型：连接建立后 Mongoose 会自动创建对应集合（数据库初始化）
import './models/Product.js'
import './models/MarketingAsset.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// 上传目录静态资源：图片通过 http://localhost:3000/uploads/文件名 访问
app.use('/uploads', express.static(UPLOAD_DIR))

app.use('/api', routes)

// 统一错误处理：必须放在所有路由之后
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const map = {
      LIMIT_FILE_SIZE: '单张图片不能超过 5MB',
      LIMIT_FILE_COUNT: '最多上传 5 张图片',
      LIMIT_UNEXPECTED_FILE: '上传字段名应为 images',
    }
    return res.status(400).json({ code: 4001, message: map[err.code] || err.message })
  }
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
