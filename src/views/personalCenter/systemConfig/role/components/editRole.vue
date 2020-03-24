<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="editItem.id ? '编辑角色' : '新增角色'">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." label-width="100px" label-suffix="：" class="in-dialog">

      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" autofocus placeholder="请输入角色名称"></el-input>
      </el-form-item>

      <el-form-item label="权限模板" prop="rightTemplateName" class="add-auth-template select-wrapper is-required">
        <el-select v-model="formData.rightTemplateName" class="select-item select-status" style="width:210px;" size="small" @change="changeSelect">
          <el-option v-for="item in data.options" :title="item.templateName" :key="item.id" :label="item.templateName" :value="item.id" class="auth-temp-option">
          </el-option>
        </el-select>
        <span v-if="formData.rightTemplateId" class="scan-pz" @click="scanTempAuth">查看具体配置</span>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import authTempDialog from './authTemp.vue'

export default {
  name: 'editRoleDialog',

  props: {
    editItem: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      data: {
        options: []
      },
      formData: JSON.parse(JSON.stringify(this.editItem)),
      rules: {
        roleName: [
          { required: true, message: '请输入角色名称', trigger: ['blur', 'change'] },
          { max: 40, message: "最大长度不能超过40个字符", trigger: ['blur', 'change'] },
          { validator: this.checkRoleName, trigger: ['blur', 'change'] }
        ]
      }
    }
  },

  mounted () {
    this.queryAuthTemplate()
  },

  methods: {
    /**
     * 请求模板列表
     */
    queryAuthTemplate() {
      this.$api.queryAuthTemplate().then(data => {
        this.data.options = data.data
      })
    },

    /**
     * 改变权限模板
     */
    changeSelect (val) {
      this.formData.rightTemplateId = val
    },

    /**
     * 查看权限模板
     */
    scanTempAuth () {
      this.$dialog(authTempDialog, {selectedId: this.formData.rightTemplateId})
    },

    /**
     * 角色重名校验
     */
    checkRoleName (rule, value, callback) {
      let params = {
        roleId: this.editItem.id ? this.editItem.id : '',
        roleName: value
      }
      this.$api.isCheckedRole(params).then(data => {
        if (!data.available) {
          callback(new Error(data.msg))
        }
        callback()
      })
    },

    /**
     * 新增角色
     */
    addRole (params) {
      this.loading = true
      this.$api.addRoles(params).then(data => {
        this.$trsModalSuccess('新增角色成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑角色
     */
    editRole (params) {
      this.loading = true
      params.roleId = this.editItem.id
      this.$api.editRole(params).then(data => {
        this.$trsModalSuccess('编辑角色成功！')
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
          if(this.formData.rightTemplateId) {
            if (this.editItem.id) {
              this.editRole(this.formData)
            } else {
              this.addRole(this.formData)
            }
          } else {
            this.$trsModalError('请选择权限模板')
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
