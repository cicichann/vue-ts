<template>
  <!-- 添加用户弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="添加用户" custom-class="distribute-user">
    <div v-loading="loading" element-loading-text="数据加载中..." class="distribute-modal clearfix">
      <div class="dialog-panel distribute-panel">

        <!-- 用户检索 -->
        <div class="panel-head">
          <el-input v-model="status.searchText" placeholder="请输入用户名称" @keyup.enter.native="queryList">
            <i slot="suffix" class="input-icon" @click="queryList"/>
          </el-input>
        </div>

        <!-- 用户列表 -->
        <div class="panel-body group_add_user">
          <el-checkbox-group v-model="data.checkedUserList">
            <ul>
              <template v-for="user in filteredList">
                <li v-if="user.userName" :key="user.id" style="line-height: 26px;">
                  <span :title="user.userName" class="name">{{ user.userName }}</span><el-checkbox :label="user.id + '/*/' + user.userName"/>
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
            <li v-for="res in data.checkedUserList" :title="res.split('/*/')[1]" :key="res"><i class="delete-icon" @click="removeItem(user)"></i>{{ res.split("/*/")[1] }}</li>
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
  name: 'addUserDialog',

  props: {
    groupId: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      data: {
        checkedUserList: [] // 选中的数组
      },
      status: {
        searchText: ''
      },
      userList: [], // 左侧用户数据
      filteredList: []
    }
  },

  mounted () {
    this.queryUserList()
  },

  methods: {
    /**
     * 请求用户列表数据
     */
    queryUserList () {
      this.userList = [] // 清空前一次请求的数据
      this.loading = true
      let params = {
        groupId: this.groupId
      }
      this.$api.queryPassUsers(params).then(data => {
        this.userList = data
        this.filteredList = data
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * 检索用户列表
     */
    queryList () {
      this.filteredList = this.status.searchText ? this.userList.filter(item => {
        return item.userName.indexOf(this.status.searchText) >= 0
      }) : this.userList
    },

    /**
     * 移除选中项
     */
    removeItem (user) {
      this.data.checkedUserList.splice(this.data.checkedUserList.indexOf(user), 1)
    },

    /**
     * 确认
     */
    confirm () {
      this.loading = true
      let list = this.data.checkedUserList
      let ids = ''
      this.data.checkedUserList = []
      for (var i = 0; i < list.length; i++) {
        this.data.checkedUserList[i] = list[i].split('/*/')[0]
      }
      ids = this.data.checkedUserList.join(',')

      let params = {
        groupId: this.groupId,
        userIds: ids
      }
      this.$api.distribUser(params).then(data => {
        this.$trsModalSuccess("添加用户成功！")
        this.$close()
      }, err => {
        this.loading = false
      })
    }
  }
}
</script>
