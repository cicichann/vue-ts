// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App.vue'
import router from './router'

import ElementUI from 'element-ui'
import trsModal from './utils/trsModal'
import dialog  from "./utils/dialog"
import right from './utils/rightCheck'

import 'babel-polyfill'
import 'element-ui/lib/theme-chalk/index.css'
import './styles/index.scss'

import infiniteScroll from 'vue-infinite-scroll'
import objectPick from 'object.pick'
import deepMerge from 'deepmerge'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(trsModal)

Vue.use({
  install: (Vue, options) => {
    Vue.prototype.$dialog = dialog
    Vue.prototype.$right = right
    Vue.prototype.$pick = objectPick
    Vue.prototype.$deepMerge = deepMerge
  }
})

Vue.use(infiniteScroll)

// 初始化权限判断指令
Vue.prototype.$right.initCheckDirective()

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
