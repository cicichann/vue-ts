<template>
  <!-- 删除分类弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="删除分类">
    <div v-loading="loading">
      <p>
        <i class="modal-warning-icon"></i>
        <span class="error-tips" v-html="tipMsg"></span>
      </p>
      <el-form ref="deleteRuleForm" :model="deleteRuleForm" :rules="rules" label-width="100px" class="demo-ruleForm pwd-input" @submit.native.prevent>
        <el-form-item prop="standardPwd" label="登录密码：">
          <el-input v-model="deleteRuleForm.standardPwd" :type="inputType" placeholder="请输入登录密码"></el-input>
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
  name: 'deleteCategoryDialog',

  props: {
    standardId: {
      type: [Number, String],
      required: true
    },
    ids: {
      type: [Number, String],
      required: true
    }
  },

  data () {
    return {
      rules: {
        standardPwd: [
          { required: true, message: "请输入登录密码", trigger: "blur" }
        ]
      },
      deleteRuleForm: {
        standardPwd: ""
      },
      isPwdShow: true, //默认密文显示
      loading: false,
      tipMsg: ''
    }
  },

  computed: {
    inputType() {
      return this.isPwdShow ? 'password' : 'text'
    }
  },

  mounted () {
    this.loading = true
    this.$api.get(`/standards/${this.standardId}/categories/recycleBin/data`, {categoryIds: this.ids}).then(status => {
      this.tipMsg = status ? '有数据在回收站中，删除当前分类会彻底删除对应数据，<br />请输入登录密码确认后删除' : '删除当前分类会删除所有子分类，<br />请输入登录密码确认后删除'
      this.loading = false
    }, () => {
      this.loading = false
    })
  },

  methods: {
    confirm () {
      this.loading = true
      this.$refs.deleteRuleForm.validate()
        .then(() => {
          let url = {
            standardId: this.standardId,
            categoryIds: this.ids
          }
          this.$api.classfyDelete(url, {password: Base64.encode(this.deleteRuleForm.standardPwd)}).then(data => {
            this.$trsModalSuccess("删除分类成功！")
            this.$close(true)
          }, data => {
            this.loading = false
          })
        }, () => {
          this.loading = false
        })
    }
  }
}
</script>
