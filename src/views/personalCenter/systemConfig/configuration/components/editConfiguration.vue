<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="isModifyConfig ? '编辑配置项' : '新增配置项'" custom-class="edit-config">
    <el-form v-loading="loading" ref="form" :model="configuration" :rules="rules" element-loading-text="数据加载中..." label-width="100px" label-suffix="：" class="in-dialog">

      <el-form-item class="in-input-row" label="配置项名称" prop="name">
        <el-input v-model="configuration.name" :disabled="isModifyConfig" placeholder="请输入配置项名称"/>
      </el-form-item>

      <el-form-item class="in-input-row" label="内容" prop="value">
        <el-input v-model="configuration.value" :rows="3" type="textarea" placeholder="请输入配置项内容"/>
      </el-form-item>

      <el-form-item class="in-input-row" label="描述" prop="desc">
        <el-input v-model="configuration.desc" :rows="3" type="textarea" placeholder="请输入配置项描述"/>
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
  name: "editConfigDialog",

  props: {
    editItem: {
      type: Object,
      default: function() {
        return {};
      }
    }
  },

  data() {
    return {
      loading: false,
      configuration: JSON.parse(JSON.stringify(this.editItem)),
      rules: {
        name: [{required: true, trigger: ['blur', 'change'], validator: this.nameVerify}],
        value: [{required: true, trigger: ['blur', 'change'], message: '请输入配置项内容'}]
      }
    }
  },

  computed: {
    /**
     * 处于配置项编辑状态
     */
    isModifyConfig() {
      return !!this.editItem.id
    }
  },

  mounted() {
    if (this.configuration.id) {
      this.$api.findConfigById(this.$pick(this.configuration, ['id'])).then(data => {
        this.editItem = Object.assign({}, data)
        this.configuration = Object.assign({}, data)
      })
    }
  },

  methods:{
    /**
     * 点击确认按钮
     */
    confirm() {
      this.loading = true
      this.$refs.form.validate().then(() => {
        if (this.editItem.id) {
          this.editConfig()
        } else {
          this.addConfig()
        }
      }, () => {
        this.loading = false
      })
    },

    /**
     * 新增配置项
     */
    addConfig() {
      this.loading = true

      this.$api.addConfig(Object.assign({}, this.configuration)).then(() => {
        this.$close()
        this.$trsModalSuccess('新建配置项成功！')
      }, () => { this.loading = false })
    },

    /**
     * 编辑配置项
     */
    editConfig() {
      this.loading = true

      this.$api.editConfig(this.$pick(this.configuration, ['id']), Object.assign({}, this.configuration)).then(() => {
        this.$close()
        this.$trsModalSuccess('编辑配置项成功！')
      }, () => { this.loading = false })
    },

    /**
     * 配置项重名校验
     */
    nameVerify(rule, value, callback) {
      if(!value) {
        callback(new Error('请输入配置项名称'))
      } else {
        let params = {
          id: this.configuration.id,
          name: this.configuration.name
        }
        this.$api.verifyConfigName(params).then((data) => {
          if (data.available) {
            return callback()
          } else {
            return callback(new Error(data.msg))
          }
        })
      }
    }
  }
}
</script>

<style lang="scss">
.edit-config {
  .el-textarea__inner {
    width: 320px;
    resize: none;
    font-family: Arial, Helvetica, sans-serif;
  }

  .is-success .el-textarea__inner {
    border-color: #DCDFE6;

    &:focus {
      border-color: #409EFF;
    }
  }
}
</style>
