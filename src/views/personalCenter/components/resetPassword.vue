<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="重置密码">
    <div v-loading="loading" element-loading-text="数据加载中..." class="standard-delete">
      <el-form ref="form" :model="resetForm" :rules="rules2" label-width="100px" class="demo-ruleForm pwd-input">
        <el-form-item prop="oldPwd" label="原密码：">
          <el-input v-model="resetForm.oldPwd" :type="oldInputType" placeholder="请输入原始密码"></el-input>
          <i :class="{'pwd-view-icon': !isOgPwdShow}" class="pwd-view" @click="isOgPwdShow = !isOgPwdShow"></i>
        </el-form-item>
        <el-form-item prop="newPwd" label="新密码：" style="margin-bottom: 10px;">
          <el-input v-model="resetForm.newPwd" :type="newInputType" placeholder="请输入新设置密码"></el-input>
          <i :class="{'pwd-view-icon': !isNewPwdShow}" class="pwd-view" @click="isNewPwdShow = !isNewPwdShow"></i>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'
export default {
  name: 'resetPasswordDialog',

  props: {
    user: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      data: { },
      resetForm: {
        oldPwd: '',
        newPwd: ''
      },
      rules2: {
        oldPwd: [
          { required: true ,validator: this.checkOldPassWord, trigger: 'blur' }
        ],
        newPwd: [
          { required: true ,validator: this.checkNewPassWord, trigger: 'blur' }
        ]
      },
      isOgPwdShow: true,
      isNewPwdShow: true
    }
  },

  computed: {
    oldInputType() {
      return this.isOgPwdShow ? 'password' : 'text'
    },

    newInputType() {
      return this.isNewPwdShow ? 'password' : 'text'
    }
  },

  methods: {
    /**
     * 新密码校验
     */
    checkNewPassWord (rule, value, callback) {
      if(!value) {
        callback(new Error('请输入新设置密码'))
      } else {
        let params = {
          oldPassword: Base64.encode(this.resetForm.newPwd),
          newPassword: Base64.encode(this.resetForm.newPwd)
        }

        this.$api.checkPassWord(params).then(data => {
          if(!data.available) {
            callback(new Error(data.msg))
          } else {
            callback()
          }
        })
      }
    },

    /**
     * 原始密码校验
     */
    checkOldPassWord (rule, value, callback) {
      if(!value) {
        callback(new Error('请输入原始密码'))
      } else {
        callback()
      }
    },

    /**
     * 提交表单
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          let params = {
            oldPassword: Base64.encode(this.resetForm.oldPwd),
            newPassword: Base64.encode(this.resetForm.newPwd),
            userName: this.user.userName
          }

          this.$api.reserPassword(params).then(data => {
            this.$trsModalSuccess('重置密码成功！')
            this.$close()
          }, err => {
            this.loading = false
          })
        }, err => {
          this.loading = false
        })
    }
  }
}
</script>
