<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="delete-task">
    <div v-loading="loading">
      <p class="confirm-tips">
        <i class="modal-warning-icon fl"></i>
        <span v-html="tipMsg"></span>
      </p>
      <el-form ref="form" :model="formData" :rules="rules" label-width="100px" class="demo-ruleForm pwd-input">
        <el-form-item prop="password" label="登录密码：">
          <input v-show="false" type="password" autocomplete="new-password">
          <el-input v-model="formData.password" :type="inputType" placeholder="请输入登录密码"></el-input>
        </el-form-item>
        <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="danger" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

export default {
  name: 'deleteDialog',

  props: {
    params: {
      type: Object,
      default: () => {}
    },
    url: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: '删除'
    },
    tipMsg: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      loading: false,
      isPwdShow: true,
      formData: {
        password: ''
      },
      rules: {
        password: [
          { required: true, message: '请输入登录密码', trigger: ['blur', 'change'] }
        ]
      }
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
      this.$refs.form.validate().then(() => {
        this.$api.delete(this.url, Object.assign(this.params, { password: '__encoded__' + Base64.encode(this.formData.password) })).then(data => {
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
