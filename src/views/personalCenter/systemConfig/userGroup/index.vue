<template>
  <div class="main-container group_user">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <div class="nav-menu">
        <ul style="padding-top: 10px">
          <template v-for="item in data.groupList">
            <li v-if="item.hasRight" :class="{'is-active': data.currentGroupId === item.id}" :key="item.id" :title="item.name" class="nav-item" @click="handleGroupClick(item)">
              <router-link :to="{ path: '/system/userGroup/' + item.group , query: { groupid: item.id, groupname: item.name }}">{{ item.name }}</router-link>
              <div v-if="data.operationGroupId === item.id" class="more-oprate" @click.stop></div>
            </li>
          </template>
        </ul>

        <div v-loading = "leftLoading" v-show="groupTree.length > 0" class="group_tree">
          <!-- 模糊检索 -->
          <div v-clickoutside="handleClose" style="position: relative;">
            <el-input v-model="searchText" class="search-input" placeholder="请输入组织名称" suffix-icon="search"
                      @input="searchTree()" @focus="isShowResults = true">
              <i slot="suffix" class="input-icon" />
            </el-input>
            <div v-if="isShowResults && searchText.length > 0" class="search-result">
              <ul class="uirb-dropdown">
                <li v-for="(item, index) in searchList" :key="index" :title="item.title" @click="locate(item)" v-html="item.nav" />
                <div v-loading="searchLoading" v-if="searchList.length === 0" class="search-no-data">暂无数据</div>
              </ul>
            </div>
          </div>

          <!-- 组织树 -->
          <div :class="{'auth-tree': data.groupList.filter((item) => { return item.hasRight }).length <= 1}">
            <el-tree ref="groupTree" :data="groupTree" :props="defaultProps" :load="queryGroupChildTree" :default-expanded-keys="data.expandIds" :check-strictly="true"
                     :expand-on-click-node="true" highlight-current node-key="id" lazy @node-click="handleNodeClick">
              <span slot-scope="{ node }" :class="{'site-title': node.level === 1}" :title="node.label" class="custom-tree-node">
                <span>{{ node.label }}</span>
                <i
                  v-access="'sysconf.group.add,sysconf.group.edit,sysconf.group.import,sysconf.group.allocaterole,sysconf.group.setorder,sysconf.group.move,sysconf.group.delete'"
                  v-if="node.data.id != '0'" :class="{'more-active': status.isMore == node.data.id}" class="nav-more" @click.stop="seeMore(node)"></i>
                <i v-access="'sysconf.group.add,sysconf.group.import'" v-if="node.data.id == '0'" :class="{'more-active': status.isMore == node.data.id}"
                   class="nav-more" @click.stop="seeMore(node)"></i>
                <ul v-if="status.isMore == node.data.id" id="more-oprate" class="uirb-dropdown nav-more-dropdown">
                  <li v-access="'sysconf.group.add'" title="新增" @click.stop="editGroup(node.data, 'add')">新增</li>
                  <li v-access="'sysconf.group.edit'" v-show="node.data.id!='0'" title="编辑" @click.stop="editGroup(node.data, 'edit')">编辑</li>
                  <li v-access="'sysconf.group.import'" title="导入" @click.stop="loadGroup(node.data)">导入</li>
                  <li v-access="'sysconf.group.allocaterole'" v-show="node.data.id!='0'" title="分配角色" @click.stop="distribRoleToGroup(node.data.id)">分配角色</li>
                  <li v-access="'sysconf.group.setorder'" v-show="node.data.id!='0'" title="调整顺序" @click.stop="sortGroup(node)">调整顺序</li>
                  <li v-access="'sysconf.group.move'" v-show="node.data.id!='0'" title="移动到" @click.stop="moveGroup(node)">移动到</li>
                  <li v-access="'sysconf.group.delete'" v-show="node.data.id!='0'" title="删除" @click.stop="deleteGroup(node.data.id)">删除</li>
                </ul>
              </span>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧 -->
    <div v-loading="loading" class="content-container">
      <router-view/>
      <!-- 版本信息 -->
      <edition/>
    </div>
  </div>
