import * as personalCenter from './personalCenter'
import * as resourceManage from './resourceManage'
import * as resourceModel from './resourceModel'
import * as resourceCollection from './reourceCollection'
import * as attach from './attach'
import * as login from './login'

import axios from './config/axios'

const qs = require('qs')

let api = {
  // 资源模型
  ...resourceModel,

  // 资源管理
  ...resourceManage,

  // 个人中心
  ...personalCenter,

  //资源归集
  ...resourceCollection,

  // 附件相关
  ...attach,

  // 登录相关
  ...login,

  // 公共接口
  get (url, params) {
    return axios.get(url, { params: params })
  },

  post (url, params) {
    return axios.post(url, qs.stringify(params))
  },

  delete (url, params) {
    return axios.delete(url, { params: params })
  },

  put (url, params) {
    return axios.put(url, qs.stringify(params))
  }
}

export default api
