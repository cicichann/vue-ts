<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="重置密码">
    <div v-loading="loading" element-loading-text="数据加载中..." class="standard-delete">
      <el-form ref="form" :model="formData" :rules="rules" label-width="100px" class="demo-ruleForm pwd-input" @submit.native.prevent>
        <el-form-item prop="pwd" label="新密码：">
          <el-input v-model="formData.pwd" :type="inputType" placeholder="请输入新密码"></el-input>
          <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer">
      <el-button type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

export default {
  name: 'resetPasswordDialog',

  props: {
    userIds: {
      type: String,
      default: ''
    },
    groupId: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      loading: false,
      formData: {
        pwd: ''
      },
      rules: {
        pwd: [
          { required: true, validator: this.checkPassword, trigger: 'blur' }
        ]
      },
      isPwdShow: true //默认密文显示
    }
  },

  computed: {
    inputType() {
      return this.isPwdShow ? 'password' : 'text'
    }
  },

  methods: {
    /**
     * 密码校验
     */
    checkPassword (rule, value, callback) {
      if (!value) {
        callback(new Error("请输入新密码"))
      } else {
        let pramas = {
          userPwd: Base64.encode(this.formData.pwd)
        }

        this.$api.personalCheckPassWord(pramas).then(data => {
          if (!data.available) {
            callback(new Error(data.msg))
          } else {
            callback()
          }
        })
      }
    },

    /**
     * 用户管理-重置密码
     */
    resetPassword (params) {
      this.$api.resetPwd(params).then(data => {
        this.$trsModalSuccess('重置密码成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 组织管理-重置密码
     */
    resetPasswordForGroup (params) {
      params.groupId = this.groupId

      this.$api.groupResetPassword(params).then(data => {
        this.$trsModalSuccess('重置密码成功！')
        this.$close()
      }, err => {
        this.$close()
        this.loading = false
      })

    },

    /**
     * 确认重置
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate().then(() => {
        let params = {
          userIds: this.userIds,
          userPwd: Base64.encode(this.formData.pwd)
        }

        this.groupId ? this.resetPasswordForGroup(params) : this.resetPassword(params)
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>