</template>

<script>
import edition from "@/views/common/footer/footer.vue"
import standardMenu from "@/views/common/standardMenu/index.vue"
import editGroupDialog from './components/editGroup'
import loadGroupDialog from './components/loadGroup'
import distributeRoleDialog from './components/distributeRole'
import sortGroupDialog from './components/sortGroupDialog.vue'
import moveUserDialog from './components/moveUser.vue'
import Clickoutside from '@/utils/clickoutside'

export default {
  name: "userGroupManagement",

  components: {
    edition,
    standardMenu
  },

  directives: { Clickoutside },

  data () {
    return {
      data: {
        groupList: [
          {
            id: 0,
            name: "用户管理",
            group: "user",
            hasRight: this.$checkRight("sysconf.user")
          },
          {
            id: 1,
            name: "组织管理",
            group: "group",
            hasRight: this.$checkRight("sysconf.group")
          }
        ],
        currentGroupId: "",
        expandIds: [], // 全部组织展开状态
        flag: 0 //标识位
      },
      status: {
        standardId: "", // 当前标准ID
        isMore: ""
      },
      loading: false,
      searchText: "",
      searchList: [], // 左侧导航树检索结果列表
      groupTree: [], //左侧导航树结构
      leftLoading: false,
      searchLoading: false,
      defaultProps: {
        label: "groupName",
        children: "children",
        isLeaf: (data, node) => {
          return data.hasChildren === 0
        }
      },
      oprateId: '', // 为处理编辑组织节点刷新当前组织节点用的当前编辑的组织节点的组织id
      isEditCallback: false,
      isShowResults: false    // 左侧组织树检索结果列表是否展示
    }
  },

  watch: {
    $route (path) {
      if (path.fullPath === "/system/userGroup") {
        this.queryGroupList()
      }
    }
  },

  mounted () {
    this.queryGroupList()
    this.handleGroupClick(
      this.data.groupList.find(item => {
        return item.hasRight === true
      })
    )
    /**
     * @description 点击空白区域 下拉项隐藏
     */
    document.addEventListener("mouseup", e => {
      var _con = document.getElementById("more-oprate")
      if (_con) {
        if (!_con.contains(e.target)) {
          this.status.isMore = ""
        }
      }
    })
  },

  methods: {
    /**
     * 请求数据
     */
    queryGroupList () {
      this.handleGroupClick(this.data.groupList[0])
    },

    /**
     * 请求左侧组织树结构数据
     */
    queryGroupTree (type) {
      let params = {
        parentId: "0",
        granularity: "ALL",
        containsChildren: "0"
      }
      this.$api.queryGroupList(params).then(data => {
        this.groupTree = []
        this.groupTree.push({
          id: "0",
          groupId: "0",
          groupName: "全部组织",
          hasChildren: "1",
          children: data.data
        })
        this.data.expandIds.push('0')
        this.data.expandIds.push(data.data[0].id)
      })
    },

    /**
     *  请求树结构子节点
     */
    queryGroupChildTree (node, resolve) {
      if (node.level === 0) return
      let params = {
        parentId: node.data.id,
        granularity: "ALL"
      }
      this.$api.queryGroupList(params).then(data => {
        resolve(data.data)
        if (!this.isEditCallback) {
          if (this.data.flag === 0 && node.level === 1 && !node.data.children[0].hasChildren) {
            let id = node.data.children[0].id
            this.locateNode(id)
            this.data.flag = 1
          }
          if (this.data.flag === 1 && this.groupTree[0].children[0].hasChildren) {
            let node = this.$refs.groupTree.getNode(this.groupTree[0].children[0].id)
            if (node.childNodes && node.childNodes.length > 0) {
              let id = node.childNodes[0].data.id
              this.locateNode(id)
              this.data.flag = 2
            }
          }
        }
      })
    },

    /**
     * 高亮指定id对应的树节点
     */
    locateNode (id) {
      this.$refs.groupTree.setCurrentKey(id)
      this.$router.push({
        path: "/system/userGroup/group",
        query: { groupid: id }
      })
    },

    /**
     * 检索组织树
     */
    searchTree () {
      if (!this.searchText) return
      this.searchLoading = true
      this.searchList = []
      let params = {
        searchText: this.searchText
      }
      this.$api.searchGroups(params).then(data => {
        this.searchLoading = false
        this.isShowResults = true
        this.searchList = data

        // 高亮检索关键词
        this.searchList.forEach((item, index) => {
          item.title = item.nav
          var arr = item.nav.split('/')
          var key = this.searchText
          arr[arr.length - 1] = arr[arr.length - 1].replace(new RegExp(key, 'g'), `<span class="red-word">${this.searchText}</span>`)
          item.nav = arr.join('/')
        })
      }, err => {
        this.searchLoading = false
      })
    },

    /**
     * 隐藏组织检索结果面板
     */
    handleClose () {
      this.isShowResults = false
    },

    /**
     * 定位检索树
     */
    locate (data) {
      //解决全部组织未展开时，定位不会展开全部组织
      if (!this.$refs.groupTree.store.nodesMap[0].expanded) {
        this.$refs.groupTree.store.nodesMap[0].expanded = true
      }
      let path = data.path.split(',')
      this.runQueue(path, this.iterator, (selectedNodeId) => {
        this.$refs.groupTree.setCurrentKey(selectedNodeId)
        this.$nextTick(() => {
          let parentNode = document.querySelector('.el-tree .is-current')
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
      let node = this.$refs.groupTree.getNode(id)
      node.expanded = true
      this.$nextTick(() => {
        if (node.data.hasChildren && node.childNodes.length === 0) {
          this.queryGroupChildTree(node, (childNodes) => {
            this.$set(node.data, 'children', childNodes)
            resolve()
          })
        } else {
          resolve()
        }
      })
    },

    /**
     * 定位到点击组织
     */
    locateGroup (targetNode, node) {
      let ele = document.querySelector(".group_user .el-tree")
      let scrollDis = 0
      scrollDis = targetNode.offsetTop

      this.$nextTick(() => {
        let that = this
        ele.scrollTop = scrollDis
        that.handleNodeClick(node)
        this.searchText = ""
        this.searchList = []
        this.isEditCallback = false
      })
    },

    /**
     * 点击组织节点
     */
    handleNodeClick (node) {
      if (node.id === "0") {
        this.$refs.groupTree.setCurrentKey(this.$route.query.groupid)
        this.$router.push({
          path: "group",
          query: { groupid: this.$route.query.groupid }
        })
      } else {
        this.$router.push({ path: "group", query: { groupid: node.id } })
      }
    },

    /**
     * 查看更多操作
     */
    seeMore (node) {
      this.status.isMore = this.status.isMore ? '' : node.data.id
    },

    /**
     * 新增/编辑组织
     */
    editGroup (item, type, parentGroupId) {
      if (type === 'edit') {
        this.oprateId = item.id + ''
        this.$api.queryParentId({ groupId: item.id }).then(data => {
          parentGroupId = data
          this.$dialog(editGroupDialog, {editItem: item, type: type, parentGroupId: parentGroupId}).then(() => {
            this.updateGroupTree(parentGroupId, type)
          })
        })
      } else {
        this.$dialog(editGroupDialog, {editItem: item, type: type, parentGroupId: parentGroupId}).then(() => {
          this.updateGroupTree(item.id, type)
        })
      }
    },

    /**
     * 导入组织
     */
    loadGroup (node) {
      this.isExportDialogShow = true
      this.curGroupName = node.groupName
      this.currentid = node.id + ''
      this.$dialog(loadGroupDialog, { groupName: node.groupName, parentGroupId: node.id }).then(() => {
        this.updateGroupTree(node.id)
      }, () => {
        this.updateGroupTree(node.id)
      })
    },

    /**
     * 删除组织
     */
    deleteGroup (id) {
      this.$trsModalConfirm({
        content: "是否删除所选组织?（若有子组织将一并删除）",
        title: "删除组织",
        danger: true
      }).then(data => {
        this.loading = true
        let params = {
          groupId: id
        }
        this.$api.queryParentId(params).then(data => {    // 根据删除的id请求父组织id
          let groupid = data   // 删除的节点的父节点id
          let url = {
            groupIds: id
          }
          this.$api.deleteGroups(url).then(data => {
            // 删除组织操作
            this.$trsModalSuccess("删除组织成功！")
            this.updateGroupTree(groupid, 'delete')
            this.loading = false
          })
        })
      })
    },

    /**
     * 分配角色
     */
    distribRoleToGroup (id) {
      this.$dialog(distributeRoleDialog, { groupId: id }).then(() => {
      })
    },

    /**
     * 切换分组
     */
    handleGroupClick (data) {
      if (data.id === 1) {
        this.data.currentGroupId = data.id
        this.$router.push({
          path: "/system/userGroup/" + data.group,
          query: { groupid: 0 }
        })
        this.data.flag = 0
        this.queryGroupTree() // 请求左侧组织树结构数据
      } else {
        this.groupTree = []
        if (this.data.currentGroupId === data.id) return

        this.data.currentGroupId = data.id
        this.$router.push({
          path: "/system/userGroup/" + data.group,
          query: {}
        })
      }
    },

    /**
     * 调整顺序
     * @param node 当前组织节点
     */
    sortGroup (node) {
      this.$dialog(sortGroupDialog, { groupId: node.data.id, siblingData: node.parent.childNodes }).then(() => {
        this.updateGroupTree(node.parent.key)
      })
    },

    /**
     * 移动组织
     */
    moveGroup (node) {
      let id = node.data.id
      this.$dialog(moveUserDialog, { groupId: id.toString(), target: 'group' }).then(() => {
        this.queryGroupTree()

        this.$nextTick(() => {
          this.data.currentGroupId = id
          this.$refs.groupTree.setCurrentKey(id)
          this.$router.push({ path: 'group', query: { groupid: id } })
        })
      })
    },

    /**
     * 更新组织树并定位到指定组织节点
     */
    updateGroupTree (groupId, type) {
      if (type === 'add' && this.$refs.groupTree.getNode(groupId).data.hasChildren === 0) {
        this.$refs.groupTree.getNode(groupId).data.hasChildren = 1
        this.$refs.groupTree.getNode(groupId).expanded = true
      }
      let node = this.$refs.groupTree.getNode(groupId)
      if (node) node.childNodes = []

      let that = this
      this.iterator(groupId, function () {
        if (type === 'edit') {
          that.isEditCallback = true
        }
        that.$api.queryGroupPath({ id: groupId }).then(data => {
          let path = data.split(',')
          let selectedId = path[path.length - 1]
          that.runQueue(path, that.iterator, () => {
            if (type === 'edit') {
              that.$refs.groupTree.setCurrentKey(that.oprateId)
              that.$nextTick(() => {
                let targetNode = document.querySelector('.el-tree .is-current')
                that.locateGroup(targetNode, { id: that.oprateId })
              })
            } else {
              that.$refs.groupTree.setCurrentKey(selectedId)
              that.$nextTick(() => {
                let targetNode = document.querySelector('.el-tree .is-current')
                that.locateGroup(targetNode, { id: selectedId })
                if (type === 'add') {
                  that.$refs.groupTree.getNode(groupId).isLeaf = false
                }
              })
            }
          })
        })
      })
    }
  }
}
</script>
