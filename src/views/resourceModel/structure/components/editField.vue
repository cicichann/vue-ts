<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="columnId ? '编辑字段' : '新增字段'">
    <el-form v-loading="loading" ref="form" :model="fieldData" :rules="rules" :validate-on-rule-change="false" element-loading-text="数据加载中..."
             class="in-dialog" label-width="100px" label-suffix="：">
      <template v-for="field in fieldList">
        <el-form-item v-if="isFieldShow(field)"
                      :key="field.id" :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                      :prop="field.enName" :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">

          <!-- 普通文本 -->
          <template v-if="field.fieldType === 'TEXT'">
            <el-input v-model.trim="fieldData[field.enName]" :disabled="(columnId && field.enName === 'en_name') || isDisabled(field)" :placeholder="'请输入' + field.cnName"/>
          </template>

          <!-- 整型数值 -->
          <template v-if="field.fieldType === 'NUMERICAL'">
            <template v-if="field.enName === 'data_length'">
              <el-input v-model.trim="fieldData.data_length" :disabled="isSystemField" :placeholder="'请输入' + field.cnName" maxlength="5"/>
            </template>
            <template v-else>
              <el-input v-model.trim="fieldData[field.enName]" :disabled="isSystemField" :placeholder="'请输入' + field.cnName" maxlength="11"/>
            </template>
          </template>

          <!-- 单选框 -->
          <template v-if="field.fieldType === 'RADIO'">
            <el-radio-group v-if="field.enumValue" v-model="fieldData[field.enName]">
              <el-radio v-for="item in JSON.parse(field.enumValue)" :disabled="isSystemField" :key="item.id" :label="item.id">{{ item.desc }}</el-radio>
            </el-radio-group>
          </template>

          <!-- 复选框 -->
          <template v-if="field.fieldType === 'CHECK'">
            <el-checkbox-group v-if="field.enumValue" v-model="fieldData[field.enName]">
              <el-checkbox v-for="item in JSON.parse(field.enumValue)" :disabled="isSystemField" :title="item.desc" :label="item.id" :key="item.id">{{ item.desc }}</el-checkbox>
            </el-checkbox-group>
          </template>

          <!-- 下拉列表 -->
          <template v-if="field.fieldType === 'SELECT'">
            <template v-if="field.enName !== 'field_type'">
              <el-select v-if="field.enumValue" v-model="fieldData[field.enName]" :disabled="isSystemField" :placeholder="'请选择' + field.cnName">
                <el-option label="无" value=""/>
                <el-option v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.desc" :value="item.id"/>
              </el-select>
            </template>
            <template v-else>
              <type-select ref="typeSelect" :query="query" :field-type-list="fieldTypeList" :field-data="fieldData" :column-id="columnId" @typeChange="handleTypeChange" />
            </template>
          </template>

        </el-form-item>
      </template>

      <el-form-item class="in-input-row">
        <el-tooltip :disabled="!isTitleDisabled" :content="promptText" effect="dark" popper-class="type-tooltip" placement="top-start">
          <el-checkbox v-if="status.isTitle" v-model="fieldData.is_title" :disabled="isTitleDisabled" :class="{'promptCursor': isTitleDisabled}"
                       @change="handleTitleChange">是否标题</el-checkbox>
        </el-tooltip>
        <el-checkbox v-if="status.isReadonly" v-model="fieldData.read_only">只读</el-checkbox>
        <el-checkbox v-if="status.isOverview" v-model="fieldData.is_overview" :disabled="fieldData.is_title || fieldData.is_search_field">概览显示</el-checkbox>
        <el-checkbox v-if="status.isSearchField" v-model="fieldData.is_search_field" :disabled="fieldData.is_title" @change="handleSearchChange">概览检索</el-checkbox>
        <el-checkbox v-if="status.isDetail" v-model="fieldData.detail_display" :disabled="fieldData.is_title">细览展示</el-checkbox>
        <el-tooltip :disabled="!status.isRequiredDisabled" :content="requiredPromptText" effect="dark" popper-class="type-tooltip" placement="top-start">
          <el-checkbox v-if="status.isRequired" v-model="fieldData.is_required" :disabled="fieldData.is_title || status.isRequiredDisabled" :class="{'promptCursor': status.isRequiredDisabled}">必填</el-checkbox>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import typeSelect from './typeSelect.vue'

