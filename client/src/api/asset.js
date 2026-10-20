import http from './http'

export const fetchAssets = (params) => http.get('/api/assets', { params })
export const deleteAsset = (id) => http.delete(`/api/assets/${id}`)
