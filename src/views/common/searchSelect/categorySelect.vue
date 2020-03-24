<template>
  <div class="uirb-search-select uirb-category-select">
    <div class="el-select">
      <div class="el-input">
        <p v-if="selectedCategories.length > 0" class="tag-group">
          <el-tag v-for="category in selectedCategories" :key="category.id" closable @close="handleRemoveTag(category)">{{ category.category_name }}</el-tag>
        </p>
        <el-input v-model="searchText" type="text" autocomplete="off" placeholder="请输入分类名称" @input="searchCategory"/>
        <span class="el-input__suffix" @click.stop="toggleShow">
          <span class="el-input__suffix-inner">
            <i :class="{'is-reverse': showSelect}" class="el-select__caret el-input__icon el-icon-arrow-up"></i>
          </span>
        </span>
      </div>
    </div>

    <!-- 分类树 -->
    <el-collapse-transition>
      <div v-show="showSelect" class="el-select-dropdown el-popper el-tree-arrow">
        <el-tree v-loading="loading" ref="category" :data="categoryList" :props="treeProp" :load="queryCategory" :check-strictly = "true"
                 node-key="id" element-loading-text="数据加载中..." show-checkbox lazy @check-change="updateCheckedCatList"/>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script>

export default {
  name: 'categorySelect',

  props: {
    standardId: {
      type: Number,
      default: 0
    },
    checkedCategories: {
      type: Array,
      default: () => []
    },
    getCategory: {
      type: Function,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      categoryList: [], // 分类树数据
      showSelect: false, // 分类树面板默认隐藏
      searchText: '', // 检索词
      selectedCategories: [], // 选中分类
      defaultCheckedKeys: this.checkedKeys, // 选中分类的id
      treeProp: {
        children: 'children',
        label: 'category_name',
        isLeaf: (data, node) => {
          return node.data.hasChildren === 0
        },
        disabled: (data, node) => {
          return node.data.hasRight === 0
        }
      }
    }
  },

  watch: {
    standardId() {
      this.queryCategory()
    },

    checkedCategories : {
      deep: true,
      immediate: true,
      handler(newVal) {
        this.selectedCategories = JSON.parse(JSON.stringify(newVal))
      }
    },

    selectedCategories (newVal) {
      this.focusCategory()
      this.$refs.category.setCheckedKeys(newVal.map(item => item.id))
    }
  },

  methods: {
    toggleShow () {
      this.showSelect = !this.showSelect
      if(this.showSelect) this.queryCategory()
    },

    /**
     * 请求分类数据
     */
    queryCategory (node, resolve) {
      if(node && node.level === 0)  return resolve(node.data)

      this.loading = true
      let params = {
        standardId : this.standardId,
        categoryId: node ? node.data.id : 0,
        searchText: this.searchText
      }
      this.getCategory(params).then(data => {
        if(node) {
          this.$set(node.data, 'children', data)
          resolve(data)
        } else {
          this.categoryList = data
        }

        this.$nextTick(() => {
          if(this.searchText) {
            this.showSelect = true
            this.runQueue(data, this.iterator)
          }
        })
        this.syncCheckedCat()
        this.focusCategory()
        this.loading = false
      })
    },

    /**
     * 分类检索
     */
    searchCategory () {
      this.queryCategory()
    },

    /**
     * 点击检索结果
     */
    locateItem (event, item) {
      event.stopPropagation()
      this.isResultShow = true
    },

    /**
     * 选中/取消选中树节点
     */
    updateCheckedCatList (currentNode, checked) {
      let checkedNodes = this.selectedCategories
      if(checked && !checkedNodes.some(item => { return item.id === currentNode.id})) {
        checkedNodes.push(currentNode)
      } else if(!checked && checkedNodes.some(item => { return item.id === currentNode.id})) {
        checkedNodes.splice(checkedNodes.indexOf(checkedNodes.find(item => { return item.id === currentNode.id })), 1)
      }
      this.$emit('category-change', this.selectedCategories)
    },

    /**
     * 移除选中分类
     */
    handleRemoveTag (category) {
      this.selectedCategories.map((item, index) => {
        if (item.id === category.id) {
          this.selectedCategories.splice(index, 1)
        }
      })
      this.syncCheckedCat()
      this.$emit('category-change', this.selectedCategories)
    },

    /**
     * 同步已选分类
     */
    syncCheckedCat () {
      this.defaultCheckedKeys = []
      this.selectedCategories.map(item => {
        this.defaultCheckedKeys.push(item.id)
      })
      this.$refs.category && this.$refs.category.setCheckedKeys(this.defaultCheckedKeys)
    },

    /**
     * 定位视觉焦点在分类选择区
     */
    focusCategory () {
      let ele = document.querySelector('.el-dialog__body')
      this.$nextTick(() => {
        ele.scrollTop = ele.scrollHeight
      })
    },

    /**
     * 设置子节点数据队列
     */
    runQueue(data, fn, callback) {
      Array.prototype.map.call(data, item => {
        fn(item, () => {
          if (item.hasChildren && item.children.length > 0) {
            this.$nextTick(() => {
              this.runQueue(item.children, fn, callback)
            })
          }
        })
      })
    },

    /**
     * 设置子节点数据
     * @param id  父节点id
     * @param resolve
     */
    iterator(category, resolve) {
      let node = this.$refs.category.getNode(category.id)
      node.expanded = true

      if (node.data.hasChildren && !node.childNodes.length) {
        this.$set(node.data, 'children', category.children)
        this.$refs.category.updateKeyChildren(category.id, category.children)
        this.$nextTick(() => {
          this.syncCheckedCat()
        })
        resolve()
      } else {
        resolve()
      }
    },
  }
}
</script>

<style lang="scss">
.uirb-search-select {

  .el-select {
    width: 320px;
    border-radius: 3px;
    border: 1px solid #ddd;

    &:hover {
      border-color: #3e84f5;
    }
  }

  .el-input {
    height: auto;
    line-height: initial;

    .el-input__inner {
      width: auto;
      border: none;
    }

    .el-input__icon {
      height: 40px;
    }
  }

  .tag-group {
    display: inline-block;
    padding: 7px 20px 0 7px;
  }

  .el-tag {
    margin: 0 7px 7px 0;
    height: 26px;
    color: #2A8BED;
    line-height: 24px;
    border-radius: 3px;
    border: 1px dashed #E5E9EE;
    background: #fff;

    .el-icon-close, .el-icon-close:hover {
      color: #C5C8CC;
      background: transparent;
    }
  }

  .el-select-dropdown {
    position: static;
    top: 290px;
    z-index: 999;
    width: 320px;
  }

  .el-tree {
    max-height: 270px;
    padding: 10px 15px;
    overflow-y: auto;
  }

  .el-tree-node__content {
    position: relative;

    label {
      position: absolute;
      right: 0;
      top: 0;
    }

    .el-tree-node__label {
      padding-right: 30px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>
