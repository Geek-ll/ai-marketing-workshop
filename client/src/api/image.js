import http from './http'

export const generateImage = (body) => http.post('/api/images/generate', body)
export const getImageTask = (assetId) => http.get(`/api/images/tasks/${assetId}`)
