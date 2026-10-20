import { Router } from 'express'
import { health } from '../controllers/healthController.js'
import { uploadImages } from '../middlewares/upload.js'
import { createProduct, listProducts, deleteProduct, analyze } from '../controllers/productController.js'
import { generate } from '../controllers/copyController.js'
import { inputGuard } from '../middlewares/compliance.js'

const router = Router()

router.get('/health', health)

router.post('/products', uploadImages, createProduct)
router.get('/products', listProducts)
router.post('/products/:id/analyze', analyze)
router.post('/copy/generate', inputGuard(['extra']), generate)
router.delete('/products/:id', deleteProduct)

export default router
