<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="移动用户" custom-class="move-dialog" >
    <div v-loading="loading" class="move-dialog-container" element-loading-text="数据加载中...">

      <!-- 组织检索 -->
      <div class="move-head">
        <el-input v-model="status.searchText" placeholder="请输入关键词" @input="search" @focus="status.isResultShow = true" @click.native.stop>
          <i slot="suffix" class="input-icon" @click="search" />
        </el-input>
        <div v-loading="searchLoading" v-if="status.isResultShow && status.searchText.length > 0" class="search-result">
          <ul v-if="data.resultList.length > 0">
            <li v-for="item in data.resultList" :key="item.path" :title="item.nav" @click="locateItem(item)" v-html="item.navHighlighted" />
          </ul>
          <p v-else>暂无数据</p>
        </div>
      </div>

      <div class="move-body el-tree-arrow">
        <el-tree ref="groupTree" :data="data.groupTree" :props="defaultProps" :load="querySubGroup" :default-expanded-keys="data.expandIds" :check-strictly="true"
                 :expand-on-click-node="false" node-key="id" lazy @node-click="handleNodeClick">
          <span slot-scope="{ node }" :title="node.label" :class="{'disabled-item': node.disabled}" class="custom-tree-node">
            {{ node.label }}
          </span>
        </el-tree>
      </div>
    </div>

    <span slot="footer">
      <el-button :disabled="data.currentGroupId === '' || loading" type="primary" @click="confirmMove">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>

  </el-dialog>
</template>

