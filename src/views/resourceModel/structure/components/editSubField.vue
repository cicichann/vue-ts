<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="isModify() ? '编辑子字段' : '新增子字段'" custom-class="edit-sub-field">
    <el-form v-loading="loading" ref="form" :model="fieldData" :rules="rules" :validate-on-rule-change="false" element-loading-text="数据加载中..."
             class="in-dialog" label-width="100px" label-suffix="：">
      <template v-for="field in fieldList">
        <el-form-item
          v-if="!(isMetaCheck(field.enName) || field.enName === 'default_value' || field.enName === 'enum_value' || (field.enName === 'data_length' && !isText))"
          :key="field.id" :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
          :prop="field.enName" :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">

          <!-- 普通文本 -->
          <template v-if="field.fieldType === 'TEXT'">
            <el-input v-model.trim="fieldData[field.enName]" :disabled="(!!editItem.id && field.enName === 'en_name') ||
                      ((fieldData.en_name === 'category' || fieldData.en_name === 'label' || fieldData.en_name === 'data_sources'))"
                      :placeholder="'请输入' + field.cnName"/>
          </template>

          <!-- 整型数值 -->
          <template v-if="field.fieldType === 'NUMERICAL'">
            <template v-if="field.enName === 'data_length'">
              <el-input v-model.trim="fieldData.data_length" :placeholder="'请输入' + field.cnName" maxlength="5"/>
            </template>
            <template v-else>
              <el-input v-model.trim="fieldData[field.enName]" :placeholder="'请输入' + field.cnName" maxlength="11"/>
            </template>
          </template>

          <!-- 单选框 -->
          <template v-if="field.fieldType === 'RADIO'">
            <el-radio-group v-if="field.enumValue" v-model="fieldData[field.enName]">
              <el-radio v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.id">{{ item.desc }}</el-radio>
            </el-radio-group>
          </template>

          <!-- 复选框 -->
          <template v-if="field.fieldType === 'CHECK'">
            <el-checkbox-group v-if="field.enumValue" v-model="fieldData[field.enName]">
              <el-checkbox v-for="item in JSON.parse(field.enumValue)" :title="item.desc" :label="item.id" :key="item.id">{{ item.desc }}</el-checkbox>
            </el-checkbox-group>
          </template>

          <!-- 下拉列表 -->
          <template v-if="field.fieldType === 'SELECT'">
            <template v-if="field.enName !== 'field_type'">
              <el-select v-if="field.enumValue" v-model="fieldData[field.enName]" :placeholder="'请选择' + field.cnName">
                <el-option label="无" value=""/>
                <el-option v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.desc" :value="item.id"/>
              </el-select>
            </template>
            <template v-else>
              <type-select ref="typeSelect" :query="query" :field-type-list="fieldTypeList" :field-data="fieldData" :index="index" @typeChange="handleTypeChange" />
            </template>
          </template>

        </el-form-item>
      </template>

      <el-form-item class="in-input-row">
        <el-checkbox v-if="status.isReadonly" v-model="fieldData.read_only">只读</el-checkbox>
        <el-checkbox v-if="status.isOverview" v-model="fieldData.is_overview" :disabled="fieldData.is_title || fieldData.is_search_field">概览显示</el-checkbox>
        <el-checkbox v-if="status.isSearchField" v-model="fieldData.is_search_field" :disabled="fieldData.is_title" @change="handleSearchChange">概览检索</el-checkbox>
        <el-checkbox v-if="status.isDetail" v-model="fieldData.detail_display" :disabled="fieldData.is_title">细览展示</el-checkbox>
        <el-tooltip :disabled="!status.isRequiredDisabled" :content="requiredPromptText" effect="dark" popper-class="type-tooltip" placement="top-start">
          <el-checkbox v-if="(status.isRequired && !editItem.cn_name) || status.isTitle" v-model="fieldData.is_required" :disabled="fieldData.is_title || status.isRequiredDisabled"
                       :class="{'promptCursor': status.isRequiredDisabled}">必填</el-checkbox>
        </el-tooltip>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import typeSelect from './subTypeSelect.vue'

