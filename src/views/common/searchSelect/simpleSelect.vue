<template>
  <!-- 简单一级可输入下拉组件 -->
  <div v-clickoutside="handleClose" class="uirb-search-select uirb-simple-select">
    <div ref="reference" :class="{'dropdown-select': dropdown}" class="el-select">
      <div class="el-input">
        <span style="display: contents;">
          <el-tag v-for="(item, index) in selectedList" :key="index" class="fl" closable @close="handleSelectionChange(item)">
            <span :title="item.name">{{ item.name }}</span>
          </el-tag>
        </span>
        <input ref="selectInput" v-model.trim="searchText" :placeholder="placeholderText" type="text" autocomplete="off"
               class="el-select__input fl" @focus="toggleShow(true)" @keyup.enter.prevent="inputEvent()" @blur="inputEvent()">
      </div>
      <span v-if="dropdown" class="el-input__suffix" @click.stop="toggleShow(false)">
        <span class="el-input__suffix-inner">
          <i :class="{'is-reverse': showDropSelect}" class="el-select__caret el-input__icon el-icon-arrow-up"></i>
        </span>
      </span>
    </div>

    <template v-if="appendToBody">
      <!-- 检索下拉 -->
      <transition name="el-zoom-in-top">
        <uirb-popover v-show="search && showSearchSelect && searchText" ref="searchDrop" popper-class="simple-select is-multiple">
          <ul v-loading="loading" class="el-select-dropdown__list" element-loading-text="数据加载中...">
            <li v-for="item in searchList" :key="item.id" :class="{'selected': checkSelect(item)}" :title="item.name"
                class="el-select-dropdown__item" @click="handleSelectionChange(item, false)">{{ item.name }}</li>
            <p v-if="searchList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </uirb-popover>
      </transition>

      <!-- 箭头下拉 -->
      <transition name="el-zoom-in-top">
        <uirb-popover v-infinite-scroll="scrollChange" v-show="dropdown && showDropSelect" ref="simpleDrop" popper-class="simple-select">
          <ul class="el-select-dropdown__list">
            <li v-if="allSelect" class="dropdown-all">
              <span class="overflow el-select-dropdown__text fl">全部</span>
              <el-checkbox v-model="ifSelectAll" class="fr" @change="toggleSelectAll()"></el-checkbox>
            </li>
            <li v-for="item in dropList" :key="item.id" class="el-select-dropdown__item" @click.prevent="handleSelectionChange(item)">
              <span :title="item.name" class="overflow el-select-dropdown__text fl">{{ item.name }}</span>
              <el-checkbox :value="checkSelect(item)" class="fr"></el-checkbox>
            </li>
            <p v-if="dropList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </uirb-popover>
      </transition>
    </template>

    <template v-else>
      <!-- 检索下拉 -->
      <transition name="el-zoom-in-top">
        <div v-show="search && showSearchSelect && searchText" class="simple-select el-select-dropdown">
          <ul v-loading="loading" class="el-select-dropdown__list" element-loading-text="数据加载中...">
            <li v-for="item in searchList" :key="item.id" :class="{'selected': checkSelect(item)}" :title="item.name"
                class="el-select-dropdown__item" @click="handleSelectionChange(item, false)">{{ item.name }}</li>
            <p v-if="searchList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </div>
      </transition>

      <!-- 箭头下拉 -->
      <transition name="el-zoom-in-top">
        <div v-infinite-scroll="scrollChange" v-show="dropdown && showDropSelect" class="simple-select el-select-dropdown">
          <ul class="el-select-dropdown__list">
            <li v-if="allSelect" class="dropdown-all">
              <span class="overflow el-select-dropdown__text fl">全部</span>
              <el-checkbox v-model="ifSelectAll" class="fr" @change="toggleSelectAll"></el-checkbox>
            </li>
            <li v-for="item in dropList" :key="item.id" class="el-select-dropdown__item" @click.prevent="handleSelectionChange(item)">
              <span :title="item.name" class="overflow el-select-dropdown__text fl">{{ item.name }}</span>
              <el-checkbox :value="checkSelect(item)" class="fr"></el-checkbox>
            </li>
            <p v-if="dropList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </div>
      </transition>
    </template>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import uirbPopover from './popover';

