<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="standard.id ? '重命名标准' : '新增标准'" custom-class="edit-standard">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." label-width="100px" class="demo-ruleForm" @submit.native.prevent>
      <el-form-item prop="name" label="标准名称：">
        <el-input ref="input" v-model="formData.name" placeholder="请输入标准名称" @input="disabled = false" />
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="disabled || loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'editStandardDialog',

  props: {
    standard: {
      type: Object,
      default: () => { }
    }
  },

  data () {
    return {
      loading: false,
      formData: {
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入标准名称', trigger: ['blur', 'change'] },
          { validator: this.checkName, trigger: 'blur' }
        ]
      },
      disabled: false
    }
  },

  mounted () {
    if (this.standard.id) {
      this.initData()
      this.disabled = true
      this.$nextTick(() => {
        document.querySelector(".edit-standard input").select()
      })
    }
  },

  methods: {
    /**
     * 重命名初始化数据
     */
    initData () {
      this.formData = Object.assign({ }, this.standard)
    },

    /**
     * 名称校验
     */
    checkName (rule, value, callback) {
      let params = {
        standardName: this.formData.name,
        standardId: this.standard.id
      }

      this.$api.checkStandradName(params).then(data => {
        if(!data.available) {
          callback(new Error(data.msg))
        }
        callback()
      })
    },

    /**
     * 新增标准
     */
    addStandard (params) {
      this.loading = true
      this.$api.addNewStandard(params).then(data => {
        this.$trsModalSuccess('新增标准成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 重命名标准
     */
    editStandard (params) {
      this.loading = true
      this.$api.renameStandard(params).then(data => {
        this.$trsModalSuccess('重命名标准成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 确认提交
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          let params = {
            name: this.formData.name
          }

          if (this.standard.id) {
            params.id = this.standard.id
            this.editStandard(params)
          } else {
            this.addStandard(params)
          }
        }, () => {
          this.loading = false
          let errInputs = document.querySelectorAll(".is-error")
          errInputs[0].querySelector('input').focus()
        })
    }
  }
}
</script>