export default {
  name: 'editSubFiledDialog',

  components: {
    typeSelect
  },

  props: {
    query: {
      type: Object,
      required: true
    },
    parentFieldData: {
      type: Object,
      required: true
    },
    compositeList: {
      type: Array,
      required: true
    },
    editItem: {
      type: Object,
      default: () => { }
    },
    index: {
      type: [Number, String],
      default: ''
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
          { required: true, trigger: ['change', 'blur'], message: '请输入字段中文名' },
          { trigger: 'blur', validator: this.checkCnName }
        ],
        en_name: [
          { required: true, trigger: ['change', 'blur'], message: '请输入字段英文名' },
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
    isText () {
      return this.fieldData.field_type === 'TEXT'
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
      this.status.isTitle = (type === 'TEXT' || type === 'NUMERICAL' || type === 'DATE' || type === 'RICH_TEXT') && isSysDefault !== 1
      this.status.isReadonly = this.status.isTitle
      this.status.isOverview = !(type === 'APPENDIX' || type === 'ARRAY' || type === 'OBJECT')
      this.status.isSearchField = (type === 'TEXT' || type === 'RICH_TEXT') && this.fieldData.en_name !== 'label'
      this.status.isDetail = this.status.isOverview
      this.status.isRequired = !(type === 'ARRAY' || type === 'OBJECT')

      // 切换字段类型重置各元字段复选框的值
      if (!this.status.isTitle) this.fieldData.is_title = false
      if (!this.status.isReadonly) this.fieldData.read_only = false
      if (!this.status.isOverview) this.fieldData.is_overview = false
      if (!this.status.isSearchField) this.fieldData.is_search_field = false
    }
  },

  mounted () {
    this.verifyRourceData()
    this.queryFieldTypeList().then(() => {
      this.queryFieldList()
      this.setBackground()
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
        this.$api.queryFieldType({ purpose: 4 }).then(data => {
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
          document.querySelector('.in-dialog input').focus()
        })
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
     * 是否编辑状态
     */
    isModify () {
      return !!this.editItem.cn_name
    },

    /**
     * 生成新建和编辑表单
     */
    generateForm (filedList) {
      this.isModify() && (this.fieldData = JSON.parse(JSON.stringify(this.editItem)))

      filedList.map((item) => {
        let type = item.fieldType
        let name = item.enName
        let value = this.fieldData[name] || item.defaultValue
        switch (type) {
          case 'TEXT':
            this.$set(this.fieldData, name, value)
            !(name === 'default_value' || name === 'enum_value' || name === 'cn_name' || name === 'en_name') && this.setVerifyRule(item, true, this.checkText)
            break
          case 'CHECK':
            this.$set(this.fieldData, name, this.isMetaCheck(name) ? value === '1' : ((value && value.split(',').map((id) => { return parseInt(id) })) || []))
            !this.isMetaCheck(name) && this.setVerifyRule(item)
            break
          case 'NUMERICAL':
            this.$set(this.fieldData, name, value)
            name !== 'data_length' && this.setVerifyRule(item, true, this.checkNumber)
            break
          default:
            this.$set(this.fieldData, name, (name === 'field_type') && value || (parseInt(value) || ''))
            this.setVerifyRule(item)
            break
        }

        !this.isModify() && this.$set(this.fieldData, 'field_type', this.fieldTypeList[0].fieldType)
        if (this.isModify() && this.hasData && !this.fieldData.is_required)  this.status.isRequiredDisabled = true
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
        attributeId: this.editItem.id || ''
      }
      this.$api.verifyAttrInput(url, params).then((data) => {
        if (!data.available) {
          callback(new Error(data.msg))
        }
        callback()
      })
    },

    /**
     * 中文名校验规则
     */
    checkCnName (rule, value, callback) {
      let matchedList = this.compositeList.filter((item) => { return item.cn_name === value })
      if (this.parentFieldData.cn_name === value) {
        callback(new Error('字段中文名不可与父字段重复'))
      } else if ((this.editItem.cn_name && matchedList.length > 1) || (!this.editItem.cn_name && matchedList.length > 0)) {
        callback(new Error('字段中文名不可与同级子字段重复'))
      }
      callback()
    },

    /**
     * 英文名校验规则
     */
    checkEnName (rule, value, callback) {
      let regPat = /^[_a-z\d]+$/
      let prefixPat = /^[_\d]+$/
      let matchedList = this.compositeList.filter((item) => { return item.en_name === value })
      if (!regPat.test(value)) {
        callback(new Error('请输入小写英文字母、数字或下划线'))
      } else if (value.match(prefixPat) && value.match(prefixPat).index === 0) {
        callback(new Error('须以小写英文字母开头'))
      } else if (this.parentFieldData.en_name === value) {
        callback(new Error('字段英文名不可与父字段重复'))
      } else if ((this.editItem.en_name && matchedList.length > 1) || (!this.editItem.en_name && matchedList.length > 0)) {
        callback(new Error('字段英文名不可与同级子字段重复'))
      }
      callback()
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
     * 概览检索复选
     */
    handleSearchChange (val) {
      if (val) this.fieldData.is_overview = true
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
          formData[name] =  (!this.isMetaCheck(name) && value.join(',')) || ((value && "1") || "0")
        } else if (type === 'SELECT' || type === 'RADIO') {
          formData[name] = ((name === 'field_type') && value) || value.toString()
        } else if (type === 'NUMERICAL' && name === 'data_length') {
          formData[name] = parseInt(value) || 0
        } else {
          formData[name] = value
        }
      })

      formData.default_value = this.$refs.typeSelect[0].getDefaultValue()
      formData.enum_value = this.$refs.typeSelect[0].isEnumerable() ? JSON.stringify(this.$refs.typeSelect[0].getEnumValue()) : ''
      if (this.editItem.id) formData.id = this.editItem.id
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
          let params = {
            item: this.formData(),
            index: this.index
          }
          this.$close(params)
        }, () => {
          let errInputs = document.querySelectorAll(".is-error")
          errInputs[0].querySelector('input').focus()
        })
    },

    /**
     * 添加背景蒙层
     */
    setBackground () {
      document.querySelector('.edit-sub-field').parentNode.style.backgroundColor = 'rgba(0, 0, 0, .5)'
    }
  }
}
</script>
