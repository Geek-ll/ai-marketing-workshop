import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 60000,
})

// 统一解包 { code, message, data }
http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && body.code !== undefined && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message))
)

export default http
