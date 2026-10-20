import http from './http'

export const createProduct = (formData) =>
  http.post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const fetchProducts = (params) => http.get('/api/products', { params })

export const deleteProduct = (id) => http.delete(`/api/products/${id}`)
