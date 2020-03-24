import axios from './config/axios'

// ids判断用户登录状态的url，请求url后
// 1.若未登录，reponseHeader中会有requesturl字段，值为登录界面地址
// 2.若已登录，接口返回 true
export const checkLoginUrl = '/ids/gotoLogin'

// 检查用户是否登录
export function checkLogin() {
  return axios.get(checkLoginUrl)
}

// 退出登录
export function logout() {
  return axios.get('/security/logout')
}

// 获取当前用户的信息
export function queryLoginUser() {
  return axios.get('/users/getLoginUser')
}

// 获取当前版本号信息
export function queryVersionData() {
  return axios.get('/version')
}