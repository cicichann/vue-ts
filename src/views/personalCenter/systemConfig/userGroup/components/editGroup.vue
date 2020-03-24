<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="add-user">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." label-width="100px" @submit.native.prevent>
      <el-form-item label="组织名称：" prop="groupName">
        <el-input v-model="formData.groupName" placeholder="请输入组织名称"></el-input>
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
  name: 'editGroupDialog',

  props: {
    editItem: {
      type: Object,
      required: true
    },
    parentGroupId: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      required: true
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
          { required: true, message: '请输入组织名称', trigger: ['blur', 'change']},
          { max: 25, message: "最大长度不能超过25个字符", trigger: ['blur', 'change'] },
          { validator: this.checkGroupName, trigger: ['blur', 'change'] }
        ],
      },
    }
  },

  computed: {
    title () {
      return this.type === 'add' ? '新增组织' : '编辑组织'
    }
  },

  mounted () {
    if (this.type === 'edit') this.formData = JSON.parse(JSON.stringify(this.editItem))
  },

  methods: {
    /**
     * 组织名称校验
     */
    checkGroupName (rule, value, callback) {
      let params = {
        groupName: this.formData.groupName
      }

      if (this.type === 'add') {
        params.parentGroupId = this.editItem.id
      } else {
        params.groupId = this.editItem.id
        params.parentGroupId = this.parentGroupId
      }

      this.$api.isUsedGroupName(params).then(data => {
        if (!data.available) {
          callback(new Error(data.msg))
        } else {
          callback()
        }
      })
    },

    /**
     * 新增组织
     */
    addGroup (params) {
      this.loading = true
      params.parentGroupId = this.editItem.id

      this.$api.addGroups(params).then(data => {
        this.$trsModalSuccess('新增组织成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 编辑组织
     */
    editGroup (params) {
      this.loading = true
      params.groupId = this.editItem.id

      this.$api.editGroups(params).then(data => {
        this.$trsModalSuccess('编辑组织成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 提交表单
     */
    confirm () {
      this.loading = true
      this.$refs.form.validate().then(() => {
        let params = {
          groupName :this.formData.groupName
        }
        if (this.type === 'add') {
          this.addGroup(params)
        } else {
          this.editGroup(params)
        }
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
  .el-input .el-input__inner {
    color: #595959;
  }
</style>
