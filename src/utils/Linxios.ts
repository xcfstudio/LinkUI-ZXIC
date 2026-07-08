/**
 * Linxios - 极简HTTP请求工具，LinkUI项目专用
 * 基于fetch封装，致敬axios，适合用于嵌入式设备
 */

// 请求配置
interface RequestConfig {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
  credentials?: RequestCredentials
  queryParams?: Record<string, string>
}

// 拦截器
interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>
  onRejected?: (error: Error) => Error | Promise<Error>
}

// 响应数据格式
interface Response<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  config: RequestConfig & { url: string; method: string }
}

// 核心请求类
class Linxios {
  private baseURL: string = ''
  private headers: Record<string, string> = {}
  private timeout: number = 3000
  private credentials: RequestCredentials = 'same-origin'

  // 拦截器
  private requestInterceptors: Interceptor<RequestConfig>[] = []
  private responseInterceptors: Interceptor<Response>[] = []

  // 版本号
  static VERSION = '1.0.0'

  constructor(config: RequestConfig = {}) {
    this.baseURL = config.baseURL || ''
    this.headers = config.headers || { 'Content-Type': 'application/json' }
    this.timeout = config.timeout || 30000
    this.credentials = config.credentials || 'same-origin'
  }

  // 请求拦截器
  interceptors = {
    request: {
      use: (
        onFulfilled?: Interceptor<RequestConfig>['onFulfilled'],
        onRejected?: Interceptor<RequestConfig>['onRejected'],
      ) => {
        this.requestInterceptors.push({ onFulfilled, onRejected })
      },
    },
    response: {
      use: (
        onFulfilled?: Interceptor<Response>['onFulfilled'],
        onRejected?: Interceptor<Response>['onRejected'],
      ) => {
        this.responseInterceptors.push({ onFulfilled, onRejected })
      },
    },
  }

  // 执行请求拦截
  private async runRequestInterceptors(
    config: RequestConfig & { url: string; method: string },
  ): Promise<RequestConfig & { url: string; method: string }> {
    let currentConfig = config
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFulfilled) {
        currentConfig = (await interceptor.onFulfilled(currentConfig)) as RequestConfig & {
          url: string
          method: string
        }
      }
    }
    return currentConfig
  }

  // 执行响应拦截
  private async runResponseInterceptors(response: Response): Promise<Response> {
    let currentResponse = response
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        currentResponse = await interceptor.onFulfilled(currentResponse)
      }
    }
    return currentResponse
  }

  // 核心请求方法
  async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config: RequestConfig = {},
  ): Promise<Response<T>> {
    try {
      // 合并配置
      const mergedConfig: RequestConfig & { url: string; method: string } = {
        baseURL: this.baseURL,
        headers: { ...this.headers, ...config.headers },
        timeout: config.timeout || this.timeout,
        credentials: config.credentials || this.credentials,
        queryParams: config.queryParams || {},
        url,
        method,
      }

      // 执行请求拦截
      const interceptedConfig = await this.runRequestInterceptors(mergedConfig)

      // 构建完整URL（包含query参数）
      let fullUrl: string
      const effectiveBaseURL = interceptedConfig.baseURL || window.location.origin
      fullUrl = new URL(url, effectiveBaseURL).href

      // 如果有queryParams，添加到URL
      if (interceptedConfig.queryParams) {
        const urlObj = new URL(fullUrl)
        Object.entries(interceptedConfig.queryParams).forEach(([key, value]) => {
          urlObj.searchParams.set(key, value)
        })
        fullUrl = urlObj.href
      }

      // 创建AbortController处理超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, interceptedConfig.timeout!)

      // 构建fetch参数
      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: interceptedConfig.headers,
        credentials: interceptedConfig.credentials,
        signal: controller.signal,
      }

      // 添加请求体
      if (data && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
        fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data)
      }

      try {
        // 发送请求
        const response = await fetch(fullUrl, fetchOptions)

        // 解析响应数据
        let responseData: any
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          responseData = await response.json()
        } else if (contentType?.includes('text')) {
          // 文本类型响应，尝试解析为JSON
          const textData = await response.text()
          try {
            // 尝试解析为JSON
            responseData = JSON.parse(textData)
          } catch {
            // 解析失败，保持为文本
            responseData = textData
          }
        } else {
          responseData = await response.blob()
        }

        // 构建响应对象
        const result: Response<T> = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: interceptedConfig,
        }

        // 检查HTTP错误
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`)
          // 执行响应拦截（错误路径）
          for (const interceptor of this.responseInterceptors) {
            if (interceptor.onRejected) {
              await interceptor.onRejected(error)
            }
          }
          throw error
        }

        // 执行响应拦截
        return await this.runResponseInterceptors(result)
      } finally {
        // 清除超时定时器
        clearTimeout(timeoutId)
      }
    } catch (error) {
      // 处理超时和网络错误
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          error.message = 'Request timeout'
        } else if (error.name === 'TypeError') {
          error.message = 'Network error'
        }
      }
      throw error
    }
  }

  // GET请求
  get<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>('GET', url, undefined, config)
  }

  // POST请求
  post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>('POST', url, data, config)
  }

  // PUT请求
  put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>('PUT', url, data, config)
  }

  // DELETE请求
  delete<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  // PATCH请求
  patch<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>('PATCH', url, data, config)
  }
}

// 创建默认实例
const linxios = new Linxios({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export { Linxios, linxios }
export default linxios