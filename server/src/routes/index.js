import { Router } from 'express'
import { health } from '../controllers/healthController.js'
import { uploadImages } from '../middlewares/upload.js'
import { createProduct, listProducts, deleteProduct, analyze } from '../controllers/productController.js'

const router = Router()

router.get('/health', health)

router.post('/products', uploadImages, createProduct)
router.get('/products', listProducts)
router.post('/products/:id/analyze', analyze)
router.delete('/products/:id', deleteProduct)

export default router
