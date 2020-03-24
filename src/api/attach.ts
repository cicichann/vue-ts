/**
 * 附件相关接口
 * created by huang.jusheng on 2018/12/12
 */

import axios from './config/axios'
import errorDialog from '@/utils/trsModal/packages/errorDialog/index'

const saveFile = function (res) {
  let fileName = res.headers['content-disposition'].split(';')[1].split('=')[1];
  fileName = decodeURIComponent(fileName.slice(1, fileName.length-1))

  if (window.navigator.msSaveOrOpenBlob) {
    let blob = new Blob([res.data]);
    navigator.msSaveBlob(blob, fileName);
    return;
  }

  let url = window.URL.createObjectURL(new Blob([res.data]))
  let link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
}

// 下载附件
export function downloadAttach(id) {
  return axios({
    url: `/file/${id}/download`,
    method: 'GET',
    responseType: 'arraybuffer'
  }).then(res => {
    saveFile(res)
  }, err => {
    var blob = new Blob([err], {
      type: 'text/plain'
    })

    let reader = new FileReader()
    reader.readAsText(blob, 'utf-8')
    reader.onload = function(e) {
      let result = JSON.parse(reader.result)
      errorDialog({
        msg: result.msg,
        title: '操作失败'
      })
    }
  })
}

// 下载视频
export function downloadVideo(id) {
  return axios.get(`/video/${id}/download`)
}

// 获取mas视频封面图
export function queryMasPoster(id) {
  return axios.get(`/video/${id}/image`)
}

// 下载目录
export function downloadCategory (id) {
  return axios({
    url: `/standards/${id}/categories/export`,
    method: 'GET',
    responseType: 'arraybuffer'
  }).then(res => {
    saveFile(res)
  }, err => {
    var blob = new Blob([err], {
      type: 'text/plain'
    })

    let reader = new FileReader()
    reader.readAsText(blob, 'utf-8')
    reader.onload = function(e) {
      let result = JSON.parse(reader.result)
      errorDialog({
        msg: result.msg,
        title: '操作失败'
      })
    }
  })
}

// 下载数据表
export function downloadTable (id) {
  return axios({
    url: `/standards/${id}/resources/export`,
    method: 'GET',
    responseType: 'arraybuffer'
  }).then(res => {
    saveFile(res)
  }, err => {
    var blob = new Blob([err], {
      type: 'text/plain'
    })

    let reader = new FileReader()
    reader.readAsText(blob, 'utf-8')
    reader.onload = function(e) {
      let result = JSON.parse(reader.result)
      errorDialog({
        msg: result.msg,
        title: '操作失败'
      })
    }
  })
}
