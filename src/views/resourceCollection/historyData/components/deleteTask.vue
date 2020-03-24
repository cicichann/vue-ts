<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="删除" custom-class="delete-task">
    <div v-loading="loading">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips">删除会清除任务及已迁移的数据，<br />请输入登录密码确认后删除！</span>
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
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

export default {
  name: 'deleteTaskDialog',

  props: {
    query: {
      type: Object,
      required: true
    },
    taskId: {
      type: Array,
      required: true
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
      },
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
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid,
          taskIds: this.taskId
        }
        let params = {
          password: Base64.encode(this.formData.password)
        }

        this.$api.deleteTask(url, params).then(data => {
          this.$trsModalSuccess('删除成功！')
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

