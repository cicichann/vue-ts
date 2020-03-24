import Vue from 'vue'
import Router from 'vue-router'
import { checkLogin } from '@/api/login'

// 资源标准路由
import resourceModel from '@/views/resourceModel/router'
// 资源归集路由
import resourceCollection from '@/views/resourceCollection/router'
// 资源管理路由
import resourceMange from '@/views/resourceManage/router'
// 个人中心路由
import personalCenter from '@/views/personalCenter/router'
// 个人中心路由
import recycle from '@/views/recycle/router'
Vue.use(Router)

const routerInstance = new Router({
  routes: [
    {
      path: '/',
      redirect: '/home',
      meta: {
        requireLogin: true
      }
    },
    {
      path: '/home',
      component: () => import('@/views/home/index'),
      meta: {
        title: '首页',
        requireLogin: true,
        key: ''
      }
    },
    ...resourceModel,
    ...resourceCollection,
    ...resourceMange,
    ...personalCenter,
    ...recycle
  ]
})

routerInstance.beforeEach((to, from, next) => {
  /* 路由发生变化修改页面title */
  if (to.meta.title) {
    document.title = to.meta.title
  }

  //5020-资源，5010-分类
  if (to.meta.objType === '5020') {
    to.meta.objId = to.query.resourceid
  }
  if (to.meta.objType === '5010') {
    to.meta.objId = Number(to.query.categoryid) === 0 ? '' : to.query.categoryid
  }
  // 未获取到objId
  if (!to.meta.objId && to.meta.objType) {
    delete to.meta.objType
  }

  function initRight() {
    Vue.prototype.$right.initRight.call(Vue.prototype.$right, to, routerInstance).then((path) => {
      if (path) {
        next(path)
      } else next()
    })
  }

  /* 是否需要判断登录状态，并且初始化该模块的权限位 */
  if (to.meta.requireLogin) {
    checkLogin().then(() => {
      initRight()
    })
  } else {
    initRight()
  }
})

export default routerInstance
