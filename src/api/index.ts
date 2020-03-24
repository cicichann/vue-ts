import * as personalCenter from './personalCenter'
import * as resourceModel from './resourceModel'
import * as login from './login'

import axios from './config/axios'

const qs = require('qs')

let api:any = {
  // 资源模型
  ...resourceModel,

  // 个人中心
  ...personalCenter,

  // 登录相关
  ...login,

  // 公共接口
  get (url, params):any {
    return axios.get(url, { params: params })
  },

  post (url, params):any {
    return axios.post(url, qs.stringify(params))
  },

  delete (url, params):any {
    return axios.delete(url, { params: params })
  },

  put (url, params):any {
    return axios.put(url, qs.stringify(params))
  }
}

export default api
