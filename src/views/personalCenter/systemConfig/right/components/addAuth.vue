<template>
  <!-- 新建、编辑权限模板弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="add-auth">
    <el-form v-loading="loading" ref="form" :model="ruleForm" :rules="rules" label-width="100px" class="in-dialog">
      <el-form-item label="模板名称：" prop="templateName" class="in-input-row">
        <el-input v-model="ruleForm.templateName" type="text" placeholder="请输入模板名称"></el-input>
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
  name: 'addAuthDialog',

  props: {
    title: {
      type: String,
      required: true
    },
    template: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    var isTemplateNameExist = (rule, name, callback) => {
      if (!name) {
        callback(new Error("请输入模板名称"))
      } else {
        this.$api.checkTemplateName({ name: name, id: this.template.id || 0 }).then(data => {
          // data.available ? callback() : callback(new Error(data.msg))
          callback()
        }, (err) => {
          callback(new Error("模板名称重复"))
        })
      }
    }

    return {
      rules: {
        templateName: [
          {required: true, trigger: ['blur'], validator: isTemplateNameExist},
          {required: true, max: 50, trigger: 'blur', message:'最大长度不能超过50个字符'}
        ]
      },
      ruleForm: {
        templateName: this.template.templateName
      },
      loading: false
    }
  },

  methods: {
    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          if (this.template.id) {
            this.editAuth()
          } else {
            this.addAuth()
          }
        }, () => {
          this.loading = false
        })
    },

    editAuth () {
      this.$api.changeAuth({ name: this.ruleForm.templateName, id: this.template.id }).then(data => {
        this.$trsModalSuccess('编辑权限模板成功!')
        this.$close()
      })
    },

    addAuth () {
      this.$api.addAuth({ name: this.ruleForm.templateName }).then(data => {
        this.$trsModalSuccess('新建权限模板成功!')
        this.$close()
      })
    }
  }
}
</script>

<style lang="scss">
.add-auth {
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

  .error-tips {
    color: #fe6772;
  }
}
</style>