<script>
export default {
  name: "moveUserDialog",

  props: {
    groupId: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    target: {
      type: String,
      default: 'group',
      required: true
    }
  },

  data() {
    return {
      loading: false,
      searchLoading: false, // 检索loading
      defaultProps: {
        label: "groupName",
        children: "children",
        isLeaf: (data, node) => {
          return data.hasChildren === 0
        }
      },
      data: {
        resultList: [], // 检索结果
        groupTree: [], // 组织树数据
        currentGroupId: '', // 当前选中的组织id
        expandIds: [] // 展开的组织数组
      },
      status: {
        searchText: '', // 检索输入
        isResultShow: false // 默认隐藏检索结果面板
      }
    }
  },

  mounted() {
    this.queryGroupTree()

    /**
     * 点击空白区域隐藏检索结果列表
     */
    document.addEventListener('click', (e) =>{
      this.status.isResultShow = false
    })
  },

  methods: {
    /**
     * 请求组织树数据
     */
    queryGroupTree() {
      this.loading = true
      let params = {
        parentId: "0",
        granularity: "ALL",
        containsChildren: "1"
      }

      this.$api.queryGroupList(params).then(data => {
        if(this.target === 'group') {
          this.data.groupTree.push({
            id: "0",
            groupId: "0",
            groupName: "全部组织",
            hasChildren: "1",
            children: this.initData(data.data)
          })
          this.data.expandIds.push('0')
        } else {
          this.data.groupTree = this.initData(data.data)
        }

        this.data.expandIds.push(data.data[0].id)
        this.$nextTick(() => {
          this.initDisableClass()
        })
        this.loading = false
      })
    },

    /**
     *  请求子组织
     */
    querySubGroup(node, resolve) {
      this.loading = true
      if (node.level === 0) return

      let params = {
        parentId: node.data.id,
        granularity: "ALL"
      }

      this.$api.queryGroupList(params).then(data => {
        resolve(this.initData(data.data))

        this.$nextTick(() => {
          this.initDisableClass()
          this.loading = false
        })
      })
    },

    /**
     * 点击树节点
     */
    handleNodeClick(node) {
      this.data.currentGroupId = node.disabled ? '' : node.id
    },

    /**
     * 点击确认按钮
     */
    confirmMove() {
      this.target === 'group' ? this.moveGroup() : this.moveUser()
    },

    /**
     * 移动组织
     */
    moveGroup() {
      this.loading = true
      let params = {
        targetGroupId: this.data.currentGroupId,
        groupIds: this.groupId
      }

      this.$api.moveGroup(params).then(data => {
        this.$close()
        this.$trsModalSuccess('移动组织成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 移动用户
     */
    moveUser() {
      this.loading = true
      let url = {
        id: this.groupId
      }
      let params = {
        targetId: this.data.currentGroupId,
        userIds: this.userId
      }

      this.$api.moveUser(url, params).then(data => {
        this.$close(this.data.currentGroupId)
        this.$trsModalSuccess('移动用户成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 模糊检索
     */
    search() {
      if(this.status.searchText) {
        this.searchLoading = true
        this.data.resultList = []
        let params = {
          searchText: this.status.searchText
        }
        this.$api.searchGroups(params).then(data => {
          let text = this.status.searchText
          data.map((item) => {
            item.navHighlighted = item.nav.replace(new RegExp(text, 'g'), '<em>' + text + '</em>')
          })
          this.data.resultList = data
          this.status.isResultShow = true
          this.searchLoading = false
        })
      }
    },

    /**
     * 定位到结果所在位置
     */
    locateItem(item) {
      this.loading = true
      this.status.isResultShow = false
      let path = item.path.split(',')
      let id = path[path.length - 1]

      if(path.length === 1) {
        this.locateCallback(id)
      } else {
        this.runQueue(path, this.iterator, () => {
          this.locateCallback(id)
        })
      }
    },

    /**
     * 递归请求组织节点
     */
    runQueue(queue, fn, callback) {
      const step = index => {
        if (index === queue.length - 1) {
          return callback(queue[index])
        }

        if (queue[index]) {
          fn(queue[index], () => {
            this.$nextTick(() => {
              step(index + 1)
            })
          })
        }
      }

      step(0)
    },

    /**
     * 请求组织节点，将数据添加到children属性
     * @param id  父节点id
     * @param resolve
     */
    iterator(id, resolve) {
      let node = this.$refs.groupTree.getNode(id)
      node.expanded = true
      node.childNodes = []

      if (node.data.hasChildren && node.childNodes.length === 0) {
        this.querySubGroup(node, (childNodes) => {
          this.$set(node.data, 'children', childNodes)
          resolve()
        })
      } else {
        resolve()
      }
    },

    /**
     * 定位结果回调
     */
    locateCallback(id) {
      this.$refs.groupTree.setCurrentKey(id)

      this.$nextTick(() => {
        this.locateGroup()
        this.loading = false
      })
    },

    /**
     * 定位到目标组织节点
     */
    locateGroup() {
      this.loading = true
      let ele = document.querySelector('.el-tree-arrow')
      let scrollDis = document.querySelector('.el-tree-arrow .is-current').offsetTop

      this.status.searchText = ''
      ele.scrollTop = scrollDis
      this.loading = false
    },

    /**
     * 初始化禁用相关节点
     */
    initData(data) {
      data.map((node) => {
        if(node.id.toString() === this.groupId) {
          this.$set(node, 'disabled', true)
        }
      })
      return data
    },

    /**
     * 写入禁用类名
     */
    initDisableClass() {
      let disabledItems = document.querySelectorAll('.disabled-item')
      Array.prototype.map.call(disabledItems, (item) => {
        item.parentElement.setAttribute('class', 'el-tree-node__content disabled-node')
      })
    }
  }
}
</script>

<style lang="scss">
.move-dialog {
  .move-dialog-container {
    border-radius: 3px;
    border: 1px solid #E6EBEF;
  }

  .move-head {
    padding: 7px 8px;
    background: #F0F5FA;
    position: relative;

    .el-input {
      width: 100%;

      input {
        height: 30px;
        line-height: 30px;
      }
    }
  }

  .move-body {
    overflow-y: auto;
    height: 310px;
    padding: 0 8px;
    border-top: 1px solid #E2EBF1;

    .el-tree {
      .is-current {
        & > .el-tree-node__content:not(.disabled-node) {
          color: #fff;
          background: #4BD083;

          .el-tree-node__expand-icon:not(.is-leaf) {
            &:not(.disabled-node) {
              &:before {
                background: url("~@/assets/images/tree-expand-icon-arrow1.png") no-repeat;
              }

              &.expanded:before {
                background-image: url("~@/assets/images/tree-expanded-icon-arrow1.png");
              }
            }
          }
        }
      }

      .disabled-node {
        cursor: not-allowed;
        color: #C5C8CD;
      }
    }
  }

  .search-result {
    position: absolute;
    z-index: 9;
    top: 37px;
    left: 0;
    width: 442px;
    max-height: 300px;
    margin: 0 8px;
    padding: 10px 13px;
    overflow-y: scroll;
    background: #fff;
    border-radius: 3px;
    border: 1px solid #e5e9ee;
    box-shadow:0px 3px 6px 0px rgba(53,59,66,0.1);

    li {
        cursor: pointer;
        line-height: 36px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    em {
        font-style: normal;

        &:last-of-type {
          color: #fe6772;
        }
    }
  }
}
</style>
