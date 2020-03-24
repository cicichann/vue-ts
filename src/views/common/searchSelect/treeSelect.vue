<template>
  <!-- 复杂树形结构可输入下拉组件 -->
  <div v-clickoutside="handleClose" class="uirb-search-select uirb-tree-select">
    <div ref="reference" class="el-select dropdown-select">
      <div class="el-input">
        <span style="display: contents;">
          <el-tag v-for="(item, index) in selectedList" :key="index" :class="{'disabled-tag': checkDisabled(item)}"
                  class="fl" closable @close.stop="handleSelectionChange(item)">
            <span :title="item.name">{{ item.name }}</span>
          </el-tag>
        </span>
        <input ref="selectInput" v-model.trim="searchText" :placeholder="placeholderText" type="text" autocomplete="off" class="el-select__input fl" @focus="toggleShow(true)">
      </div>
      <span class="el-input__suffix" @click.stop="toggleShow(false)">
        <span class="el-input__suffix-inner">
          <i :class="{'is-reverse': showDropSelect}" class="el-select__caret el-input__icon el-icon-arrow-up"></i>
        </span>
      </span>
    </div>

    <template v-if="appendToBody">
      <!-- 检索下拉 -->
      <transition name="el-zoom-in-top">
        <uirb-popover v-show="showSearchSelect && searchText" ref="searchDrop" popper-class="tree-select is-multiple">
          <ul v-loading="loading" class="el-select-dropdown__list" element-loading-text="数据加载中...">
            <li v-for="item in searchList" :key="item.id" :class="{'selected': checkSelect(item)}" :title="item.name"
                class="el-select-dropdown__item" @click="handleSelectionChange(item, false)">{{ item.name }}</li>
            <p v-if="searchList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </uirb-popover>
      </transition>

      <!-- 箭头下拉 -->
      <transition name="el-zoom-in-top">
        <uirb-popover v-show="showDropSelect" ref="treeDrop" popper-class="tree-select el-tree-arrow">
          <el-tree v-loading="loading" ref="category" :data="dropList" :props="treeProp" :load="getTreeData" :check-strictly = "true"
                   class="el-select-dropdown" node-key="id" element-loading-text="数据加载中..." show-checkbox lazy @check="handleSelectionChange"/>
        </uirb-popover>
      </transition>
    </template>

    <template v-else>
      <!-- 检索下拉 -->
      <transition name="el-zoom-in-top">
        <div v-show="showSearchSelect && searchText" class="tree-select el-select-dropdown">
          <ul v-loading="loading" class="el-select-dropdown__list" element-loading-text="数据加载中...">
            <li v-for="item in searchList" :key="item.id" :class="{'selected': checkSelect(item)}" :title="item.name"
                class="el-select-dropdown__item" @click="handleSelectionChange(item, false)">{{ item.name }}</li>
            <p v-if="searchList.length === 0" class="el-select-dropdown__nodata">暂无数据</p>
          </ul>
        </div>
      </transition>

      <!-- 箭头下拉 -->
      <transition name="el-zoom-in-top">
        <div v-show="showDropSelect" class="tree-select el-tree-arrow el-select-dropdown">
          <el-tree v-loading="loading" ref="category" :data="dropList" :props="treeProp" :load="getTreeData" :check-strictly = "true"
                   node-key="id" element-loading-text="数据加载中..." show-checkbox lazy @check="handleSelectionChange"/>
        </div>
      </transition>
    </template>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import uirbPopover from './popover';

export default {
  name: 'treeSelect',

  components: { uirbPopover },

  directives: { Clickoutside },

  props: {
    // 已选项，只识别name、id属性，不符合需要提前格式化
    selected: {
      type: Array,
      default: () => []
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

    treeProp: {
      type: Object,
      default: () => {
        return {
          children: 'children',
          label: 'name',
          isLeaf: (data, node) => {
            return Number(node.data.hasChildren) === 0
          },
          disabled: (data, node) => {
            return node.data.hasRight === 0
          }
        }
      }
    },

    // 是否添加到body上
    appendToBody: {
      type: Boolean,
      default: true
    },

    checkDisabled: {
      type: Function,
      default: () => {
        return false
      }
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
      loading: false
    }
  },

  computed: {
    placeholderText () {
      return this.selectedList.length > 0 ? '' : this.placeholder
    }
  },

  watch: {
    searchText (newVal) {
      if (newVal) {
        this.loading = true
        this.searchList = []
        this.querySearchList({searchText: newVal}).then(data => {
          this.searchList = data
          this.loading = false
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
    selectedList (newVal) {
      this.$refs.category.setCheckedKeys(newVal.map(item => item.id))
    }
  },

  mounted () {
    this.loading = true
    this.queryAllList().then(data => {
      this.dropList = data
      this.loading = false
    })
    this.$refs.category.setCheckedKeys(this.selectedList.map(item => item.id))
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
     * 请求分类数据
     */
    getTreeData (node, resolve) {
      if(node && node.level === 0)  return resolve(node.data)

      let params = {
        standardId : this.standardId,
        categoryId: node ? node.data.id : 0,
        searchText: this.searchText
      }
      this.queryAllList(params).then(data => {
        this.$set(node.data, 'children', data)
        resolve(data)
      })
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
          this.$nextTick(() => { this.$refs.treeDrop.updatePopper() })
        }
        if (this.showSearchSelect) {
          this.$nextTick(() => { this.$refs.searchDrop.updatePopper() })
        }
      }
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
     * 修改已选项
     */
    handleSelectionChange (value, filterable = true) {
      if (!value) return

      this.searchText = ''
      this.showSearchSelect = false

      if (this.checkDisabled(value)) return

      if (this.selectedList.length === 0 || !this.selectedList.some(item => item.id === value.id)) {
        this.selectedList.push(value)
      } else {
        if (filterable) this.selectedList = this.selectedList.filter(item => item.id !== value.id)
      }

      this.updatePopper()

      this.$emit('selectedChange', this.selectedList)
    }
  }
}
</script>

<style lang="scss">
.uirb-tree-select {
  .el-select {
    width: 320px;
    border-radius: 3px;
    border: 1px solid #e5e9ee;

    &:hover {
      border-color: #3e84f5;
    }
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

  .el-select .el-tag .el-tag__close {
    top: -1px;
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

  .dropdown-select .el-input {
    padding-right: 30px;
  }

  // 下拉
  .el-select-dropdown ul {
    max-height: 200px;
    overflow: auto;
  }
}

// 下拉气泡
.tree-select {
  width: 320px !important;
  z-index: 9999 !important;

  // 树结构
  .el-tree {
    padding: 10px 15px;
    border: 0;
  }

  .el-tree-node__content {
    position: relative;

    label {
      position: absolute;
      right: 0;
      top: 2px;
    }

    .el-tree-node__label {
      padding-right: 30px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .el-select-dropdown__nodata {
    height: 50px;
    line-height: 50px;
    text-align: center;
  }
}

.uirb-popover.tree-select .el-tree-node__content label {
  top: 7px;
}
</style>
