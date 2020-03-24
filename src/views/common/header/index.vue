<template>
  <div class="header-nav">
    <router-link to="/home" class="fl"><img :src="logoUrl" alt="统一信息资源库"></router-link>

    <div v-if="menus.length > 0" class="fl clearfix">
      <!-- 模块切换 -->
      <el-select v-if="!moduleName" v-model="curModule" class="fl module-dropdown" popper-class="uirb-dropdown-popover module-popover">
        <el-option v-access="menu.rightKey" v-for="menu in menus" :key="menu.id" :value="menu.name">
          <router-link :to="menu.path">{{ menu.name }}</router-link>
        </el-option>
      </el-select>

      <!-- 系统配置模块 -->
      <div v-else class="fl system-module">{{ moduleName }}</div>

      <!-- 菜单导航 -->
      <div class="fl nav-bar">
        <router-link v-access="nav.rightKey" v-for="(nav, index) in navs" :to="nav.path" :key="index"
                     :class="{'active-nav': nav.title === curNav}" class="fl nav-item" @click.native="transitionTo(nav)" v-text="nav.title"/>
      </div>
    </div>

    <!-- 右侧用户中心 -->
    <div v-clickoutside="handleClose" class="fr user-dropdown">
      <div @click.stop="isMsgMenuShow = !isMsgMenuShow">
        <span>{{ loginUserInfo.actualName || loginUserInfo.userName }}</span>
        <i :class="{'is-reverse': isMsgMenuShow}" class="el-icon-caret-bottom"/>
      </div>
      <transition name="el-zoom-in-top">
        <ul v-if="isMsgMenuShow" class="uirb-dropdown">
          <li @click="logout">退出登录</li>
        </ul>
      </transition>
    </div>

    <a v-if="moduleName !== '回收站' && $checkRight('recyclebin')" class="fr recycle-icon" title="回收站" @click="openNewTab('/recycle')"/>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'
import { FRONT_VERSION } from '@/config/index'

export default {
  name: 'ComHeader',

  directives: { Clickoutside },

  props: {
    menus: {
      type: Array,
      default: () => [
        {
          id: 'model',
          name: '资源模型',
          path: '/model',
          rightKey: 'model'
        },
        {
          id: 'collection',
          name: '资源归集',
          path: '/collection',
          rightKey: 'aggr'
        },
        {
          id: 'manage',
          name: '数据管理',
          path: '/manage',
          rightKey: 'datamgt'
        }
      ]
    },

    navs: {
      type: Array,
      default: () => []
    },

    moduleName: {
      type: String,
      default: ''
    },

    reload: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      logoUrl: './static/logo/logo.png',
      loginUserInfo: {},
      isMenuShow: false,
      isInfoDialogShow: false,
      isPwdDialogShow: false,
      isMsgMenuShow: false,
      curModule: null,
      curNav: ''
    }
  },

  created() {
    this.queryLoginUser()
  },

  mounted() {
    this.curNav = this.$route.meta.title
    if (this.menus.length > 0) {
      let curModule = this.menus.find(item => this.$route.path.indexOf(item.id) !== -1)
      this.curModule = curModule && curModule.name
    }

    this.queryVersionData()
  },

  methods: {
    /**
     * 获取当前用户信息
     */
    queryLoginUser() {
      this.$api.queryLoginUser().then(data => {
        localStorage.setItem('curUser', data.userName)
        this.loginUserInfo = Object.assign({}, data)
      })
    },

    /**
     * 点击导航，切换模块
     */
    transitionTo(nav) {
      // 重复点击模块导航时，重新渲染模板组件
      if (nav.title === this.curNav) {
        this.reload()
      }
      this.curNav = nav.title
    },

    logout () {
      this.$api.logout()
    },

    handleClose () {
      this.isMsgMenuShow = false
    },

    /**
     * 获取版本号信息
     */
    queryVersionData () {
      this.$api.queryVersionData().then(data => {
        data.unshift(FRONT_VERSION)
        return console.table(data)
      })
    }
  }
}
</script>

<style lang="scss">
.module-popover.uirb-dropdown-popover {
  margin-top: 3px;

  .el-select-dropdown__item {
    padding: 0;
  }

  .el-select-dropdown__item a {
    display: block;
    padding: 0 10px;
  }
}
</style>
