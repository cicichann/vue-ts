<template>
  <div class="role-manage">
    <div class="sub-nav">
      <!-- 左侧按钮群 -->
      <div class="fl">
        <button v-access="'sysconf.role.add'" class="edit-btn add-btn" @click="editRole()">新增</button>
        <button v-access="'sysconf.role.delete'" :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="deleteRole()">删除</button>
      </div>
      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入角色名称" class="normal-input" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 下拉检索 -->
    <div class="sub-filter">
      <trs-time-select ref="timeSelect" :default-name="'创建时间'" @selectTime="queryList"></trs-time-select>
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
          <button v-access="'sysconf.role.edit'" :disabled="item.row.roleName === 'Administrators'" title="编辑" class="list-icon edit-icon" @click="editRole(item.row)"></button>
          <button v-access="'sysconf.role.delete'" :disabled="item.row.roleName === 'Administrators'" title="删除" class="list-icon delete-icon"
                  @click="deleteRole(item.row.id)"></button>
          <el-dropdown v-access="'sysconf.role.allocateuser,sysconf.role.allocategroup,sysconf.role.allocatecat'" trigger="click" style="display: flex">
            <button :class="{'more-active': data.operationItem.id === item.row.id}" title="更多" class="nav-more list-icon" @click="showOperation($event, item.row)"/>
            <el-dropdown-menu slot="dropdown" class="action-popover">
              <el-dropdown-item v-access="'sysconf.role.allocateuser'" :disabled="item.row.roleName === 'Administrators' && !isAdmin" >
                <p @click="distributeUser(item)">分配用户</p>
              </el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.role.allocategroup'" :disabled="item.row.roleName === 'Administrators' && !isAdmin">
                <p @click="distributeGroup(item)">分配组织</p>
              </el-dropdown-item>
              <el-dropdown-item v-access="'sysconf.role.allocatecat'" :disabled="item.row.roleName === 'Administrators'">
                <p @click="categoryAuth(item)">分类授权</p>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </com-table>
      <com-pagination :pagination="data.pagination" @callback="queryList">
      </com-pagination>
    </div>

    <!-- 版本信息 -->
    <edition/>
  </div>
</template>

<script>
import trsTimeSelect from '@/views/common/timeSelect/index'
import comTable from '@/views/common/table/index'
import comPagination from '@/views/common/pagination/index'
import edition from '@/views/common/footer/footer.vue'
import { initDate } from "@/utils/index"
import editRoleDialog from './components/editRole.vue'
import distributeUserDialog from './components/distributeUser.vue'
import distributeGroupDialog from './components/distributeGroup.vue'
import categoryAuthDialog from './components/categoryAuth.vue'

export default {
  name: 'roleManagement',

  components: {
    trsTimeSelect,
    comTable,
    comPagination,
    edition
  },

  data () {
    return {
      loading: false,
      data: {
        listSource: null,
        columns: [],
        columnsProps: {
          disdraggable: true,
          hasSelection: true,
          hasIndex: true,
          hasEdit: true,
          checkSelectable: (row) => {
            return row.roleName !== 'Administrators'
          }
        },
        pagination: {},
        operationItem: {
          itemId: ''
        }
      },
      status: {
        searchText: '',
        selectedIds: ''
      },
      isAdmin: false // 当前用户是否为超管
    }
  },

  mounted () {
    this.initProp()
    this.queryList()
    this.checkUserAdmin()
  },

  methods: {
    /**
     * 初始化表头
     */
    initProp () {
      this.data.columns = [{
        label: '角色名称',
        prop: 'roleName',
        minWidth: 100,
      }, {
        label: '权限模板',
        prop: 'rightTemplateName',
        minWidth: 100,
      }, {
        label: '用户数',
        prop: 'userCount',
        minWidth: 80,
      }, {
        label: '组织数',
        prop: 'groupCount',
        minWidth: 80,
      }, {
        label: '创建人',
        prop: 'createUser',
        minWidth: 100,
      }, {
        label: '创建时间',
        prop: 'createTime',
        minWidth: 100,
        format: (row, prop) => {
          return initDate(row.createTime)
        }
      }]

      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    /**
     * 请求列表数据
     */
    queryList (page) {
      this.loading = true
      let params = {
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime
      }
      this.$api.queryRoleList(params).then(data => {
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 处理选择项
     */
    handleSelectionChange (ids) {
      this.status.selectedIds = ids
    },

    /**
     * 展示更多
     */
    showOperation (event, item) {
      event.stopPropagation()
      this.data.operationItem = this.data.operationItem.id ? {} : item
    },

    /**
     * 新建/编辑角色
     */
    editRole (item = {}) {
      this.$dialog(editRoleDialog, { editItem: item }).then(data => {
        this.queryList()
      })
    },

    /**
     * 删除角色
     */
    deleteRole (id) {
      this.$trsModalConfirm({
        content: '是否删除所选角色?',
        title: '删除角色',
        danger: true
      }).then(data => {
        this.loading = true
        let url = {
          roleIds: id ? id : this.status.selectedIds
        }
        this.$api.deleteRole(url).then(() => {
          this.$trsModalSuccess('删除角色成功！')
          this.queryList()
          this.loading = false
        }, () => {
          this.loading = false
        })
      })
    },

    /**
     * 查询当前用户是否为超管
     */
    checkUserAdmin () {
      this.$api.isAdmin().then(data => {
        this.isAdmin = data
      })
    },

    /**
     * 分配用户
     */
    distributeUser (item) {
      this.$dialog(distributeUserDialog, { roleId: item.row.id }).then(() => {
        this.queryList()
      })
    },

    /**
     * 分配组织
     */
    distributeGroup (item) {
      this.$dialog(distributeGroupDialog, { roleId: item.row.id }).then(() => {
        this.queryList()
      })
    },

    /**
     * 分类授权
     */
    categoryAuth (item) {
      this.$dialog(categoryAuthDialog, { roleId: item.row.id }).then(() => {
        this.queryList()
      })
    }
  }
}
</script>
