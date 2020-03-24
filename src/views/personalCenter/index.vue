<template>
  <div>
    <com-header :navs="data.navs" :reload="reload" module-name="系统配置"/>
    <router-view v-if="isRouterAlive"/>
  </div>
</template>

<script>
import comHeader from '@/views/common/header/index'

export default {
  name: 'SystemConfig',

  components: {
    comHeader
  },

  data() {
    return {
      data: {
        navs: [
          {
            path: '/system/userGroup',
            title: '用户组织管理',
            rightKey: 'sysconf.user,sysconf.group'
          },
          {
            path: '/system/roleManage',
            title: '角色管理',
            rightKey: 'sysconf.role'
          },
          {
            path: '/system/rightManage',
            title: '权限模板',
            rightKey: 'sysconf.righttemplate'
          },
          {
            path: '/system/appauth',
            title: '应用授权',
            rightKey: 'sysconf.appauth'
          },
          {
            path: '/system/configuration',
            title: '配置项管理',
            rightKey: 'sysconf.config'
          }
        ]
      },
      isRouterAlive: true
    }
  },

  methods: {
    reload () {
      this.isRouterAlive = false
      this.$nextTick(() => (this.isRouterAlive = true))
    }
  }
}
</script>