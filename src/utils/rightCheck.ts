import Vue from 'vue'
import { queryRight } from '../api/personalCenter'

/**
 * 权限判断使用示例:
 * <button v-access="'model.standard.add'">新增</button>
 * <button :disabled="$checkRight('model.standard.add')">新增</button>
 * 注意:
 * （1）模块路由meta里面需要加上模块权限位key属性，来初始化子级权限
 * （2）如果一级模块需要重定位（比如资源模型重定位到资源标准），需要在路由meta中加 redirect: true
 * （3）如果涉及到分类或资源，路由的meta属性中需要加上类别：5010-分类，5020-资源，并且路由query属性中传有对应resourceid或categoryid值
 */
export default {
  rights:  [],

  /**
   * 权限判断全局指令、方法初始化
   */
  initCheckDirective () {
    let _this = this
    // 指令方式判断
    Vue.directive('access', {
      inserted: function(el, binding, vnode) {
        if (!binding.value) return

        // 所有权限位均无权限才隐藏
        if (!_this.hasRight(binding.value, _this.rights) && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    })

    // 方法判断
    Vue.prototype.$checkRight = (value) => {
      if (!value) return

      return _this.hasRight(value, _this.rights)
    }
  },

  /**
   * 根据权限位判断是否有权限
   * @param {String} keys 权限位，多个用','分隔
   * @param {Array} rights 当前全部权限
   */
  hasRight (keys, rights) {
    return keys.split(',').map(key => {
      let parentKeys = key.split('.')
      parentKeys.pop()

      let parentRight = rights[parentKeys.join('.')]

      if (!parentRight) return false
      else return parentRight.filter(item => { return item.name === key }).length > 0
    }).indexOf(true) > -1
  },

  /**
   * 处理模块权限（1）初始化权限位（2）根据路由的权限位返回要重定位的子路由
   * @param {Object} route 要跳转的路由
   * @param {Object} router VueRouter实例
   */
   initRight (route, router) {
    return new Promise((resolve, reject) => {
      if (!route.meta.hasOwnProperty('key')) {
        resolve()
      } else {
        let param = {
          parentKey: route.meta.key,
          objType: route.meta.objType,
          objId: route.meta.objId
        }
        let path = route.path + '/'

        this.reloadParentsRight(route).then(() => {this.initModuleRights(param).then((data) => {
          // 是否需要重定位
          if (route.meta.redirect) {
            let redirectItem = router.options.routes.find(item => {
              // 定位一级路由
              return item.meta.key === route.meta.key
            }).children.find(item => {
              // 定位第一个有权限的二级路由
              return item.meta.key.indexOf(data[0]) > -1
            })

            if (!redirectItem) resolve('/home')

            path += redirectItem.path

            // 多个路由集合为一个入口处理（如用户组织管理）
            if (redirectItem.meta.key.indexOf(',') > -1) {
              path += '/' + redirectItem.children.find(item => { return item.meta.key === data[0]} ).path
            }
            resolve(path)
          } else resolve()
        })})
      }
    })
  },

  /**
   * 初始化获取模块有权限的子级权限
   * @param {Object} params 模块权限位信息
   */
  initModuleRights (params) {
    let right = []

    return new Promise((resolve, reject) => {
      // 无分类、资源限制条件的二级模块权限优先从缓存中读取
      if (!params.objType && params.parentKey.split('.').length === 2 && this.rights && this.rights[params.parentKey]) {
        right = this.rights[params.parentKey].map(item => item.name)
        resolve(right)
      } else {
        queryRight(params).then(data => {
          this.rights[params.parentKey] = data
          right = data.map(item => item.name)
          resolve(right)
        })
      }
    })
  },

  /**
   * 刷新页面需要重新请求父级（一级、二级）模块权限
   * @param {Object} route 当前路由
   */
  reloadParentsRight (route) {
    return new Promise((resolve, reject) => {
      if (route.meta.key.split('.').length === 2) {
        if (!this.rights['']) {
          queryRight({parentKey: ''}).then(first => {
            this.rights[''] = first
            let secondKey = route.meta.key.split('.').shift()

            queryRight({parentKey: secondKey}).then(second => {
              this.rights[secondKey] = second
              resolve()
            })
          })
        } else {
          resolve()
        }
      } else {
        resolve()
      }
    })
  }
}
