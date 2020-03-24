<template>
  <div class="tag-manage user-manage">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <button v-access="'sysconf.user.add'" class="edit-btn add-btn" @click="editUser({})">新增</button>
        <button v-access="'sysconf.user.resetpswd'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn other-btn" @click="reset">重置密码</button>
        <button v-access="'sysconf.user.disable'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn delete-btn" @click="handleCommand('stop')">停用</button>
        <button v-access="'sysconf.user.enable'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn other-btn" @click="handleCommand('star')">启用</button>
        <button v-access="'sysconf.user.import'" class="edit-btn other-btn" @click="importUser">导入</button>
        <button v-access="'sysconf.user.delete'" :disabled="status.selectedIds.length === 0 || loading" class="edit-btn delete-btn" @click="deleteUser()">删除</button>
      </div>

      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-input v-model="pramas.searchText" placeholder="请输入用户名" class="normal-input" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 下拉,检索 -->
    <div class="sub-filter">
      <el-select v-model="data.value" class="select-item" @change="changeStatus">
        <el-option v-for="item in data.options" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
      <trs-time-select ref="timeSelect" :default-name="'创建时间'" class="select-item" @selectTime="queryList"></trs-time-select>
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-select-nav no-selected" style="padding:0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <!-- <span class="edit-col-left"> -->
          <button v-access="'sysconf.user.edit'" title="编辑" class="list-icon edit-icon" @click="editUser(item.row)"></button>
          <button v-access="'sysconf.user.delete'" title="删除" class="list-icon delete-icon" @click="deleteUser(item.row.id)"></button>
          <el-dropdown
            v-if="($checkRight('sysconf.user.enable') && item.row.status == 20)
              || ($checkRight('sysconf.user.disable') && item.row.status == 30)
            || $checkRight('sysconf.user.allocategroup,sysconf.user.allocaterole')"
            trigger="click" style="display: flex" @command="handleCommand">
            <button :class="{'more-active': data.operationApp.id === item.row.id}" title="更多" class="list-icon nav-more" @click="showOperation($event, item.row)"/>
            <el-dropdown-menu slot="dropdown" class="action-popover">
              <el-dropdown-item v-access="'sysconf.user.allocategroup'" :command="composeValue('group', item.row)">分配组织</el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.user.allocaterole'" :command="composeValue('role', item.row)">分配角色</el-dropdown-item>
              <el-dropdown-item v-if="item.row.status == 20 && $checkRight('sysconf.user.enable')" :command="composeValue('star', item.row)">启用</el-dropdown-item>
              <el-dropdown-item v-if="item.row.status == 30 && $checkRight('sysconf.user.disable')" :command="composeValue('stop', item.row)">停用</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <!-- </span> -->
        </template>
      </com-table>
      <com-pagination ref="pagination" :pagination="data.pagination" @callback="queryList"></com-pagination>
    </div>
  </div>
</template>

<script>
import comTable from "@/views/common/table/index"
import comPagination from "@/views/common/pagination/index"
import trsTimeSelect from "@/views/common/timeSelect/index"
import distributeRoleDialog from "./components/distributeRole"
import distributeOrganizeDialog from "./components/distributeOrganize.vue"
import editUserDialog from './components/editUser'
import resetPasswordDialog from './components/resetPassword'
import loadUserDialog from './components/loadUser'
import { initDate } from "@/utils/index"

