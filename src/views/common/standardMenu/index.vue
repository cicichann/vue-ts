<template>
  <div v-clickoutside="handleClose" class="uirb-standard-dropdown">
    <el-button :title="currentStandard.name" size="small" type="primary" @click.stop="isMenuShow = !isMenuShow">
      <span class="standard-name fl">{{ currentStandard.name }}</span>
      <i v-if="menus.length > 1" :class="{'is-reverse': isMenuShow}" class="fr el-icon-arrow-down"/>
    </el-button>
    <transition name="el-zoom-in-top">
      <ul v-if="isMenuShow && menus.length > 1" class="uirb-dropdown">
        <li v-for="(menu, index) in menus" :key="menu.id" :title="menu.name" :class="{'active': menu.name === currentStandard.name}"
            class="overflow" @click="selecteStandard(index, menu)">{{ menu.name }}</li>
      </ul>
    </transition>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import { getStandard } from '@/utils/index'

export default {
  name: 'StandardMenu',

  directives: { Clickoutside },

  props: {
    auth: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      currentStandard: {}, // 当前标准
      isMenuShow: false, //下拉默认不展示
      menus: [] // 所有标准列表
    }
  },

  created() {
    if(!this.auth) {
      this.$api.queryStandardList().then(data => {
        this.initData(data)
      })
    } else {
      this.$api.queryAuthStandardList().then(data => {
        this.initData(data)
      })
    }
  },

  methods: {
    handleClose () {
      this.isMenuShow = false
    },

    /**
     * 选择标准
     * @param {int} index 当前标准索引值
     * @param {obj} item 当前标准
     */
    selecteStandard(index, item) {
      this.currentStandard = item
      this.isMenuShow = false

      // 标准记忆loaclStorage重写
      localStorage.setItem('standard-' + localStorage.curUser, JSON.stringify(this.currentStandard))
      this.$emit('callback', this.currentStandard, this.menus)
    },

    /**
     * 初始化标准菜单数据
     * @param {arr} data 当前标准数据
     */
    initData(data) {
      this.menus = data
      this.currentStandard = { id: '', name: '' }

      getStandard(data, this.$route.query.standardid).then(standard => {
        if (standard) this.currentStandard = standard
        this.$emit('callback', this.currentStandard, this.menus)
      })
    }
  }
}
</script>
