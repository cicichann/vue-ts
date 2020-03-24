<template>
  <div class="group-manage">
    <!-- 头部 -->
    <div class="sub-nav">

      <!-- 左侧按钮群 -->
      <div class="fl">
        <dropdown-btn v-access="'sysconf.group.adduser,sysconf.group.removeuser,sysconf.group.enableuser,sysconf.group.disableuser'" label="用户管理">
          <ul>
            <li v-access="'sysconf.group.adduser'" @click="addUsers()">添加用户</li>
            <li v-access="'sysconf.group.removeuser'" :class="{'disable': status.selectedIds.length === 0 || loading}" @click="removeUsers()">移除用户</li>
            <li v-access="'sysconf.group.enableuser'" :class="{'disable': status.selectedIds.length === 0 || loading}" @click="startUsers()">启用用户</li>
            <li v-access="'sysconf.group.disableuser'" :class="{'disable': status.selectedIds.length === 0 || loading}" @click="stopUsers()">停用用户</li>
          </ul>
        </dropdown-btn>
        <button v-access="'sysconf.group.createuser'" class="edit-btn other-btn" @click="editUser({})">新建用户</button>
        <button v-access="'sysconf.group.resetpswd'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn other-btn" @click="resetPassword()">重置密码</button>
        <button v-access="'sysconf.group.deleteuser'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn other-btn" @click="deleteUsers()">删除</button>
        <button v-access="'sysconf.group.importuser'" class="edit-btn other-btn" @click="loadUsers()">导入</button>
        <button v-access="'sysconf.group.moveuser'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn other-btn" @click="moveUsers()">移动用户</button>
      </div>

      <!-- 右侧检索 -->
      <div class="fr">
        <el-input v-model="searchText" placeholder="请输入用户名称" class="normal-input" @keyup.enter.native="queryUserList">
          <i slot="suffix" class="input-icon" @click="queryUserList"/>
        </el-input>
      </div>
    </div>

    <!-- 下拉筛选 -->
    <div class="sub-filter">
      <el-select v-model="data.value" class="select-item" @change="changeStatus">
        <el-option v-for="item in data.options" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
      <trs-time-select ref="timeSelect" :default-name="'添加时间'" class="select-item" @selectTime="queryUserList" />
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-select-nav no-selected" style="padding:0">
      <com-table v-loading="loading" :data="userList" :columns="data.columns" :columns-props="data.columnsProps"
                 :pagination="data.pagination" element-loading-text="数据加载中..." @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button v-access="'sysconf.group.edituser'" title="编辑" class="list-icon edit-icon" @click="editUser(item.row)" />
          <button v-access="'sysconf.group.deleteuser'" title="删除" class="list-icon delete-icon" @click="deleteUsers(item.row)" />
          <el-dropdown trigger="click" style="display: flex" @command="handleCommand">
            <button
              v-if="($checkRight('sysconf.group.enableuser') && item.row.status == 20)
                || ($checkRight('sysconf.group.disableuser') && item.row.status == 30)
              || $checkRight('sysconf.group.resetpswd,sysconf.group.removeuser,sysconf.group.moveuser,sysconf.group.setroleforuser')"
              :class="{'more-active': data.operationApp.id === item.row.id}" title="更多" class="list-icon nav-more" @click="showOperation($event, item.row)" />
            <el-dropdown-menu slot="dropdown" class="action-popover">
              <el-dropdown-item v-if="$checkRight('sysconf.group.enableuser') && item.row.status == 20" :command="composeValue('start', item.row)">启用</el-dropdown-item>
              <el-dropdown-item v-if="$checkRight('sysconf.group.disableuser') && item.row.status == 30" :command="composeValue('stop', item.row)">停用</el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.group.resetpswd'" :command="composeValue('reset', item.row)">重置密码</el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.group.removeuser'" :command="composeValue('remove', item.row)">移除</el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.group.moveuser'" :command="composeValue('move', item.row)">移动用户</el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.group.setroleforuser'" :command="composeValue('role', item.row)">分配角色</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </com-table>
      <com-pagination ref="pagination" :pagination="data.pagination" @callback="queryUserList"></com-pagination>
    </div>
  </div>
</template>

