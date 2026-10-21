import { Router } from 'express'
import { health } from '../controllers/healthController.js'
import { uploadImages } from '../middlewares/upload.js'
import { createProduct, listProducts, deleteProduct, analyze } from '../controllers/productController.js'
import { generate, stream } from '../controllers/copyController.js'
import { generate as generateImage, taskStatus } from '../controllers/imageController.js'
import { listAssets, removeAsset } from '../controllers/assetController.js'
import { inputGuard } from '../middlewares/compliance.js'

const router = Router()

router.get('/health', health)

router.post('/products', uploadImages, createProduct)
router.get('/products', listProducts)
router.post('/products/:id/analyze', analyze)
router.post('/copy/generate', inputGuard(['extra']), generate)
router.post('/copy/stream', inputGuard(['extra']), stream)
router.get('/assets', listAssets)
router.post('/images/generate', generateImage)
router.get('/images/tasks/:assetId', taskStatus)
router.delete('/assets/:id', removeAsset)
router.delete('/products/:id', deleteProduct)

export default router
