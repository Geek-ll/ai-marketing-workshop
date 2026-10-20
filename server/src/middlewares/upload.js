import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // 不使用用户原始文件名，避免路径穿越与重名覆盖
  filename: (req, file, cb) => cb(null, randomUUID() + ALLOWED[file.mimetype]),
})

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 单张 5MB，最多 5 张
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      const err = new Error('仅支持 JPG / PNG / WebP 图片')
      err.status = 400
      err.code = 4001
      return cb(err)
    }
    cb(null, true)
  },
}).array('images', 5)
