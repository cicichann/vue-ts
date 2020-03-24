/*
 * @Author: chen.qiufan
 * @Date: 2018-11-26 15:29:23
 * @Last Modified by: chen.qiufan
 * @Last Modified time: 2018-12-06 09:39:40
 */

/*
 * 使用示例
 * tip.success('导入成功'); // 需要手动引入本文件
 * 本文件使用插件形式导入项目，故可使用this.$trsModalSuccess('导入成功') // 参考/src/utils/trsModal/index.js文件
 */

import { Message } from 'element-ui'

let message
let timeid
const tip = function(options) {
  const customClass = 'tip-modal ' + 'tip-modal__' + options.type // 根据弹窗类型定义好弹窗类
  const iconClass = ' el-icon--left' + ' tip-modal-icon'
  message && message.close() // 调用弹窗之前先关闭前一个弹窗
  timeid && clearTimeout(timeid) // 关闭前一个弹窗的定时器
  message = Message({
    message: options.message,
    iconClass: iconClass,
    customClass: customClass,
    center: true
  })
  timeid = setTimeout(closeMessage, 1500)
}

tip.success = function(message) {
  tip({
    message: message,
    type: 'success'
  })
}

tip.error = function(message) {
  tip({
    message: message,
    type: 'error'
  })
}

function closeMessage() {
  message.close()
}

export default tip
