<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="edit-group">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." label-width="100px" class="demo-ruleForm" @submit.native.prevent>
      <el-form-item prop="groupName" label="库名称：">
        <el-input ref="input" v-model="formData.groupName" placeholder="请输入库名称"/>
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
  name: "editGroupDialog",

  props: {
    standardId: {
      type: [String, Number],
      required: true
    },
    group: {
      type: Object,
      default: () => { }
    }
  },

  data() {
    return {
      loading: false,
      formData: {
        groupName: ''
      },
      rules: {
        groupName: [
          { required: true, message: '请输入库名称', trigger: ['blur', 'change'] },
          { validator: this.checkName, trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    title () {
      return this.group.id ? '重命名库' : '新增库'
    }
  },

  mounted () {
    if (this.group.id) {
      this.initData()
      this.$nextTick(() => {
        document.querySelector(".edit-group input").select()
      })
    }
  },

  methods: {
    /**
     * 重命名初始化数据
     */
    initData () {
      this.formData = Object.assign({ }, this.group)
    },

    /**
     * 名称校验
     */
    checkName (rule, value, callback) {
      let url = {
        standardId: this.standardId
      }
      let params = {
        groupName: this.formData.groupName,
        groupId: this.group.id ? this.group.id : ''
      }
      this.$api.checkGroupName(url, params).then(data => {
        if (!data.available) {
          callback(new Error(data.msg))
        }
        callback()
      })
    },

    /**
     * 新增库
     */
    addGroup (url, params) {
      this.loading = true
      this.$api.addGroup(url, params).then(data => {
        this.$trsModalSuccess("新增库成功！")
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 重命名库
     */
    editGroup (url, params) {
      this.loading = true
      this.$api.editGroup(url, params).then(data => {
        this.$trsModalSuccess("重命名分组成功！")
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
          let url = {
            standardId: this.standardId
          }

          let params = {
            groupName: this.formData.groupName
          }

          if (this.group.id) {
            url.groupId = this.group.id
            this.editGroup(url, params)
          } else {
            this.addGroup(url, params)
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
