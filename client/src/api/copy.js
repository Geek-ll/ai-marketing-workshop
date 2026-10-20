import http from './http'

export const generateCopy = (body) => http.post('/api/copy/generate', body)
