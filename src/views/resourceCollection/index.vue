<template>
  <div class="resource-collection">
    <com-header :navs="navs" :reload="reload"></com-header>
    <router-view v-if="isRouterAlive"/>
  </div>
</template>

<script>
import comHeader from '@/views/common/header/index'

export default {
  name: 'ResourceCollection',

  components: {
    comHeader
  },

  data() {
    return {
      navs: [
       {
          path: `/collection/realtime`,
          title: '实时数据接入',
          rightKey: 'aggr.reltimedata'
        },
        {
          path: `/collection/history`,
          title: '历史数据迁移',
          rightKey: 'aggr.historydata'
        },
        {
          path: `/collection/document`,
          title: '接口文档',
          rightKey: 'aggr.apidoc'
        },
        {
          path: `/collection/app`,
          title: '应用管理',
          rightKey: 'aggr.appmgt'
        },
        {
          path: `/collection/mapping`,
          title: '映射管理',
          rightKey: 'aggr.mappingmgt'
        }
      ],
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
