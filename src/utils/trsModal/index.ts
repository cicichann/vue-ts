/*
 * @Author: chen.qiufan
 * @Date: 2018-11-22 13:59:33
 * @Last Modified by: chen.qiufan
 * @Last Modified time: 2018-12-07 17:56:54
 */

import custom from './packages/custom.vue'
import tip from './packages/tip'
import confirm from './packages/confirm'
import errorMsg from './packages/errorMsg'
import errorDialog from './packages/errorDialog'

const components = [
  custom
]

const install = function(Vue, opts = {}) {
  // 遍历组件安装到Vue上
  components.forEach(component => {
    Vue.component(component.name, component)
  })

  Vue.prototype.$trsModalSuccess = tip.success
  Vue.prototype.$trsModalError = tip.error
  Vue.prototype.$trsModalConfirm = confirm
  Vue.prototype.$trsModalErrorMsg = errorMsg
  Vue.prototype.$trsModalErrorDialog = errorDialog
}

// 供单独使用
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  install
}
