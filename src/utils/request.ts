/**
 * 请求工具封装 - 基于Linxios
 * 统一配置请求拦截器、响应拦截器和错误处理
 */

import { Linxios } from './Linxios'
const linxios = new Linxios({
  // baseURL: 'http://192.168.100.1',
})

// 请求拦截器
linxios.interceptors.request.use(
  (config) => {
    // 可以在这里添加全局请求头，如token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers = config.headers || {}
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
linxios.interceptors.response.use(
  (response) => {
    // 统一处理响应数据
    return response
  },
  (error) => {
    // 统一处理错误
    console.error('Request error:', error)

    // 可以根据状态码做不同处理
    // if (error.response?.status === 401) {
    //   // 未授权，跳转到登录页
    //   window.location.href = '/login'
    // }

    return Promise.reject(error)
  },
)

export default linxios