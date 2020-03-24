<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="分配用户至角色" custom-class="distribute-user">
    <div v-loading="loading" element-loading-text="数据加载中..." class="clearfix">
      <div class="dialog-panel distribute-panel">

        <!-- 检索 -->
        <div class="panel-head">
          <el-input v-model="status.searchText" placeholder="请输入用户名称" @keyup.enter.native="queryList">
            <i slot="suffix" class="input-icon" @click="queryList"/>
          </el-input>
        </div>

        <!-- 用户列表 -->
        <div class="panel-body">
          <el-checkbox-group v-model="data.checkedList">
            <ul>
              <template v-for="user in data.userList">
                <li v-if="user.userName" :key="user.id" :title="user.userName">
                  <span :title="user.userName" class="name">{{ user.userName }}</span><el-checkbox :label="user.id + '/*/' + user.userName"/>
                </li>
              </template>
              <template v-for="user in data.userList">
                <li v-if="user.roleName" :key="user.id" :title="user.roleName">
                  <span :title="user.roleName" class="name">{{ user.roleName }}</span><el-checkbox :label="user.id + '/*/' + user.roleName"/>
                </li>
              </template>
            </ul>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 已选用户列表 -->
      <div class="dialog-panel distribute-panel checked-res">
        <div class="panel-head">
          <h6>已选用户</h6>
        </div>
        <div class="panel-body">
          <ul>
            <li v-for="item in data.checkedList" :title="item.split('/*/')[1]" :key="item"><i class="delete-icon" @click="removeItem(item)"></i>{{ item.split("/*/")[1] }}</li>
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
  name: 'distributeUserDialog',

  props: {
    roleId: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      loading: false,
      data: {
        userList: [],
        checkedList: [] // 选中的数组
      },
      status: {
        searchText: ''
      }
    }
  },

  mounted () {
    this.queryList().then(() => {
      this.getCheckedUsers()
    })
  },

  methods: {
    /**
     * 获取用户列表
     */
    queryList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        let params = {
          searchText: this.status.searchText,
          status: 1,
          granularity: 'ALL',
          pageIndex: 1,
          pageSize: 10000,
          terseStyle: 1
        }
        this.$api.queryUserList(params).then(data => {
          this.data.userList = data.data
          this.loading = false
          resolve()
        }, () => {
          this.loading = false
          reject()
        })
      })
    },

    /**
     * 获取已分配用户列表
     */
    getCheckedUsers () {
      this.loading = true
      let params = {
        roleId: this.roleId
      }
      this.$api.queryCheckedUsers(params).then(data => {
        let list = []
        data.map((item , index) => {
          let node = item.id + '/*/' + item.userName
          list.push(node)
        })
        this.data.checkedList = list
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 移除选中项
     */
    removeItem (item) {
      let list = this.data.checkedList
      list.splice(list.indexOf(item), 1)
    },

    /**
     * 确认提交
     */
    confirm () {
      this.loading = true
      let list = []
      this.data.checkedList.map(item => {
        list.push(item.split('/*/')[0])
      })
      let params = {
        userIds: list.join(','),
        roleId: this.roleId
      }
      this.$api.distributeUser(params).then(() => {
        this.$trsModalSuccess('分配用户成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>