<template>
  <!-- 删除库弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="删除库">
    <div v-loading="loading">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips">删除库会导致数据表及数据表中的数据全部被删除，<br />请输入登录密码后删除。</span>
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
import { Base64 } from "js-base64"

export default {
  name: 'deleteGroupDialog',

  props: {
    standardId: {
      type: [Number, String],
      required: true
    },
    group: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      rules: {
        password: [
          { required: true, message: "请输入登录密码", trigger: "blur" }
        ]
      },
      formData: {
        password: ""
      },
      isPwdShow: true, //默认密文显示
      loading: false
    }
  },

  computed: {
    inputType() {
      return this.isPwdShow ? 'password' : 'text'
    }
  },

  methods: {
    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          let url = {
            standardId: this.standardId,
            groupId: this.group.id
          }

          this.$api.deleteGroup(url, {userPwd: Base64.encode(this.formData.password)}).then(() => {
            this.$trsModalSuccess("删除库成功！")
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
