<template>
  <el-dialog :close-on-click-modal="false" :visible.sync="visible" title="移动到">
    <div v-clickoutside="handleClose" class="side-head">
      <!-- 分类模糊检索 -->
      <el-input v-model="status.searchText" class="search-input" placeholder="请输入关键词" suffix-icon="search"
                @input="querySearchList" @focus="status.isResultShow = true">
        <i slot="suffix" class="input-icon" />
      </el-input>
      <div v-loading="searchLoading" v-if="status.isResultShow" v-show="status.searchText.length > 0" class="search-result">
        <ul v-if="data.resultList.length > 0">
          <li v-for="item in data.resultList" :key="item.path" :title="item.title" @click="locateCategory(item)" v-html="item.nav" />
        </ul>
        <p v-else class="not-data">暂无数据</p>
      </div>
    </div>

    <!-- 分类树 -->
    <div class="move-wrapper">
      <side-menu v-loading="loading" ref="sideMenu" :data="categoryArr" :props="treeProps" :check-disabled="checkDisabled"
                 :add-class-name="addClassName" :standard-id="route.query.standardid" element-loading-text="数据加载中" @categoryChange="handleCategoryclick" />
    </div>

    <span slot="footer">
      <el-button :disabled="selectId.disabled || selectId === '' || loading" type="primary" @click="submitMoveTo">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import sideMenu from '@/views/common/tree/index.vue'
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'moveCategoryDialog',

  components: {
    sideMenu
  },

  directives: { Clickoutside },

  props: {
    selectArray: {
      type: Array,
      default: () => []
    },
    route: {
      type: Object,
      default: () => { }
    }
  },

  data () {
    return {
      categoryArr: [], //分类列表
      selectId: '0', //选中id
      loading: false, //loading样式
      searchLoading: false, // 检索loading
      status: {
        searchText: '',
        isResultShow: false
      },
      data: {
        resultList: []
      },
      treeProps: {
        isDefaultCollapse: true
      }
    }
  },

  mounted () {
    this.mountedFunc()
  },

  methods: {
    /**
     * 请求列表数据
     * @param {id}
     */
    queryList (id) {
      this.loading = true
      let params = {
        parentCategoryId: id || 0,
        containsChildren: 0
      }
      this.$api.queryResClassifyList({standardId: this.route.query.standardid}, params).then(data => {
        data.unshift({category_name: '全部分类', id: 0, hasChildren: 0})
        this.categoryArr = data
        this.loading = false
      })
    },

    /**
     * 初始化函数
     */
    mountedFunc () {
      this.status.searchText = ''
      let param = this.route.query.parentCategoryId
      if (param === 0 || param === '') {
        this.selectId = ''
      } else {
        this.selectId = '0'
      }
      this.queryList()
    },

    /**
     * 是否禁用节点
     */
    checkDisabled (node, parentNode) {
      let result = this.selectArray.some(item => {
        // 自己、当前父节点、自己的子节点禁用移动
        return +item === +node.id || Number(this.route.query.categoryid) === +node.id
        || (parentNode && parentNode.data.disabled && this.route.query.categoryid !== parentNode.data.id)
      })
      return result
    },

    /**
     * 定位
     */
    locateCategory (data) {
      this.status.isResultShow = false
      this.$refs.sideMenu.locateNode(data.id, true)
    },

    /**
     * 检索
     */
    querySearchList () {
      this.searchLoading = true
      this.data.resultList = []
      let url = {
        standardId: this.route.query.standardid
      }

      let params = {
        searchText: this.status.searchText,
        pageIndex: 1,
        pageSize: 10
      }
      this.$api.vagueSearch(url, params).then(data => {
        this.data.resultList = data
        this.status.isResultShow = true
        let _this = this
        this.data.resultList.forEach((item, index) => {
          item.title = item.nav
          if (_this.status.searchText !== '') {
            var arr = item.nav.split('/')
            var key = _this.status.searchText
            arr[arr.length - 1] = arr[arr.length - 1].replace(new RegExp(key, 'g'), `<span class="red-word">${_this.status.searchText}</span>`)
            item.nav = arr.join('/')
          } else {
            _this.status.isResultShow = false
          }
        })
        this.searchLoading = false
      }, () => {
        this.searchLoading = false
      })
    },

    /**
     * 点击移动
     * @param {state, done}
     */
    submitMoveTo () {
      this.loading = true
      let params = {
        targetCategoryId: this.selectId || 0,
        categoryIds: this.selectArray.join(',')
      }
      this.$api.categorymoveTo({standardId: this.route.query.standardid}, params).then(data => {
        this.loading = false
        this.$trsModalSuccess('移动分类成功！')
        this.$close([this.selectId, this.selectArray.join(',')])
      }, () => {
        this.loading = false
      })
    },

    /**
     * 添加类名
     */
    addClassName() {
      let ele = document.querySelectorAll('.disabled-item')
      let ele2 = document.querySelectorAll('.disabled-wrapper')
      ele2.forEach((item, index) => {
        item.setAttribute('class', 'el-tree-node__content')
      })
      ele.forEach((item, index) => {
        var className = item.parentElement.getAttribute('class')
        if(className) {
          item.parentElement.setAttribute('class','el-tree-node__content disabled-wrapper')
        }
      })
    },

    /**
     * 所选分类切换
     */
    handleCategoryclick (data) {
      if (!data.disabled) {
        this.selectId = data.id
      } else {
        this.selectId = ''
      }
    },

    /**
     * 关闭检索结果列表
     */
    handleClose () {
      this.status.isResultShow = false
    }
  }
}
</script>

<style lang="scss">
.side-head {
  position: relative;
  padding: 7px 8px;
  border: 1px solid #e2ebf1;
  background: #f0f5fa;

  .el-input {
    width: 100%;
    margin-bottom: -1px;

    input {
      height: 30px;
      font-size: 13px;
    }
  }
}

.move-wrapper {
  margin-top: -1px;
  height: 315px;
  border-radius: 3px;
  border: 1px solid #e6ebef;

  .in-tree {
    height: 100%;
  }

  .el-tree {
    // 树节点-图标
    .el-tree-node__expand-icon {
      // 未展开
      &:before {
        background-image: url("~@/assets/images/tree-expand-icon-arrow.png");
      }

      // 展开
      &.expanded {
        &:before {
          background-image: url("~@/assets/images/tree-expanded-icon-arrow.png");
        }
      }

      // 叶子节点
      &.is-leaf:before {
        width: 10px;
        height: 5px;
        background-image: url("~@/assets/images/tree-is-leaf.png");
      }
    }

    // 选中的树节点
    .is-current > .el-tree-node__content {
      position: relative;
      color: #fff;
      background: #4bd083;

      // 树节点-图标
      .el-tree-node__expand-icon {
        // 未展开
        &:before {
          background-image: url("~@/assets/images/tree-expand-icon-arrow1.png");
        }

        // 展开
        &.expanded {
          &:before {
            background-image: url("~@/assets/images/tree-expanded-icon-arrow1.png");
          }
        }
      }

      // 禁用的节点
      &.disabled-wrapper {
        color: #c5c8cd;
        background: #fff;

        .el-tree-node__expand-icon {
          // 未展开
          &:before {
            background-image: url("~@/assets/images/tree-expand-icon-arrow.png");
          }

          // 展开
          &.expanded {
            &:before {
              background-image: url("~@/assets/images/tree-expanded-icon-arrow.png");
            }
          }
        }
      }
    }

    .disabled-wrapper {
      color: #c5c8cd;
      background: #fff;
      cursor: not-allowed;
    }
  }
}
</style>
