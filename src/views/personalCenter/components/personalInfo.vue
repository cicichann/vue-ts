<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="个人信息">
    <el-form v-loading="loading" ref="form" :model="ruleForm" :rules="rules" element-loading-text="数据加载中..." label-width="100px">
      <el-form-item label="用户名:" class="addGroup">
        <el-input v-model="ruleForm.userName" :disabled="true"></el-input>
      </el-form-item>
      <el-form-item label="手机号:" prop="mobile" class="addGroup">
        <el-input v-model="ruleForm.mobile"></el-input>
      </el-form-item>
      <el-form-item label="电子邮箱:" prop="email" class="addGroup">
        <el-input v-model="ruleForm.email"></el-input>
      </el-form-item>
      <el-form-item label="所属组织:" class="addGroup group-item">
        <el-input v-model="ruleForm.groupName" :disabled="true" :title="ruleForm.groupName" placeholder="无"></el-input>
      </el-form-item>
      <el-form-item label="所属角色:" class="addGroup role-item">
        <el-input v-model="ruleForm.roles" :disabled="true" :title="ruleForm.roles" placeholder="无"></el-input>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'PersonalInfoDialog',

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
      ruleForm: {
          userName: '',
          mobile: '',
          email: '',
          groupName: '',
          roles: ''
      },
      rules: {
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur'] }
        ],
        mobile: [
          { required: true ,validator: this.checkNumber, trigger: ['blur'] }
        ]
      }
    }
  },

  mounted () {
    this.queryList()
  },

  methods: {
    queryList() {
      this.loading = true
      let url = {
        userName: this.user.userName
      }
      this.$api.queryUserInfo(url).then(data => {
        var groups = []
        var roles = []
        for(var i = 0 ; i < data.groups.length ; i ++) {
          groups.push(data.groups[i].groupName)
        }
        for(var j = 0 ; j < data.roles.length ; j ++) {
          roles.push(data.roles[j].roleName)
        }

        this.ruleForm = data
        this.ruleForm.groupName = groups.join('、')
        this.ruleForm.roles = roles.join('、')
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * 手机号校验
     */
    checkNumber (rule, value, callback) {
      var prefixReg = /^((13[0-9])|(14[1,5,6,7,9])|(15([0-3]|[5-9]))|(16[2,5,6,7])|(17[0,1,2,3,5,6,7,8])|(18[0-9])|(19[1|8|9]))\d{8}$/
      if(!value) {
        callback(new Error('请输入手机号'))
      } else if(!prefixReg.test((value))) {
        callback(new Error('请输入正确手机号'))
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
            userName: this.user.userName,
            email: this.ruleForm.email,
            mobile: this.ruleForm.mobile
          }

          this.$api.editUserInfo(params).then(data => {
            this.$trsModalSuccess('保存个人信息成功！')
            this.$close()
          }, err => {
            this.loading = false
          })
        }, () => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss">
  .addGroup {
    .el-form-item__error,.el-input {
      margin-left: 17px;
    }
    &.group-item,&.role-item {
      input {
        text-overflow: ellipsis;
      }
      input::-webkit-input-placeholder {
          /* placeholder颜色  */
          color: #363d4e !important;
      }
    }
  }
</style>
