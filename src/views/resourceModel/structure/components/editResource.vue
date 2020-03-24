<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title">
    <el-form v-loading="loading" ref="form" :model="fieldData" :rules="rules" :validate-on-rule-change="false" element-loading-text="数据加载中..."
             class="in-dialog" label-width="115px" label-suffix="：">
      <el-form-item v-for="field in fieldList" :key="field.id" :prop="field.enName"
                    :label="field.cnName.length <= 13 ? field.cnName : field.cnName.substring(0, 13) + '...'"
                    :class="{'double-row-label' : field.cnName.length > 6}" class="in-input-row">

        <!-- 普通文本 -->
        <template v-if="field.fieldType === 'TEXT'">
          <el-input v-model.trim="fieldData[field.enName]" :disabled="action === 'edit' && field.enName === 'db_table_name'" :placeholder="'请输入' + field.cnName"/>
        </template>

        <!-- 整型数值 -->
        <template v-if="field.fieldType === 'NUMERICAL'">
          <el-input v-model.trim="fieldData[field.enName]" :placeholder="'请输入' + field.cnName" maxlength="11"/>
        </template>

        <!-- 单选框 -->
        <template v-if="field.fieldType === 'RADIO'">
          <el-radio-group v-model="fieldData[field.enName]">
            <el-radio v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.id">{{ item.desc }}</el-radio>
          </el-radio-group>
        </template>

        <!-- 复选框 -->
        <template v-if="field.fieldType === 'CHECK'">
          <el-checkbox-group v-model="fieldData[field.enName]">
            <el-checkbox v-for="item in JSON.parse(field.enumValue)" :title="item.desc" :label="item.id" :key="item.id">{{ item.desc }}</el-checkbox>
          </el-checkbox-group>
        </template>

        <!-- 下拉列表 -->
        <template v-if="field.fieldType === 'SELECT'">
          <el-select v-model="fieldData[field.enName]" placeholder="请选择">
            <el-option label="无" value=""/>
            <el-option v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.desc" :value="item.id"/>
          </el-select>
        </template>
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
  name: 'editResourceDialog',

  props: {
    action: {
      type: String,
      default: 'add'
    },
    resourceId: {
      type: Number,
      default: 0
    },
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      fieldList: [], // 字段列表
      fieldData: {}, // 资源数据
      rules: {
        'resource_name': [
          { required: true, message: '请输入数据表名', trigger: ['change', 'blur'] },
          { max: 50, message: '数据表名最长支持50个字符', trigger: ['blur', 'change']},
          { validator: this.checkCnName, trigger: 'blur'}
        ],
        'db_table_name': [
          { required: true, message: '请输入数据表英文名', trigger: ['change', 'blur'] },
          { max: 63, message: '数据表英文名最长支持63个字符', trigger: ['blur', 'change']},
          { validator: this.checkEnName, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },

  computed: {
    title () {
      let title
      switch (this.action) {
        case 'add':
          title = '新增数据表'
          break
        case 'edit':
          title = '编辑数据表'
          break
        case 'copy':
          title = '相似创建数据表'
      }
      return title
    }
  },

  mounted () {
    if (this.resourceId) {
      this.queryResourceById()
    } else {
      this.queryFieldList()
    }
  },

  methods: {
    /**
     * 请求字段列表
     */
    queryFieldList () {
      this.loading = true

      this.$api.queryResourceFields({ standardId: this.query.standardid }).then(data => {
        this.fieldList = data
        this.generateForm(data)

        this.$nextTick(() => {
          this.loading = false
          // document.querySelector('.in-dialog input').focus()
        })
      })
    },

    /**
     * 查询表详情
     */
    queryResourceById () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        categoryId: this.query.categoryid || 0,
        resourceId: this.resourceId
      }
      this.$api.queryResourceData(url).then(data => {
        this.fieldList = data.columns
        this.fieldData = data.data
        this.generateForm(this.fieldList, this.fieldData)

        if (this.action === 'copy') {
          this.fieldData.resource_name = '副本_' + this.fieldData.resource_name
          this.fieldData.db_table_name = 'copy_' + this.fieldData.db_table_name
        }

        this.loading = false
      })
    },

    /**
     * 生成新建和编辑表单
     * @param data 字段数据
     */
    generateForm (fieldList, data) {
      fieldList.map((item) => {
        let type = item.fieldType
        let value = data ? data[item.enName] : item.defaultValue
        if (type === 'RADIO' || type === 'SELECT') {
          this.$set(this.fieldData, item.enName, value ? parseInt(value) : '')
          this.setVerifyRule(item)
        } else if (type === 'CHECK') {
          this.$set(this.fieldData, item.enName, value ? value.split(',').map((id) => { return parseInt(id) }) : [])
          this.setVerifyRule(item)
        } else if (type === 'NUMERICAL') {
          this.$set(this.fieldData, item.enName, value + '')
          this.setVerifyRule(item, true, this.checkNumber)
        } else {
          this.$set(this.fieldData, item.enName, value)
          if (item.enName !== 'db_table_name' && item.enName !== 'resource_name') this.setVerifyRule(item, true, this.checkText)
        }
      })
    },

    /**
     * 后端校验输入有效性
     */
    verifyInput (name, value, callback) {
        let url = {
          standardId: this.query.standardid
        }
        let params = {
          paramName: name,
          paramValue: value,
          resourceId: this.action === 'edit' ? this.resourceId : ''
        }

      this.$api.verifyResourceInput(url, params).then((data) => {
        if (!data.available) {
          callback(new Error(data.msg))
        }
        callback()
      })
    },

    /**
     * 设置表单校验规则
     */
    setVerifyRule (field, isCustomiszed, validator) {
      if (isCustomiszed) {
        this.$set(this.rules, field.enName, [
          { required: field.isRequired, message: '请输入' + field.cnName, trigger: ['blur', 'change'] },
          { validator: validator, trigger: 'blur' }
        ])
      } else if (field.isRequired) {
        let fieldType = field.fieldType
        if (fieldType === 'CHECK') {
          this.$set(this.rules, field.enName, [{ type: 'array', required: true, message: '请至少选择一项' + field.cnName, trigger: ['blur', 'change'] }])
        } else if (fieldType === 'RADIO' || fieldType === 'SELECT') {
          this.$set(this.rules, field.enName, [{ required: true, message: '请选择' + field.cnName, trigger: ['blur', 'change'] }])
        }
      }
    },

    /**
     * 中文名校验规则
     */
    checkCnName (rule, value, callback) {
      this.verifyInput('resource_name', value, callback)
    },

    /**
     * 英文名校验规则
     */
    checkEnName (rule, value, callback) {
      let regPat = /^[_a-z\d]+$/
      let prefixPat = /^[_\d]+$/
      if (!regPat.test(value)) {
        callback(new Error('请输入小写英文字母、数字或下划线'))
      } else if (value.match(prefixPat) && value.match(prefixPat).index === 0) {
        callback(new Error('须以小写英文字母开头'))
      } else {
        this.verifyInput('db_table_name', value, callback)
      }
    },

    /**
     * 文本校验规则
     */
    checkText (rule, value, callback) {
      this.verifyInput(rule.field, value, callback)
    },

    /**
     * 数值校验规则
     */
    checkNumber (rule, value, callback) {
      let numberRex = /^[-]?\d+$/
      let prefixReg = /[-]?0+/
      if (value && !numberRex.test(value)) {
        callback(new Error('请输入数字值'))
      } else if (value !== '0' && value.match(prefixReg) && value.match(prefixReg).index === 0) {
        callback(new Error('请输入有效数字值'))
      } else if (numberRex.test(value) && value.length > 10) {
        callback(new Error('超出有效范围'))
      } else {
        this.verifyInput(rule.field, value, callback)
      }
    },

    /**
     * 新增数据表
     */
    addResource (url, params) {
      this.loading = true
      this.$api.addResource(url, params).then(data => {
        this.$trsModalSuccess('新增数据表成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑数据表
     */
    editResource (url, params) {
      this.loading = true
      this.$api.editResource(url, params).then(data => {
        this.$trsModalSuccess('编辑数据表成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 复制数据表
     */
    copyResource (url, params) {
      this.loading = true
      this.$api.copyResource(url, params).then(data => {
        this.$trsModalSuccess('相似创建数据表成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 组织数据
     */
    formData () {
      let formData = {}
      this.fieldList.map((item) => {
        let type = item.fieldType
        let name = item.enName
        let value = this.fieldData[item.enName]
        if (type === 'CHECK') {
          formData[name] = value.join(",")
        } else if (type === 'SELECT' || type === 'RADIO') {
          formData[name] = value.toString()
        } else {
          formData[name] = value
        }
      })
      return formData
    },

    /**
     * 确认提交
     */
    confirm () {
      this.$refs.form.validate()
      .then(() => {
        let url = {
          standardId: this.query.standardid
        }

        let params = {
          data: JSON.stringify(this.formData()),
          groupId: this.query.groupid
        }

        switch (this.action) {
          case 'edit':
            url.resourceId = this.resourceId
            this.editResource(url, params)
            break
          case 'copy':
            params.targetId = this.resourceId
            this.copyResource(url, params)
            break
          default:
            this.addResource(url, params)
            break
        }
      }, () => {
        let errInputs = document.querySelectorAll(".is-error")
        errInputs[0].querySelector('input').focus()
      })
    }
  }
}
</script>
