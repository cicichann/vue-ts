<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="add-user">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." label-width="90px">
      <el-form-item label="用户名:" prop="userName" class="addGap">
        <input type="text" style="display:none">
        <el-input v-model="formData.userName" :disabled="isModify" autocomplete="off" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item v-if="!isModify" label="密码:" class="addGap pwd-input" prop="pwd">
        <!-- <el-input type="password" auto-complete="new-password" style="display: none;"></el-input> -->
        <el-input :type="inputType" v-model="formData.pwd" autocomplete="new-password" placeholder="请输入密码"></el-input>
        <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
      </el-form-item>
      <el-form-item label="手机号:" prop="mobile" class="addGap">
        <el-input v-model="formData.mobile" placeholder="请输入手机号"></el-input>
      </el-form-item>
      <el-form-item label="电子邮箱:" prop="email" class="addGap">
        <el-input v-model="formData.email" placeholder="请输入电子邮箱"></el-input>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

export default {
  name: "PersonalInfoDialog",

  props: {
    user: {
      type: Object,
      default: () => {}
    },
    editItem: {
      type: Object,
      default: () => {}
    },
    groupId: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      loading: false,
      rules: {
        userName: [
          { min: 2, max: 16, message: "用户名的合法长度为2~16个字符", trigger: ["blur", "change"] },
          { required: true, validator: this.checkUserName, trigger: ["blur"] }
        ],
        pwd: [
          { required: true, validator: this.checkPassWord, trigger: ["blur"] },
          { min: 8, message: "最小长度不能低于8个字符", trigger: ["blur"] }
        ],
        email: [
          { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur"] }
        ],
        mobile: [{ required: true, validator: this.checkNumber, trigger: ["blur"] }]
      },
      formData: {
        userName: "",
        mobile: "",
        pwd: "",
        email: ""
      },
      isPwdShow: true //默认密文显示
    }
  },

  computed: {
    inputType() {
      return this.isPwdShow ? 'password' : 'text'
    },
    title () {
      return this.editItem.id && '编辑用户' || (this.groupId ? '新建用户' : '新增用户')
    },
    isModify () {
      return !!this.editItem.id
    }
  },

  mounted () {
    if (this.editItem.id) this.findUserById()
  },

  methods: {
    /**
     * 请求数据
     */
    findUserById () {
      this.loading = true
      this.$api.getUserMsg(this.editItem).then(data => {
        this.formData = data
        this.loading = false
      })
    },

    /**
     * 手机号检验
     */
    checkNumber (rule, value, callback) {
      var prefixReg = /^((13[0-9])|(14[1,5,6,7,9])|(15([0-3]|[5-9]))|(16[2,5,6,7])|(17[0,1,2,3,5,6,7,8])|(18[0-9])|(19[1|8|9]))\d{8}$/
      if (value === "") {
        callback(new Error("请输入手机号"))
      } else if (!prefixReg.test(value)) {
        callback(new Error("请输入正确手机号"))
      } else {
        callback()
      }
    },

    /**
     * 用户名校验
     */
    checkUserName (rule, value, callback) {
      var prefixReg = /^[a-zA-Z0-9.\-_\u4e00-\u9fa5]+$/
      if (!value) {
        callback(new Error("请输入用户名"))
      } else if (!prefixReg.test(value)) {
        callback(
          new Error("请输入汉字、英文字母、数字、点、中杠线或下划线")
        )
      } else if (value === "system" || value === "admin") {
        callback(new Error(value + "为系统保留字"))
      } else {
        let pramas = {
          userName: this.formData.userName
        }
        if(!this.isModify) {
          this.$api.personalCheckUserName(pramas).then(data => {
            if (!data.available) {
              callback(new Error(data.msg))
            } else {
              callback()
            }
          })
        } else {
          callback()
        }
      }
    },

    /**
     * 密码校验
     */
    checkPassWord (rule, value, callback) {
      if (!value) {
        callback(new Error("请输入密码"))
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
     * 用户管理-新增用户
     */
    addUser (params) {
      params.userPwd = Base64.encode(this.formData.pwd)
      this.$api.addUsers(params).then(data => {
        this.$trsModalSuccess('新增用户成功！')
        this.$close()
      }, err => {
        this.loading =  false
      })
    },

    /**
     * 组织管理-新建用户
     */
    addUserToGroup (params) {
      params.groupId = this.groupId
      params.userPwd = Base64.encode(this.formData.pwd)
      this.$api.addUserInGroup(params).then(data => {
        this.$trsModalSuccess('新建用户成功！')
        this.$close()
      }, err => {
        this.loading =  false
      })
    },

    /**
     * 编辑用户
     */
    editUser (url, params) {
      this.$api.editUserMsg(url, params).then(data => {
        this.$trsModalSuccess('编辑用户成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 确认
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate().then(() => {
        let url = {
          id: this.editItem.id
        }
        let params = {
          userName: this.formData.userName,
          mobile: this.formData.mobile,
          email: this.formData.email ? this.formData.email : ""
        }
        if (this.editItem.id) {
          this.editUser(url, params)
        } else {
          this.groupId ? this.addUserToGroup(params) : this.addUser(params)
        }
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.addGap {
  .el-form-item__error,
  .el-input {
    margin-left: 17px;
  }
}

.el-input .el-input__inner {
  color: #595959;
}
</style>
