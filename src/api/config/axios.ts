import axios from 'axios'
import { requestSuccessFunc, requestFailFunc, responseSuccessFunc, responseFailFunc } from './axiosInterceptors'

// axios配置项
export const AXIOS_DEFAULT_CONFIG = {
  headers: {},
  baseURL: '/uirb'
}

// axios实例
let axiosInstance = {}
axiosInstance:any = axios.create(AXIOS_DEFAULT_CONFIG)

// 添加请求、响应拦截器
axiosInstance.interceptors.request.use(requestSuccessFunc, requestFailFunc)
axiosInstance.interceptors.response.use(responseSuccessFunc, responseFailFunc)

export const CancelToken = axios.CancelToken

export default axiosInstance
