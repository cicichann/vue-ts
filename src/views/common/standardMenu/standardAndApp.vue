<template>
  <div v-clickoutside="handleClose" class="uirb-standard-dropdown">
    <el-button :title="currentSelected.name" size="small" type="primary" @click.stop="isMenuShow = !isMenuShow">
      <span class="standard-name fl">{{ currentSelected.name }}</span>
      <i v-if="standards.length > 1 || apps.length > 1" :class="{'is-reverse': isMenuShow}" class="fr el-icon-arrow-down"/>
    </el-button>

    <transition name="el-zoom-in-top">
      <ul v-if="(standards.length > 1 || apps.length > 1) && isMenuShow" class="uirb-dropdown">
        <!-- 资源库标准 -->
        <p class="content-title">资源库标准</p>
        <li v-for="standard in standards" :key="standard.id" :title="standard.name" :class="{'active': standard.name === currentSelected.name}">
          <p class="overflow" @click="selecteStandard('standard', standard)">{{ standard.name }}</p>
        </li>

        <!-- 应用列表 -->
        <p class="content-title">应用</p>
        <li v-for="app in apps" :key="app.id" :id="'app' + app.id" :title="app.name"
            :class="{'active': app.id === currentSelected.id || app.id === selectedApp.id || app.id === currentSelected.appId}">
          <p slot="reference" :title="app.name" :class="{'with-arrow': app.children && app.children.length > 0}" class="overflow"
             @click="selecteStandard('app', { id: app.id, name: app.name, children: app.children })">
            {{ app.name }}<i v-if="app.children && app.children.length > 0" class="el-icon-caret-right"></i>
          </p>
        </li>
      </ul>
    </transition>

    <el-popover v-model="visible" placement="right-start" trigger="manual" width="200" popper-class="uirb-standard-popover">
      <ul v-if="selectedApp.children && selectedApp.children.length > 0">
        <li v-for="item in selectedApp.children" :key="item.id" :title="item.name" :class="{'active': +item.id === +currentSelected.standardId}" class="overflow"
            @click="selecteStandard('app', { id: selectedApp.id, standardId: item.id, name: item.name, appName: selectedApp.name })">
          {{ item.name }}
        </li>
      </ul>
    </el-popover>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import { getStandard } from '@/utils/index'

export default {
  name: 'StandardAndAppMenu',

  directives: { Clickoutside },

  data() {
    return {
      currentSelected: {}, // 当前标准
      isMenuShow: false, //下拉默认不展示
      standards: [], // 所有标准列表
      apps: [],
      visible: false, // 子标准面板默认隐藏
      selectedApp: {} // 当前激活应用
    }
  },

  watch: {
    isMenuShow(val) {
      if (val) {
        this.$nextTick(() => {
          document.querySelector('.uirb-standard-dropdown ul').addEventListener('scroll', (e) => {
            this.visible = false
          })
        })
      }
    }
  },

  mounted () {
    Promise.all([
      this.queryStandard(),
      this.queryApps()
    ]).then(values => {
      this.standards = values[0]
      this.apps = values[1]

      this.initSelect(localStorage.getItem('inforepo-selectType') || 'standard')
    })
  },

  methods: {
    handleClose () {
      this.isMenuShow = false
      this.visible = false
    },

    /**
     * 获取标准列表
     */
    queryStandard () {
      return new Promise((resolve) => {
        this.$api.queryAuthStandardList().then(data => { resolve(data) })
      })
    },

    /**
     * 获取应用列表
     */
    queryApps () {
      return new Promise((resolve) => {
        this.$api.queryApps().then(data => {
          resolve( data.map(app => ({name: app.appName, id: app.id, children: app.children})) )
        })
      })
    },

    /**
     * 修改选择项
     * @param {String} type 选择类型
     * @param {obj} item 目标项
     */
    selecteStandard(type, item) {
      if (item.children && item.children.length > 0) {
        let warp = document.querySelector('.side-bar')
        let subMenu = document.querySelector('.uirb-standard-popover')
        let topDis = document.querySelector('#app' + item.id).offsetTop - document.querySelector('.uirb-standard-dropdown ul').scrollTop + 36
        if (warp.getBoundingClientRect().height < (topDis + item.children.length * 36)) {
          subMenu.style.top = '35px'
          subMenu.style.maxHeight = 'calc(100vh - 100px)'
        } else {
          subMenu.style.top = topDis + 'px'
        }
        this.selectedApp = item
        this.visible = true
        return
      } else {
        this.selectedApp = {}
        this.isMenuShow = false
        this.visible = false
      }

      // 资源库标准
      if (type === 'standard') {
        this.currentSelected = { standardId: item.id, name: item.name }
      // 资源库类型应用下的标准
      } else if (type === 'app' && item.standardId) {
        this.currentSelected = { appId: item.id, name: item.name, standardId: item.standardId, appName: item.appName }
      // 普通应用
      } else {
        this.currentSelected = { appId: item.id, name: item.name }
      }

      localStorage.setItem('inforepo-selectType', type)
      localStorage.setItem(type + '-' + localStorage.curUser, JSON.stringify(item))

      this.$emit('callback', this.currentSelected, this.standards, type)
    },

    /**
     * 初始化标准菜单数据
     * @param {arr} type 上次选择记忆的类型
     */
    initSelect(type = 'standard') {
      let list = type === 'standard' ? this.standards : this.apps
      let selectId = type === 'standard' ? this.$route.query.standardid : this.$route.query.appid

      getStandard(list, selectId, type).then(data => {
        if (data) {
          this.currentSelected = { standardId: '', appId: '', name: data.name }
          // 资源库类型应用下的标准
          if (type === 'app' && (data.standardId || (data.children && data.children.length))) {
            this.currentSelected.standardId = data.standardId || this.$route.query.appStandardid || data.children[0].id
            this.currentSelected.appId = data.id
            this.currentSelected.appName = list.find(item => item.id === data.id).name

            if (data.children && data.children.length) {
              this.currentSelected.name = list
                .find(item => item.id === data.id).children
                .find(standard => standard.id === +this.currentSelected.standardId).name
            }

            this.selectedApp = { id: data.id, name: this.currentSelected.appName }

          // 资源库标准
          } else if (type === 'standard') {
            this.currentSelected.standardId = data.id

          // 普通应用
          } else {
            this.currentSelected.appId = data.id
          }
        }
        this.$emit('callback', this.currentSelected, this.standards, type)
      })
    }
  }
}
</script>

<style lang="scss">
.content-title {
  height: 40px;
  line-height: 40px;
  background-color: #ffffff;
  text-indent: 16px;
  color: #969ea6;
}
</style>
