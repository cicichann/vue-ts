<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="删除标准">
    <div v-loading="loading">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips">删除标准会导致标准下的分类、数据表全部被删除，<br />请输入登录密码后删除。</span>
      </p>
      <el-form ref="form" :model="formData" :rules="rules" label-width="100px" class="demo-ruleForm pwd-input">
        <el-form-item prop="password" label="登录密码：">
          <el-input v-model="formData.password" :type="inputType" placeholder="请输入登录密码"></el-input>
        </el-form-item>
        <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
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
  name: 'deleteStandardDialog',

  props: {
    standard: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      formData: {
        password: ''
      },
      rules: {
        password: [{ required: true, message: '请输入登录密码', trigger: ['blur', 'change'] }]
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
     * 确认删除
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          let params = {
            id: this.standard.id,
            password: Base64.encode(this.formData.password)
          }
          this.$api.deleteStandard(params).then(data => {
            this.$trsModalSuccess('删除标准成功！')
            this.$close()
          }, () => {
            this.loading = false
          })
        }, () => {
          this.loading = false
        })
    }
  }
}
</script>
