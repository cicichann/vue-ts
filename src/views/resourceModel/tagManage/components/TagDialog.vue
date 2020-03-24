<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="TagForm.TagName ? '编辑标签' : '新增标签'" custom-class="tag-dialog">
    <el-form v-loading="loading" ref="TagForm" :model="TagForm" :rules="rules" element-loading-text="数据加载中..." label-width="100px" @submit.native.prevent>
      <el-form-item label="标签名称：" prop="TagName">
        <el-input v-model="TagForm.TagName" placeholder="请输入标签名称"></el-input>
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
  name: 'editTagDialog',

  props: {
    datas: {
      type: Object,
      default:() => {}
    },
    tagType: {
      type: [String, Number],
      default: ''
    }
  },

  data() {
    return {
      loading: false,
      TagForm: {
        TagName: '',
      },
      rules: {
        TagName: [
          { max: 20, trigger: ["blur","change"], message: "最大长度不能超过20个字符" },
          { required: true, trigger: ["blur","change"], validator: this.checkTagName }
        ],
      },
    }
  },

  created() {
    if(this.datas.row) {
      this.TagForm.TagName = this.datas.row.label
    }
  },

  mounted() {
    document.onkeydown = function(e) {
      var key = window.event.keyCode

      return (key !== 13)
    }
  },

  methods: {
    /**
     * 提交表单
     */
    submitForm(formName) {
      this.$refs.TagForm.validate().then(() => {
        this.loading = true
        if(!this.datas.row) {
          //新增
          let params = {
            label: this.TagForm.TagName,
            labelType: this.tagType
          }
          this.$api.AddTagList(params).then(data => {
            this.$trsModalSuccess('新增标签成功！')
            this.$close()
          }, () => {
            this.loading = false
          })
        } else {
          //编辑
          let params = {
            label: this.TagForm.TagName,
            labelId: this.datas.row.id
          }

          this.$api.editTagList(params).then(data => {
            this.$trsModalSuccess('编辑标签成功！')
            this.$close()
          }, () => {
            this.loading = false
          })
        }
      })
    },

    /**
     * 点击确认按钮
     */
    confirm() {
      this.submitForm('TagForm')
    },

    /**
     * 标签必填、重名校验
     */
    checkTagName(rule, value, callback) {
      if (!value) {
        callback(new Error("请输入标签名称"))
      } else {
        let params = {
          label: this.TagForm.TagName,
          labelId: (this.datas.row && this.datas.row.id) || 0
        }

        this.$api.verifyTagList(params).then(data => {
          if(!data.available) {
            callback(new Error(data.msg))
          }
          callback()
        })
      }
    }
  }
}
</script>

<style lang="scss">
  .el-input .el-input__inner {
    color: #595959;
  }
  .tag-dialog {
    .el-dialog__footer {
      padding: 15px 30px 30px;
    }
  }
</style>