<script>
import comTable from "@/views/common/table/index"
import comPagination from "@/views/common/pagination/index"
import trsTimeSelect from "@/views/common/timeSelect/index"
import dropdownBtn from '@/views/common/dropdownBtn/index'
import editUserDialog from './components/editUser'
import resetPasswordDialog from './components/resetPassword'
import loadUserDialog from "./components/loadUser"
import distributeRoleDialog from "./components/distributeRole"
import addUserDialog from "./components/addUser"
import { initDate } from "@/utils/index"
import moveUserDialog from './components/moveUser.vue'

export default {
  name: "groupUserList",

  components: {
    comTable,
    comPagination,
    trsTimeSelect,
    dropdownBtn
  },

  data () {
    return {
      data: {
        value: "用户状态",
        options: [
          {
            id: -1,
            label: "用户状态"
          },
          {
            id: 0,
            label: "停用"
          },
          {
            id: 1,
            label: "启用"
          }
        ],
        columns: [],
        columnsProps: {
          hasSelection: true, // 是否有复选框
          hasIndex: true, // 是否有序号
          disdraggable: true,
          hasEdit: true
        },
        operationApp: {
          itemId: ""
        },
        pagination: {}
      },
      status: {
        selectedIds: ""
      },
      params: {
        status: ""
      },
      loading: false, //loading默认
      searchText: "", // 检索关键词
      userList: null, // 当前组织下用户列表
      dropDown: "",
      onlyMe: true // 只看当前组织  1为打开 0 为关闭
    }
  },

  watch: {
    $route (path) {
      this.queryUserList()
    }
  },

  mounted () {
    this.initProp()
    this.queryUserList()
  },

  methods: {
    composeValue (val, row) {
      return {
        val: val,
        row: row
      }
    },

    /**
     * 初始化数据
     */
    initProp () {
      this.data.columns = [
        {
          label: "用户名",
          prop: "userName",
          minWidth: 100
        },
        {
          label: "用户角色",
          prop: "roles",
          minWidth: 100,
          format: (row, prop) => {
            if (row.roles.length > 1) {
              let arr = []
              row.roles.forEach((item, index) => {
                var role = row.roles[index].roleName
                arr.push(role)
              })
              let roles = arr.join("、")
              return roles
            } else if (row.roles.length === 1) {
              return row.roles[0].roleName
            } else {
              return ""
            }
          }
        },
        {
          label: "用户状态",
          prop: "userStatus",
          minWidth: 100,
          format: (row, prop) => {
            if (row.status === 30) {
              return "启用"
            } else {
              return "停用"
            }
          }
        },
        {
          label: "添加时间",
          prop: "addTimestamp",
          minWidth: 100,
          format: (row, prop) => {
            return initDate(row.addTimestamp)
          }
        }
      ]

      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    /**
     * 根据组织id获取用户列表
     */
    queryUserList (page) {
      this.loading = true
      var params = {
        groupId: this.$route.query.groupid || 0,
        searchText: this.searchText,
        status: this.params.status,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        granularity: this.$refs.timeSelect.selected.value,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize,
        onlyMe: 1
      }
      this.$api.selectedUsers(params).then(data => {
        this.userList = data.data
        this.data.pagination = data.pager
        this.data.pagination.pageSizes = [10, 20, 30, 50, 100]
        this.status.selectedIds = ""
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * 展示更多面板
     */
    showOperation (event, app) {
      event.stopPropagation()
      if (this.data.operationApp.id === app.id) {
        this.data.operationApp = {}
      } else {
        this.data.operationApp = app
      }
      this.$nextTick(() => {
        this.dropDown = true
        this.selectItem = app
      })
    },

    /**
     * 状态下拉切换回调
     */
    changeStatus (value) {
      this.params.status = value
      this.queryUserList()
    },

    /**
     * 只看当前开关回调
     */
    seeCurrent () {
      this.onluMe = this.onlyMe === 0 ? 1 : 0
      this.queryUserList()
    },

    /**
     * 用户列表更多按钮操作
     */
    handleCommand (command, row) {
      switch (command.val) {
        case "start":
          this.startUsers(command)
          break
        case "stop":
          this.stopUsers(command)
          break
        case "reset":
          this.resetPassword(command.row)
          break
        case "remove":
          this.removeUsers(command.row)
          break
        case 'move':
          this.moveUsers(command.row)
          break
        case "role":
          this.distributeRole(command.row)
          break
      }
    },

    /**
     * 处理选中项，获取ids集合
     */
    handleSelectionChange (ids, row) {
      this.status.selectedIds = ids
    },

    /**
     * 新建/编辑用户
     */
    editUser (item) {
      this.$dialog(editUserDialog, {editItem: item, groupId: this.$route.query.groupid}).then(() => {
        this.queryUserList()
      })
    },

    /**
     * 启用用户
     */
    startUsers (command) {
      if (this.status.selectedIds.length === 0 && !command) return
      this.$trsModalConfirm({
        content: "是否确认启用所选用户?",
        title: "启用用户",
        danger: true
      }).then(() => {
        this.loading = true
        var params = {
          id: this.$route.query.groupid,
          userIds: command ? command.row.id : this.status.selectedIds
        }
        this.$api.starUser(params).then(data => {
          this.$trsModalSuccess("启用用户成功！")
          this.loading = false
          this.queryUserList()
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 停用用户
     */
    stopUsers (command) {
      if (this.status.selectedIds.length === 0 && !command) return
      this.$trsModalConfirm({
        content: "是否确认停用所选用户?",
        title: "停用用户",
        danger: true
      }).then(() => {
        this.loading = true
        let params = {
          id: this.$route.query.groupid,
          userIds: command ? command.row.id : this.status.selectedIds,
        }
        this.$api.stopUser(params).then(data => {
          this.$trsModalSuccess("停用用户成功！")
          this.loading = false
          this.queryUserList()
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 添加用户
     */
    addUsers () {
      this.$dialog(addUserDialog, { groupId: this.$route.query.groupid }).then(() => {
        this.queryUserList()
      })
    },

    /**
     * 检索左侧用户列表
     */
    searchTxt (txt) {
      if (txt === "") return
      let list = []
      this.allUserList.forEach((item, index) => {
        if (item.trueName.indexOf(txt) !== -1) {
          list.push(item)
        }
      })
      this.$nextTick(() => {
        this.allUserList = list
      })
    },

    /**
     * 移除用户
     */
    removeUsers (item) {
      if (this.status.selectedIds.length === 0 && !item) return
      this.$trsModalConfirm({
        content: "是否确认移除所选用户?",
        title: "移除用户",
        danger: true
      }).then(() => {
        this.loading = true
        let params = {
          groupId: this.$route.query.groupid,
          userIds: item ? item.id : this.status.selectedIds
        }
        this.$api.removeUsers(params).then(data => {
          this.$trsModalSuccess("移除用户成功！")
          this.queryUserList()
          this.loading = false
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 删除用户
     */
    deleteUsers (item) {
      this.$trsModalConfirm({
        content: "是否确认删除所选用户?",
        title: "删除用户",
        danger: true
      }).then(() => {
        this.loading = true
        let params = {
          groupId: this.$route.query.groupid,
          userIds: item ? item.id : this.status.selectedIds
        }
        this.$api.deleteUserInGroup(params).then(data => {
          this.$trsModalSuccess("删除用户成功！")
          this.loading = false
          this.queryUserList()
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 重置密码
     */
    resetPassword (item) {
      this.$dialog(resetPasswordDialog, {userIds: item ? item.id.toString() : this.status.selectedIds, groupId: this.$route.query.groupid}).then(() => {
        this.queryUserList()
      })
    },

    /**
     * 导入用户
     */
    loadUsers () {
      let groupId = this.$route.query.groupid
      this.$dialog(loadUserDialog, {src: `${window.location.origin}/uirb/groups/${groupId}/users/template`, groupId: groupId}).then(data => {
        this.queryUserList()
      })
    },

    /**
     * 移动用户
     */
    moveUsers (row) {
      this.$dialog(moveUserDialog, { groupId: this.$route.query.groupid.toString(), userId: row ? row.id.toString() : this.status.selectedIds, target: 'user' }).then((id) => {
        this.$router.push({ path: 'group', query: { groupid: id } })
        this.$parent.updateGroupTree(id)
      })
    },

    /**
     * 分配角色
     */
    distributeRole (row) {
      this.$dialog(distributeRoleDialog, { userId: row.id }).then(() => {
        this.queryUserList()
      })
    }
  }
}
</script>