export default {
  name: 'simpleSelect',

  components: { uirbPopover },

  directives: { Clickoutside },

  props: {
    // 已选项，只识别name、id属性，不符合需要提前格式化
    selected: {
      type: Array,
      default: () => []
    },

    // 是否可点击箭头下拉
    dropdown: {
      type: Boolean,
      default: false
    },

    // 是否可输入检索
    search: {
      type: Boolean,
      default: false
    },

    // 是否可手动输入，回车或失焦添加
    manualFill: {
      type: Boolean,
      default: false
    },

    // 是否支持全选/反选
    allSelect: {
      type: Boolean,
      default: false
    },

    placeholder: {
      type: String,
      default: '请输入关键词'
    },

    // 下拉列表数据请求方法，需要返回一个promise
    queryAllList: {
      type: Function,
      default: () => {
        return new Promise(resolve => { resolve() })
      }
    },

    // 检索下拉列表数据请求方法，需要返回一个promise
    querySearchList: {
      type: Function,
      default: () => {
        return new Promise(resolve => { resolve() })
      }
    },

    // 是否添加到body上
    appendToBody: {
      type: Boolean,
      default: true
    },

    // 全部下拉项是否懒加载
    isLazy: {
      type: Boolean,
      default: true
    }
  },

  data () {
    return {
      selectedList: [],
      searchText: '',
      showDropSelect: false,
      showSearchSelect: false,
      searchList: [],
      dropList: [],
      pageIndex: 1,
      loading: false,
      ifSelectAll: false
    }
  },

  computed: {
    placeholderText () {
      return this.selectedList.length > 0 ? '' : this.placeholder
    }
  },

  watch: {
    searchText (newVal) {
      if (this.search && newVal) {
        this.loading = true
        this.searchList = []
        this.querySearchList({searchText: newVal}).then(data => {
          this.loading = false
          this.searchList = data
        })
      }
    },
    selected : {
      handler(newVal) {
        this.selectedList = JSON.parse(JSON.stringify(newVal))
      },
      deep: true,
      immediate: true
    },
    'selectedList.length' (newVal, oldVal) {
      this.ifSelectAll = newVal === this.dropList.length
    }
  },

  methods: {
    /**
     * 检索下拉和点击下拉切换展示
     */
    toggleShow (isSearch) {
      if (isSearch) {
        this.showSearchSelect = isSearch
        this.showDropSelect = !isSearch
      } else {
        this.searchText = ''
        this.showSearchSelect = false
        this.showDropSelect = !this.showDropSelect
      }

      this.updatePopper()
    },

    /**
     * 关闭下拉处理
     */
    handleClose () {
      this.showSearchSelect = false
      this.showDropSelect = false
      this.searchText = ''
    },

    /**
     * 点击下拉列表懒加载，滚动请求数据
     */
    scrollChange () {
      if (this.dropList.length > 0 && !this.isLazy) return

      const params = {
        pageIndex: this.pageIndex,
        pageSize: 10
      }
      this.queryAllList(params).then(data => {
        if (data) this.dropList = this.dropList.concat(data)
        this.ifSelectAll = this.selectedList.length === this.dropList.length
        this.pageIndex ++
      })
    },

    /**
     * 输入框事件触发处理
     */
    inputEvent () {
      this.searchText = this.searchText.trim()
      if (this.manualFill && this.searchText) {
        if (!this.selectedList.some(item => item.name === this.searchText)) {
          // 填充手动输入的检索值
          this.handleSelectionChange({name: this.searchText })
        }
        this.searchText = ''
      }
    },

    toggleSelectAll () {
      if (!this.ifSelectAll) {
        this.selectedList = []
      } else {
        this.selectedList = this.dropList
      }
      this.updatePopper()
      this.$emit('selectedChange', this.selectedList)
    },

    /**
     * 检查复选框是否选中
     */
    checkSelect (item) {
      return this.selectedList.some(selected => selected.id === item.id)
    },

    updatePopper () {
      if (this.appendToBody) {
        if (this.showDropSelect) {
          this.$nextTick(() => { this.$refs.simpleDrop.updatePopper() })
        }
        if (this.showSearchSelect) {
          this.$nextTick(() => { this.$refs.searchDrop.updatePopper() })
        }
      }
    },

    /**
     * 修改已选项
     */
    handleSelectionChange (value, filterable = true) {
      if (!value) return

      if (!this.selectedList.some(item => item.name === value.name)) {
        this.selectedList.push(value)
      } else {
        if (filterable) this.selectedList = this.selectedList.filter(item => item.name !== value.name)
      }

      this.updatePopper()

      this.searchText = ''
      this.showSearchSelect = false
      this.$emit('selectedChange', this.selectedList)
    }
  }
}
</script>

<style lang="scss">
.uirb-simple-select {
  .el-select {
    width: 320px;
    border-radius: 3px;
    border: 1px solid #e5e9ee;

    &:hover {
      border-color: #3e84f5;
    }
  }

  .el-select .el-tag .el-tag__close {
    top: -1px;
  }

  .el-input {
    display: flex;
    flex-wrap: wrap;
    height: auto;
    line-height: initial;
    padding: 0px 15px;

    .el-input__inner {
      width: auto;
      border: none;
    }
  }

  .el-select-dropdown {
    position: static;
    top: 290px;
    z-index: 999;
    width: 320px;
  }

  input {
    flex-grow: 1;
    width: 0.0220022%;
    height: 38px !important;
    line-height: 38px !important;
    margin-left: 0;
  }

  i {
    cursor: pointer;
  }

  // 输入下拉
  .el-select__caret {
    transform: rotateZ(180deg);
  }
  .is-reverse {
    transform: rotateZ(0);
  }

  .dropdown-select {
    .el-input {
      padding-right: 30px;
    }
  }

  // 下拉
  .el-select-dropdown ul {
    max-height: 200px;
  }
}

.simple-select {
  width: 320px !important;

  .el-select-dropdown__text {
    display: inline-block;
    max-width: 260px;
  }

  .el-select-dropdown__nodata {
    height: 50px;
    line-height: 50px;
    text-align: center;
  }

  .dropdown-all {
    height: 30px;
    line-height: 30px;
    padding: 0 15px;
    color: #ccc;
    overflow: hidden;
  }
}
</style>
