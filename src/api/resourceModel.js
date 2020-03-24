import axios from './config/axios'

// 版本信息获取
export function editionMsg() {
  let url = `/apps/system/version`
  return axios.get(url)
}
