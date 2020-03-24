<template>
  <div class="resource-manage">
    <com-header :navs="navs" :reload="reload"/>
    <router-view v-if="isRouterAlive"/>
</div></template>

<script>
import comHeader from '@/views/common/header/index'

/**
 * 数据管理
 */
export default {
  name: 'ResourceManage',

  components: {
    comHeader
  },

  data() {
    return {
      navs: [{
        path: '/manage/summary',
        title: '资源概览',
        rightKey: 'datamgt.overview'
      }, {
        path: '/manage/inforepo',
        title: '信息资源库',
        rightKey: 'datamgt.data'
      }, {
        path: '/manage/topic',
        title: '专题库',
        rightKey: 'datamgt.dissertation'
      }, {
        path: '/manage/monitor',
        title: '监控中心',
        rightKey: 'datamgt.monitorcenter'
      }],
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
