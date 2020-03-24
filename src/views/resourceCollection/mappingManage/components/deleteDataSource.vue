<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="删除数据源" custom-class="delete-data-source">

    <div v-loading="loading">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips">删除数据源将删除已配置好的全部映射关系，<br />影响数据迁移，请输入登录密码确认后删除！</span>
      </p>
      <el-form ref="form" :model="form" label-width="100px" class="demo-ruleForm pwd-input">

        <el-form-item :rules="{required: true, trigger: 'blur', message: '请输入登录密码'}" prop="password" label="登录密码：">
          <input type="password" autocomplete="new-password" style="position: fixed; top: -999px">
          <el-input v-model="form.password" :type="inputType" placeholder="请输入登录密码"></el-input>
          <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
        </el-form-item>

        <el-form-item label="">
          <el-checkbox v-model="form.deletedata" true-label="1" false-label="0">删除已迁移的历史数据</el-checkbox>
        </el-form-item>

      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="danger" @click="deleteDataSource">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>

  </el-dialog>
</template>

<script>
import { Base64 } from 'js-base64'

export default {
  name: 'deleteSourceDialog',

  props: {
    editItem: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },

  data() {
    return {
      form: {
        password: '',
        deletedata: ''
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
    /**
     * 删除数据源
     */
    deleteDataSource() {
      this.loading = true
      this.$refs.form.validate().then(() => {
        let params = {
          passWord: Base64.encode(this.form.password),
          deletedata: this.form.deletedata || 0
        }

        this.$api.deleteDataSource(this.$pick(this.editItem, ['standardId', 'id']), params).then(() => {
          this.$trsModalSuccess('删除数据源成功！')
          this.$close();
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

<style lang="scss">
.delete-data-source {
  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .standard-delete .pwd-input .pwd-view {
    position: absolute;
    top: 0;
    right: 55px;
    margin-top: 8px;
  }

  .el-form-item:nth-child(2) {
    margin-bottom: 0;

    .el-form-item__content {
      line-height: 20px;
    }
    .el-checkbox {
      color: #595959;
    }
  }
}
</style>