export default {
  name: 'editFiledDialog',

  components: {
    typeSelect
  },

  props: {
    query: {
      type: Object,
      required: true
    },
    columnId: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      loading: false,
      fieldData: {}, // 字段数据
      fieldList: [], // 字段列表
      fieldTypeList: [], // 字段类型列表
      hasData: false, // 数据表有无数据
      status: {
        isTitle: true, // 是否展示标题表单
        isReadonly: true, // 是否展示只读表单
        isOverview: true, //是否展示概览显示表单
        isSearchField: true, //是否展示概览检索表单
        isDetail: true, // 是否展示细览展示表单
        isRequired: true, // 是否展示必填表单
        isRequiredDisabled: false // 是否禁用必填表单
      },
      rules: {
        cn_name: [
          { required: true, message: '请输入字段中文名', trigger: ['change', 'blur'] },
          { max: 50, message: '字段中文名最长支持50个字符', trigger: ['blur', 'change']},
          { validator: this.checkCnName, trigger: 'blur'}
        ],
        en_name: [
          { required: true, trigger: ['change', 'blur'], message: '请输入字段英文名' },
          { max: 63, message: '字段英文名最长支持63个字符', trigger: ['blur', 'change']},
          { trigger: 'blur', validator: this.checkEnName }
        ],
        data_length: [
          { required: true, trigger: ['change', 'blur'], message: '请输入数据长度' },
          { trigger: 'blur', validator: this.checkDataLength }
        ]
      }
    }
  },

  computed: {
    isSystemField () {
      return this.fieldData.is_sys_default === 1
    },

    isDisabled () {
      return function (field) {
        let enName = this.fieldData.en_name
        return (field.enName !== 'cn_name' && this.fieldData.is_sys_default) ||
               (enName === 'category' || enName === 'label' || enName === 'data_sources' || enName === 'source_code' || enName === 'save_time')
      }
    },

    isTitleDisabled () {
      return !!this.columnId && this.hasData && !this.fieldData.is_required
    },

    promptText () {
      return (!!this.columnId && this.hasData && !this.fieldData.is_required) ? '数据表已有数据，禁止将非必填字段设为标题' : ''
    },

    requiredPromptText () {
      return this.status.isRequiredDisabled ? '数据表已有数据，禁止将非必填字段设为必填' : ''
    }
  },

  watch: {
    'fieldData.field_type': function (curVal, oldVal) {
      const type = curVal
      const isSysDefault = this.fieldData.is_sys_default

      if (type !== 'TEXT') {
        this.fieldData.data_length = ''
      }

      // 是否展示各元字段复选框
      this.status.isTitle = (type === 'TEXT' || type === 'NUMERICAL' || type === 'DATE') && isSysDefault !== 1 && !this.fieldData.parent_id
      this.status.isReadonly = this.status.isTitle
      this.status.isOverview = !(type === 'APPENDIX' || type === 'ARRAY' || type === 'OBJECT' || type === 'RELATEDTABLE')
      this.status.isSearchField = type === 'TEXT' || type === 'RICH_TEXT' || type === 'TABLE'
      this.status.isDetail = !(type === 'APPENDIX' || type === 'ARRAY' || type === 'OBJECT')
      this.status.isRequired = !(type === 'ARRAY' || type === 'OBJECT' || isSysDefault === 1)

      // 切换字段类型重置各元字段复选框的值
      if (!this.status.isTitle) this.fieldData.is_title = false
      if (!this.status.isReadonly) this.fieldData.read_only = false
      if (!this.status.isOverview) this.fieldData.is_overview = false
      if (!this.status.isSearchField) this.fieldData.is_search_field = false

      if (type === 'RELATEDTABLE') this.fieldData.read_only = true
    }
  },

  mounted () {
    this.verifyRourceData()
    this.queryFieldTypeList().then(() => {
      if (this.columnId) {
        this.queryFieldById()
      } else {
        this.queryFieldList()
      }
    })
  },

  methods: {
    /**
     * 当前数据表有无数据
     */
    verifyRourceData () {
      let url = {
        standardId: this.query.standardid,
        resourceId: this.query.resourceid
      }
      this.$api.checkResourceData(url).then(data => {
        this.hasData = data
      })
    },

    /**
     * 请求字段类型数据
     */
    queryFieldTypeList () {
      return new Promise((resolve) => {
        this.loading = true
        this.$api.queryFieldType({ purpose: 2 }).then(data => {
          if (this.columnId) {
            data = data.concat([{ fieldType: 'TABLE', fieldTypeName: '分类法' }])
          }
          this.fieldTypeList = data
          this.loading = false
          resolve()
        })
      })
    },

    /**
     * 请求字段列表
     */
    queryFieldList () {
      this.loading = true
      this.$api.queryAttributeList({ standardId: this.query.standardid }).then(data => {
        this.fieldList = data.filter(field => { return field.enName !== 'encryption' })
        this.generateForm(data)

        this.$nextTick(() => {
          this.loading = false
          // document.querySelector('.in-dialog input').focus()
        })
      })
    },

    /**
     * 查询字段详情
     */
    queryFieldById () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        resourceId: this.query.resourceid,
        columnId: this.columnId
      }

      this.$api.queryResourceAttrData(url).then((data) => {
        this.fieldList = data.data.is_sys_default ? data.columns.filter((field) => { return field.isSysDefault }) : data.columns
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
        let name = item.enName
        let value = data ? data[name] : item.defaultValue
        switch (type) {
          case 'TEXT':
            this.$set(this.fieldData, name, value)
            !(name === 'default_value' || name === 'enum_value' || name === 'en_name' || name === 'cn_name') && this.setVerifyRule(item, true, this.checkText)
            break
          case 'NUMERICAL':
            this.$set(this.fieldData, name, value)
            name !== 'data_length' && this.setVerifyRule(item, true, this.checkNumber)
            break
          case 'CHECK':
            this.$set(this.fieldData, name, this.isMetaCheck(name) ? value === '1' : ((value && value.split(',').map((id) => { return parseInt(id) })) || []))
            !this.isMetaCheck(name) && this.setVerifyRule(item)
            break
          default:
            this.$set(this.fieldData, name, (name === 'field_type' && value) || (parseInt(value) || ''))
            this.setVerifyRule(item)
            break
        }

        if (!this.columnId) this.$set(this.fieldData, 'field_type', this.fieldTypeList[0].fieldType)
        if (!!this.columnId && this.hasData && !this.fieldData.is_required)  this.status.isRequiredDisabled = true
      })
    },

    /**
     * 特殊复选表单过滤
     */
    isMetaCheck (name) {
      let metaCheckArr = ['is_title', 'is_overview', 'is_search_field', 'detail_display', 'is_required', 'read_only']
      return metaCheckArr.indexOf(name) >= 0
    },

    /**
     * 是否文本字段
     */
    isText () {
      return this.fieldData.field_type === 'TEXT'
    },

    /**
     * 是否复合字段
     */
    isComposite () {
      let type = this.fieldData.field_type
      return type === 'ARRAY' || type === 'OBJECT'
    },

    /**
     * 是否展示字段
     */
    isFieldShow (field) {
      return !(this.isMetaCheck(field.enName) || field.enName === 'default_value' || field.enName === 'enum_value' ||
             (field.enName === 'data_length' && !this.isText()) ||
             (this.isComposite() && !(field.enName === 'cn_name' || field.enName === 'en_name' || field.enName === 'field_type')))
    },

    /**
     * 后端校验输入有效性
     */
    verifyInput (name, value, callback) {
      let url = {
        standardId: this.query.standardid,
        resourceId: this.query.resourceid
      }
      let params = {
        paramName: name,
        paramValue: value,
        attributeId: this.columnId || '',
        parentId: this.fieldData.parent_id || 0
      }
      this.$api.verifyAttrInput(url, params).then((data) => {
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
      let list = this.$refs.typeSelect[0].formData.compositeEnum
      let matchedList = list.filter((item) => { return item.cn_name === value })
      if (matchedList.length > 0) {
        callback(new Error('字段中文名不可与子字段重复'))
      } else {
        this.verifyInput('cn_name', value, callback)
      }
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
        let list = this.$refs.typeSelect[0].formData.compositeEnum
        let matchedList = list.filter((item) => { return item.en_name === value })
        if (matchedList.length > 0) {
          callback(new Error('字段英文名不可与子字段重复'))
        } else {
          this.verifyInput('en_name', value, callback)
        }
      }
    },

    /**
     * 数据长度校验规则
     */
    checkDataLength (rule, value, callback) {
      let regExp = /^\d+$/
      if (!regExp.test(value)) {
        callback(new Error('请输入数字值'))
      } else if (parseInt(value) < 1 || parseInt(value) > 21843) {
        callback(new Error('数据长度范围是1~21843'))
      } else if (parseInt(value) < this.fieldData.default_value.length) {
        callback(new Error('数据长度不能小于默认值长度'))
      }
      callback()
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
     * 字段类型改变
     */
    handleTypeChange (val) {
      this.$set(this.fieldData, 'field_type', val)
    },

    /**
     * 标题复选
     */
    handleTitleChange (val) {
      if (val) {
        this.fieldData.is_overview = true
        this.fieldData.detail_display = true
        this.fieldData.is_required = true
        if (this.status.isSearchField) this.fieldData.is_search_field = true
      }
    },

    /**
     * 概览检索复选
     */
    handleSearchChange (val) {
      if (val) this.fieldData.is_overview = true
    },

    /**
     * 新增字段
     */
    addField (url, params) {
      this.loading = true
      this.$api.addResourceAttrField(url, params).then(data => {
        this.$trsModalSuccess('新增字段成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑字段
     */
    modifyField (url, params) {
      this.loading = true
      this.$api.editResourceAttrField(url, params).then(data => {
        this.$trsModalSuccess('编辑字段成功！')
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
        let value = this.fieldData[name]
        if (type === 'CHECK') {
          formData[name] = !this.isMetaCheck(name) && value.join(",") || (value && "1" || "0")
        } else if (type === 'SELECT' || type === 'RADIO') {
          formData[name] = (name === 'field_type' && value) || value.toString()
        } else if (type === 'NUMERICAL' && name === 'data_length') {
          formData[name] = parseInt(value) || 0
        } else {
          formData[name] = value
        }
      })

      formData.default_value = this.$refs.typeSelect[0].getDefaultValue()
      formData.enum_value = this.$refs.typeSelect[0].isEnumerable() ? JSON.stringify(this.$refs.typeSelect[0].getEnumValue()) : ''
      if (this.$refs.typeSelect[0].isComposite()) {
        formData.fields = JSON.stringify(this.$refs.typeSelect[0].getCompositeValue())
      }
      return formData
    },

    /**
     * 确认提交
     */
    confirm () {
      this.$refs.form.validate()
        .then(() => {
          return this.$refs.typeSelect[0].validation()
        })
        .then(() => {
          let url = {
            standardId: this.query.standardid,
            resourceId: this.query.resourceid
          }
          let params = {
            data: JSON.stringify(this.formData())
          }

          if (this.columnId) {
            url.columnId = this.columnId
            this.modifyField(url, params)
          } else {
            this.addField(url, params)
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

<style lang="scss">
.promptCursor {
  .el-checkbox__input.is-disabled {
    .el-checkbox__inner, &+span.el-checkbox__label {
      cursor: help;
    }
  }
}
</style>
