<template>
  <!-- 一键撤稿弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="一键撤稿" custom-class="revoke-source">
    <div v-loading="loading" element-loading-text="数据加载中..." class="standard-delete">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips" v-html="tipContent"></span>
      </p>
      <el-form label-width="100px" class="demo-ruleForm pwd-input">
        <el-form-item prop="standardPwd" label="登录密码：">
          <el-input v-model="password" :type="inputType" :class="{'error': showError && !password}" placeholder="请输入登录密码"></el-input>
          <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
        </el-form-item>
      </el-form>
      <p v-if="showError && !password" class="error-tips" style="margin:0;margin-left:100px;">请输入密码！</p>
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
  name: 'revokeDialog',

  props: {
    url: {
      type: Object,
      required: true
    },
    params: {
      type: Object,
      required: true
    },
    type: {
      type: [Number, Object],
      default: null
    }
  },

  data () {
    return {
      password: '',
      isPwdShow: true, //默认密文显示
      showError: false,
      loading: false
    }
  },

  computed: {
    inputType () {
      return this.isPwdShow ? 'password' : 'text'
    },
    tipContent () {
      let text = ''
      // 版本稿
      if (this.type === 0) {
        text = '版本稿撤稿将同步撤销对应CMS系统的稿件'
      // 版本稿
      } else if (this.type === 1) {
        text = '正式稿撤稿将同步撤销所有CMS系统的相关联稿件'
      // 批量操作
      } else {
        text = '正式稿撤稿将同步撤销所有CMS系统的相关联稿件;<br/>版本稿撤稿将同步撤销对应CMS系统的稿件'
      }
      return text + '<br/>请输入登录密码确认后一键撤稿'
    }
  },

  methods: {
    confirm () {
      if (!this.password) {
        this.showError = true
        return
      }
      this.loading = true
      this.$api.deleteResource(this.url, Object.assign(this.params, { password: '__encoded__' + Base64.encode(this.password) })).then(data => {
        this.$trsModalSuccess('一键撤稿成功!')
        this.$close()
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.revoke-source {
  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .el-form-item {
    margin: 0;
  }

  .error input {
    border-color: #fe6772;
  }
}
</style>
