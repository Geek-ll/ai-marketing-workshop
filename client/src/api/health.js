import http from './http'

export const getHealth = () => http.get('/api/health')
