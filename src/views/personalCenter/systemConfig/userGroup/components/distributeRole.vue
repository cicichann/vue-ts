<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="distribute-role">
    <div v-loading="loading" element-loading-text="数据加载中..." class="distribute-modal clearfix">
      <div class="dialog-panel distribute-panel">

        <!-- 检索 -->
        <div class="panel-head">
          <el-input v-model="status.searchText" placeholder="请输入角色名称" @keyup.enter.native="queryList">
            <i slot="suffix" class="input-icon" @click="queryList"/>
          </el-input>
        </div>

        <!-- 角色列表 -->
        <div class="panel-body">
          <el-checkbox-group v-model="data.checkedList">
            <ul>
              <template v-for="user in data.roleList">
                <li :key="user.id">
                  <span :title="user.roleName" class="name">{{ user.roleName }}</span>
                  <el-checkbox :label="user.id + '/*/' + user.roleName" :disabled="user.roleName === 'Administrators' && !isAdmin"/>
                </li>
              </template>
            </ul>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 已选角色列表 -->
      <div class="dialog-panel distribute-panel checked-res">
        <div class="panel-head">
          <h6>已选角色</h6>
        </div>
        <div class="panel-body">
          <ul>
            <li v-for="res in data.checkedList" :title="res.split('/*/')[1]" :key="res">
              <i :class="{'close-disable': res.split('/*/')[1] === 'Administrators' && !isAdmin}" class="delete-icon" @click="removeItem(res)"></i>
              {{ res.split("/*/")[1] }}
            </li>
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
export default {
  name: 'distributeRoleDialog',

  props: {
    userId: {
      type: Number,
      default: 0
    },
    groupId: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      loading: false,
      data: {
        roleList: [],
        checkedList: [] // 选中的数组
      },
      status: {
        searchText: ''
      },
      isAdmin: false
    }
  },

  computed: {
    title () {
      return this.userId ? '分配角色至用户' : '分配角色至组织'
    }
  },

  mounted () {
    this.getAdmin()
    this.queryList().then(() => {
      this.getCheckedRole()
    })
  },

  methods: {
    /**
     * 请求角色列表
     */
    queryList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        let params = {
          searchText: this.status.searchText,
          granularity: 'ALL',
          beginDateTime: '',
          endDateTime: '',
          pageIndex: 1,
          pageSize: 10000
        }
        this.$api.queryRoleList(params).then(data => {
          this.data.roleList = data.data
          this.loading = false
          resolve()
        }, err => {
          this.loading = false
          reject()
        })
      })
    },

    /**
     * 获取当前用户是否为超管
     */
    getAdmin () {
      this.$api.isAdmin().then(data => {
        if (data) {
          this.isAdmin = true
        }
      })
    },

    /**
     * 获取已选角色列表
     */
    getCheckedRole () {
      if (this.userId) {
        let params = {
          userId: this.userId
        }
        this.$api.queryRoleRightList(params).then(data => {
          let arr = []
          data.map((item, index) => {
            let node = item.id + "/*/" + item.roleName
            arr.push(node)
          })
          this.data.checkedList = arr
        })
      } else {
        let params = {
          groupId: this.groupId
        }
        this.$api.selectedRoles(params).then(data => {
          let arr = []
          data.map((item, index) => {
            let node = item.id + "/*/" + item.roleName
            arr.push(node)
          })
          this.data.checkedList = arr
        })
      }
    },

    /**
     * 移除选中项
     */
    removeItem (res) {
      if (res.split("/*/")[1] === 'Administrators' && !this.isAdmin) {
        return
      }
      this.data.checkedList.splice(this.data.checkedList.indexOf(res), 1)
    },

    /**
     * 用户管理-分配角色
     */
    distributeRoleToUser (ids) {
      this.loading = true
      let pramas = {
        roleIds: ids
      }
      let url = {
        userId: this.userId
      }
      this.$api.roleDistrib(url, pramas).then(data => {
        this.$trsModalSuccess("分配角色成功！")
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 组织管理-分配角色
     */
    distributeRoleToGroup (ids) {
      this.loading = true
      let params = {
        groupId: this.groupId,
        roleIds: ids
      }
      this.$api.distribRole(params).then(data => {
        this.$trsModalSuccess('分配角色成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 确认
     */
    confirm () {
      let list = this.data.checkedList
      let ids = ''
      this.data.checkedList = []
      for (var i = 0; i < list.length; i++) {
        this.data.checkedList[i] = list[i].split('/*/')[0]
      }
      ids = this.data.checkedList.join(',')
      if (this.groupId) {
        this.distributeRoleToGroup(ids)
      } else {
        this.distributeRoleToUser(ids)
      }
    }
  }
}
</script>
