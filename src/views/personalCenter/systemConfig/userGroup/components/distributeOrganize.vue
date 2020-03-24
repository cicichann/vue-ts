<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="分配组织至用户" custom-class="distribute-group">
    <div v-loading="loading" element-loading-text="数据加载中..." class="distribute-modal clearfix">
      <div class="dialog-panel auth-panel">

        <!-- 组织检索 -->
        <div v-clickoutside="handleClose" class="panel-head">
          <el-input v-model="status.searchResText" placeholder="请输入组织名称" @input="querySearchList()" @focus="status.isResultShow = true">
            <i slot="suffix" class="input-icon" @click="querySearchList"></i>
          </el-input>
          <div v-loading="searchLoading" v-if="status.isResultShow && status.searchResText.length > 0" class="search-result">
            <ul v-if="data.resultList.length > 0">
              <li v-for="item in data.resultList" :key="item.path" :title="item.title" @click="locateItem(item)" v-html="item.nav" />
            </ul>
            <p v-else class="not-data">暂无数据</p>
          </div>
        </div>

        <div class="panel-body organize-body-left el-tree-arrow">
          <el-tree ref="DeviceGroupTree" :data="groupList" :expand-on-click-node="false" :props="defaultProps" :load="loadNode"
                   node-key="id" show-checkbox check-strictly lazy @check="changeGroup">
            <span slot-scope="{ node }" :title="node.label" class="custom-tree-node">
              {{ node.label }}
            </span>
          </el-tree>
        </div>
      </div>

      <!-- 已选组织列表 -->
      <div class="dialog-panel auth-panel checked-res">
        <div class="panel-head">
          <h6>已选组织</h6>
        </div>
        <div class="panel-body organize-body-right">
          <ul>
            <li v-for="res in data.checkedList" :title="res.split('/*/')[1]" :key="res"><i class="delete-icon" @click="removeGroup(res)"></i>{{ res.split("/*/")[1] }}</li>
          </ul>
        </div>
      </div>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'distributeOrganizeDialog',

  directives: { Clickoutside },

  props: {
    userId: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      loading: false,//loading参数
      searchLoading: false, // 检索loading
      data: {
        checkedList: [], // 选中的数组
        resultList: []
      },
      status: {
        searchResText: "",//输入框绑定数据
        groupId: '',//组织id
        isResultShow: false
      },
      groupList: [],//组织列表
      defaultProps: {//树结构配置参数
        children: 'children',
        label: 'groupName',
        isLeaf: (data, node) => {
          return node.data.hasChildren === 0
        }
      }
    }
  },

  mounted () {
    this.queryList()
    this.queryCheckedList()
  },

  methods: {
    /**
     * 请求左侧组织列表函数
     */
    queryList () {
      this.loading = true
      let params = {
        parentId: this.status.groupId || 0,
        searchText: this.status.searchResText,
        granularity: 'ALL',
        terseStyle: 1,
        pageIndex: 1,
        pageSize: 10000
      }
      this.$api.queryOrganizeList(params).then(data => {
        this.groupList = data.data
        this.loading = false
      })
    },

    /**
     * 检索
     */
    querySearchList () {
      if (this.status.searchText === '') return
      this.searchLoading = true
      this.data.resultList = []
      let params = {
        searchText: this.status.searchResText
      }
      this.$api.searchGroups(params).then(data => {
        this.data.resultList = data
        // 高亮检索关键词
        this.data.resultList.forEach((item, index) => {
          item.title = item.nav
          var arr = item.nav.split('/')
          var key = this.status.searchResText
          arr[arr.length - 1] = arr[arr.length - 1].replace(new RegExp(key, 'g'), `<em>${this.status.searchResText}</em>`)
          item.nav = arr.join('/')
        })
        this.status.isResultShow = true
        this.searchLoading = false
      }, () => {
        this.searchLoading = false
      })
    },

    /**
     * 关闭检索结果面板
     */
    handleClose () {
      this.status.isResultShow = false
    },

    /**
     * 定位到点击结果
     */
    locateItem (data) {
      let path = data.path.split(',')
      this.runQueue(path, this.iterator, (selectedNodeId) => {
        this.$refs.DeviceGroupTree.setCurrentKey(selectedNodeId)
        this.$nextTick(() => {
          let parentNode = document.querySelector('.is-current')
          this.locateGroup(parentNode, data)
        })
      })
    },

    /**
     * 递归请求栏目节点
     */
    runQueue (queue, fn, callback) {
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
    iterator (id, resolve) {
      let node = this.$refs.DeviceGroupTree.getNode(id)
      node.expanded = true

      if (node.data.hasChildren && node.childNodes.length === 0) {
        this.loadNode(node, (childNodes) => {
          this.$set(node.data, 'children', childNodes)
          resolve()
        })
      } else {
        resolve()
      }
    },

    /**
     * 定位到点击组织
     */
    locateGroup (targetNode, node) {
      let ele = document.querySelector('.el-tree-arrow')
      let scrollDis = targetNode.offsetTop

      this.$nextTick(() => {
        setTimeout(() => {
          ele.scrollTop = scrollDis
        }, 250)
        this.status.isResultShow = ''
      })
    },

    /**
     * 请求右侧选中列表函数
     */
    queryCheckedList () {
      let params = {
        userId: this.userId
      }
      this.$api.queryOrganizeRightList(params).then(data => {
        let arr = []
        let ids = []
        data.forEach((item, index) => {
          let node = item.id + '/*/' + item.groupName
          arr.push(node)
          ids.push(item.id)
        })
        this.data.checkedList = arr
        this.$refs.DeviceGroupTree.setCheckedKeys(ids)
      })
    },

    /**
     * 树组件请求函数
     */
    loadNode (node, resolve) {
      if (Object.prototype.toString.apply(node.data) !== '[object Object]') return
      let checkList = []
      this.data.checkedList.forEach((item, index) => {
        checkList.push(item.split('/*/')[0])
      })
      if (node.level === 0) {
        return resolve(this.groupList)
      }
      let hasChild = false
      if (node.data.hasChildren === 1) {
        hasChild = true
      }
      if (hasChild) {
        let flag = false
        if (this.$refs.DeviceGroupTree.getCheckedKeys().indexOf(node.data.id) >= 0) {
          flag = true
        } else {
          flag = false
        }
        this.status.groupId = node.data.id
        let params = {
          parentId: this.status.groupId || 0,
          searchText: '',
          granularity: 'ALL',
          terseStyle: 1,
          pageIndex: 1,
          pageSize: 10000
        }
        this.$api.queryOrganizeList(params).then(data => {
          resolve(data.data)
          if (flag) {
            let arr = checkList.concat([node.data.id])
            this.$refs.DeviceGroupTree.setCheckedKeys(arr)
            flag = false
          } else {
            this.$refs.DeviceGroupTree.setCheckedKeys(checkList)
          }
        })
      } else {
        return resolve([])
      }
    },

    /**
     * 确认
     */
    confirm () {
      this.loading = true
      let arr = []
      this.data.checkedList.forEach((item, index) => {
        arr.push(item.split('/*/')[0])
      })

      let url = {
        userId: this.userId
      }
      let params = {
        groupIds: arr.join(',')
      }
      this.$api.groupDistrib(url, params).then(data => {
        this.$trsModalSuccess("分配组织成功！")
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 移除选中项
     */
    removeGroup (res) {
      let arr = []
      let ids = []
      this.data.checkedList.forEach((item, index) => {
        if (item !== res) {
          arr.push(item)
        }
      })
      this.data.checkedList = arr
      arr.forEach((item, index) => {
        let id = item.split('/*/')[0]
        ids.push(id)
      })
      this.$refs.DeviceGroupTree.setCheckedKeys(ids)
    },

    /**
     * 改变选中状态
     */
    changeGroup (data, check) {
      let checkItem = data.id + '/*/' + data.groupName
      if (this.data.checkedList.indexOf(checkItem) < 0) {
        this.data.checkedList.push(checkItem)
      } else {
        this.data.checkedList.splice(this.data.checkedList.indexOf(checkItem), 1)
      }
    }
  }
}
</script>
