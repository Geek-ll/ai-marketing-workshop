import http from './http'

export const createProduct = (formData) =>
  http.post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const fetchProducts = (params) => http.get('/api/products', { params })

export const deleteProduct = (id) => http.delete(`/api/products/${id}`)

// AI 识图较慢（3~15 秒），单独放宽该请求的超时时间
export const analyzeProduct = (id, timeout = 120000) =>
  http.post(`/api/products/${id}/analyze`, null, { timeout })