export default {
  name: "TagManageList",

  components: {
    comTable,
    comPagination,
    trsTimeSelect
  },

  data() {
    return {
      data: {
        listSource: null, //表格数据
        columns: [], //每一列的数据，表头
        pagination: {}, //分页
        checkedReslist: [], //分配角色，右侧选中
        options: [
          {
            //停启用状态
            id: "",
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
        value: "", //检索绑定
        operationApp: {
          //选中行数据
          itemId: ""
        },
        columnsProps: {
          //表格配置
          hasSelection: true, // 是否有复选框
          hasIndex: true, // 是否有序号
          disdraggable: true, //是否不拖拽
          hasEdit: true //是否有图标
        }
      },
      status: {
        selectedIds: "" //选中id总和
      },
      pramas: {
        //参数
        searchText: "",
        status: "",
        granularity: "ALL",
        beginDateTime: "",
        endDateTime: "",
        pageIndex: 1,
        pageSize: 15
      },
      loading: false, //loading默认
      dropDown: false, //下拉默认
      selectItem: {} //选中列
    }
  },

  mounted() {
    this.initProp()
    this.queryList()
    /**
     * 点击空白区域隐藏操作菜单
     */
    document.addEventListener("click", e => {
      if (this.data.operationApp !== {}) {
        this.data.operationApp = {}
      }
    })
  },

  methods: {
    /**
     * 请求数据
     */
    queryList(page) {
      this.loading = true
      this.pramas.pageIndex = page && page.currPage || 1
      this.pramas.pageSize = page && page.pageSize || this.data.pagination.pageSize
      this.pramas.granularity = this.$refs.timeSelect.selected.value
      this.pramas.beginDateTime = this.$refs.timeSelect.timeProp.fromTime
      this.pramas.endDateTime = this.$refs.timeSelect.timeProp.endTime
      this.$api.queryUserList(this.pramas).then(data => {
        this.data.pagination = data.pager
        this.data.listSource = data.data
        this.data.pagination.pageSizes = [10, 20, 30, 50, 100]
        this.$refs.pagination.jumpValue = ''
        this.loading = false
        this.status.selectedIds = ''
      })
    },

    /**
     * 启用和停用功能
     * @param {val, row}
     * val=='star' 启用按钮
     * val=='stop' 停用按钮
     */
    handleCommand(command) {
      if (command.val === "star" || command === "star") {
        this.startUser(command)
      } else if (command.val === "role") {
        this.distributeRole(command.row)
      } else if (command.val === "group") {
        this.$dialog(distributeOrganizeDialog, { userId: command.row.id }).then(() => {
          this.queryList()
        })
      } else {
        this.stopUser(command)
      }
    },

    /**
     * 停用
     */
    stopUser(command) {
      this.$trsModalConfirm({
        content: "是否确认停用所选用户?",
        title: "停用用户",
        danger: true
      }).then(() => {
        this.loading = true
        let url = {
          userIds: command.row ? command.row.id : this.status.selectedIds
        }
        this.$api.stopUser(url).then(data => {
          this.$trsModalSuccess("停用用户成功！")
          this.queryList()
          if (command.row) {
            command.row.status = 20
          }
          this.loading = false
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 启用
     */
    startUser(command) {
      this.$trsModalConfirm({
        content: "是否确认启用所选用户?",
        title: "启用用户",
        danger: true
      }).then(() => {
        this.loading = true
        let url = {
          userIds: command.row ? command.row.id : this.status.selectedIds
        }
        this.$api.starUser(url).then(data => {
          this.$trsModalSuccess("启用用户成功！")
          this.queryList()
          if (command.row) {
            command.row.status = 30
          }
          this.loading = false
        }, err => {
          this.laoding = false
        })
      })
    },

    /**
     * 下拉返回对象参数
     */
    composeValue(val, row) {
      return {
        val: val,
        row: row
      }
    },

    /**
     * 初始化数据
     */
    initProp() {
      this.data.columns = [
        {
          label: "用户名",
          prop: "userName",
        minWidth: 100
        },
        {
          label: "所属组织",
          prop: "groups",
          minWidth: 150,
        format: (row, prop) => {
            if (row.groups.length > 1) {
              let arr = []
              row.groups.forEach((item, index) => {
                var group = row.groups[index].groupName
                arr.push(group)
              })
              let groups = arr.join("、")
              return groups
            } else if (row.groups.length === 1) {
              return row.groups[0].groupName
          } else {
              return ""
            }
          }
        },
        {
          label: "用户角色",
          prop: "roles",
        minWidth: 150,
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
        minWidth: 50,
        format: (row, prop) => {
            if (row.status === 30) {
              return "启用"
          } else {
              return "停用"
          }
        }
        },
        {
          label: "创建时间",
          prop: "createTime",
        minWidth: 100,
        format: (row, prop) => {
            return initDate(row.createTime)
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
     * 处理选择项
     * @param ids 已选项ID集合
     */
    handleSelectionChange(ids, row) {
      this.status.selectedIds = ids
    },

    /**
     * 切换状态
     * @param {value}
     */
    changeStatus(value) {
      this.pramas.status = value
      this.queryList()
    },

    /**
     * 新增/编辑用户
     */
    editUser (item) {
      this.$dialog(editUserDialog, {editItem: item}).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除
     */
    deleteUser(id) {
      this.$trsModalConfirm({
        content: "是否删除所选用户?",
        title: "删除用户",
        danger: true
      }).then(data => {
        this.loading = true
        let params = {
          ids: id ? id : this.status.selectedIds
        }

        this.$api.deleteUser(params).then(data => {
          this.$trsModalSuccess("删除用户成功！")
          this.queryList()
          this.loading = false
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 导入
     */
    importUser () {
      this.$dialog(loadUserDialog, {src: `${window.location.origin}/uirb/users/template`}).then(data => {
        this.queryList()
      })
    },

    /**
     * 重置密码
     */
    reset () {
      this.$dialog(resetPasswordDialog, {userIds: this.status.selectedIds}).then(() => {
        this.queryList()
      })
    },

    /**
     * 展示更多面板
     */
    showOperation(event, app) {
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
     * 分配角色
     */
    distributeRole (row) {
      this.$dialog(distributeRoleDialog, { userId: row.id}).then(() => {
        this.queryList()
      })
    }
  }
}
</script>
