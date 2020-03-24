import axios from './config/axios'
const qs = require('qs')

// 根据父级查询有权限的子级
export function queryRight(params) {
    let url = `/rights/authorizedKeys`
    return axios.get(url, { params: params })
}
