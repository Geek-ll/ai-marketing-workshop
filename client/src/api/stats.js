import http from './http'

export const getOverview = (days = 7) => http.get('/api/stats/overview', { params: { days } })
