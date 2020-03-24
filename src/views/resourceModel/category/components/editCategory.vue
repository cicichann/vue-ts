<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title">
    <el-form v-loading="loading" ref="form" :model="fieldData" :rules="rules" :validate-on-rule-change="false" element-loading-text="数据加载中..."
             class="in-dialog" label-width="100px" label-suffix="：">
      <el-form-item v-for="field in fieldList" :key="field.id" :prop="field.enName"
                    :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                    :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">

        <!-- 普通文本 -->
        <template v-if="field.fieldType === 'TEXT'">
          <el-input v-model.trim="fieldData[field.enName]" :placeholder="'请输入' + field.cnName" />
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
  name: 'editCategoryDialog',

  props: {
    action: {
      type: String,
      default: 'add'
    },
    categoryId: {
      type: Number | String,
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
      fieldData: {}, // 分类数据
      rules: {
        'category_name': [
          { required: true, message: '请输入分类名', trigger: ['blur', 'change']},
          { max: 50, message: '分类名最长支持50个字符', trigger: ['blur', 'change']},
          { validator: this.checkCnName, trigger: 'blur'}
        ],
        'category_code': [
          { max: 2, message: '分类编码最长支持2个字符', trigger: ['blur', 'change'] },
          { validator: this.checkNumber, trigger: 'blur'}
        ]
      },
      loading: false
    }
  },

  computed: {
    title () {
      switch (this.action) {
        case 'add':
          return '新增分类'
        case 'edit':
          return '编辑分类'
        case 'merge':
          return '合并分类'
      }
    }
  },

  mounted () {
    if (this.action === 'edit') {
      this.findCategoryById()
    } else {
      this.queryFields()
    }
  },

  methods: {
    /**
     * 初始化数据
     */
    queryFields () {
      this.loading = true

      this.$api.queryCategoryFields({ standardId: this.query.standardid }).then(data => {
        this.fieldList = data
        this.generateForm(data)

        this.$nextTick(() => {
          this.loading = false
          // if (document.querySelector('.in-dialog input')) document.querySelector('.in-dialog input').focus()
        })
      })
    },

    /**
     * 填充编辑数据
     */
    findCategoryById () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        categoryId: this.categoryId
      }
      this.$api.queryCategoryData(url).then(data => {
        this.fieldList = data.columns
        this.fieldData = data.data
        this.generateForm(this.fieldList, this.fieldData)

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
          this.$set(this.fieldData, item.enName, value)
          this.setVerifyRule(item, true, this.checkNumber)
        } else {
          this.$set(this.fieldData, item.enName, value)
          if (item.enName !== 'category_name' && item.enName !== 'category_code') this.setVerifyRule(item, true, this.checkText)
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
        categoryIds: this.action === 'add' ? '' : this.categoryId,
        parentId: this.query.categoryid
      }
      this.$api.verifyCateInput(url, params).then((data) => {
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
      this.verifyInput('category_name', value, callback)
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
      let regExp = /^[0-9]+$/
      if (value && !regExp.test(value)) {
        callback(new Error('请输入数字值'))
      } else {
        this.verifyInput(rule.field, value, callback)
      }
    },

    /**
     * 新增分类
     */
    addCategory (url, params) {
      this.loading = true
      this.$api.addCategory(url, params).then(data => {
        this.$trsModalSuccess('新增分类成功！')
        this.$close(data)
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑分类
     */
    editCategory (url, params) {
      this.loading = true
      this.$api.editCategory(url, params).then(data => {
        this.$trsModalSuccess('编辑分类成功！')
        this.$close(this.categoryId)
      }, () => {
        this.loading = false
      })
    },

    /**
     * 合并分类
     */
    mergeCategory (url, params) {
      this.loading = true
      this.$api.mergeCategory(url, params).then(data => {
        this.$trsModalSuccess('合并分类成功！')
        this.$close(this.query.categoryid)
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
          data: JSON.stringify(this.formData())
        }

        if (this.action === 'edit') {
          url.categoryId = this.categoryId
          this.editCategory(url, params)
        } else if (this.action === 'add') {
          params.parentCategoryId = this.query.categoryid || 0
          this.addCategory(url, params)
        } else {
          params.categoryIds = this.categoryId
          params.parentCategoryId = this.query.categoryid || 0
          this.mergeCategory(url, params)
        }
      }, () => {
        let errInputs = document.querySelectorAll(".is-error")
        errInputs[0].querySelector('input').focus()
      })
    }
  }
}

</script>
