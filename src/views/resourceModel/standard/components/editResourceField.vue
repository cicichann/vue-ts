<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="isModify ? '编辑数据表属性字段' : '新增数据表属性字段'">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" element-loading-text="数据加载中..." class="in-dialog" label-width="100px" label-suffix="：">
      <el-form-item class="in-input-row" label="中文名称" prop="cnName">
        <el-input v-model.trim="formData.cnName" placeholder="请输入中文名称"/>
      </el-form-item>

      <el-form-item class="in-input-row" label="英文名称" prop="enName">
        <el-input v-model.trim="formData.enName" placeholder="请输入英文名称"/>
      </el-form-item>

      <el-form-item class="in-input-row" label="字段类型" prop="fieldType">
        <el-select v-model="formData.fieldType" :disabled="isModify" placeholder="请选择">
          <el-option v-for="item in fieldTypeList" :key="item.fieldType" :label="item.fieldTypeName" :value="item.fieldType"/>
        </el-select>
      </el-form-item>

      <!-- 普通文本 -->
      <el-form-item v-if="formData.fieldType === 'TEXT'" class="in-input-row" label="默认值" prop="textDefault">
        <el-input v-model.trim="formData.textDefault" :disabled="status.isDefaultDisabled" placeholder="请输入默认值"/>
      </el-form-item>

      <!-- 整型数值 -->
      <el-form-item v-if="formData.fieldType === 'NUMERICAL'" :class="{'is-error': !status.isInputLegal}" class="in-input-row" label="默认值" prop="numericalDefault">
        <el-input v-model.trim="formData.numericalDefault" :disabled="status.isDefaultDisabled" maxlength="11" placeholder="请输入默认值" @input="numberRestrict"/>
      </el-form-item>

      <!-- 单选框 -->
      <el-form-item v-if="formData.fieldType === 'RADIO'" class="in-input-row" prop="radio">
        <el-radio-group v-model="formData.radioDefault">
          <ul class="in-item-setting in-radio-items">
            <li v-for="(item, index) in formData.radioEnum" :key="item.id" class="draggable">
              <i v-if="!isModify" class="move-icon"/>
              <template v-if="isIe">
                <el-radio :label="item.id" :disabled="item.desc === ''"/>
              </template>
              <template v-else>
                <el-radio :label="item.id" :disabled="item.desc === ''" @click.native="toggleRadio($event, item.id)"/>
              </template>
              <el-input v-model="item.desc" placeholder="请输入选项"/>
              <i v-if="formData.radioEnum.length > 2 && !isModify" class="delete-icon" @click="removeItem(index, item)"/>
            </li>
            <li v-if="!isModify" class="in-add-item dis-draggable" @click="addItem">
              <i class="add-icon"/><span>新增选项</span>
            </li>
          </ul>
        </el-radio-group>
      </el-form-item>

      <!-- 复选框 -->
      <el-form-item v-if="formData.fieldType === 'CHECK'" class="in-input-row" prop="check">
        <el-checkbox-group v-model="formData.checkDefault">
          <ul class="in-item-setting in-check-items">
            <li v-for="(item, index) in formData.checkEnum" :key="item.id" class="draggable">
              <i v-if="!isModify" class="move-icon"/>
              <el-checkbox :label="item.id" :disabled="item.desc === ''"/>
              <el-input v-model="item.desc" placeholder="请输入选项"/>
              <i v-if="formData.checkEnum.length > 2 && !isModify" class="delete-icon" @click="removeItem(index, item)"/>
            </li>
            <li v-if="!isModify" class="in-add-item dis-draggable" @click="addItem">
              <i class="add-icon"/><span>新增选项</span>
            </li>
          </ul>
        </el-checkbox-group>
      </el-form-item>

      <!-- 下拉列表 -->
      <template v-if="formData.fieldType === 'SELECT'">
        <el-form-item class="in-input-row" prop="select">
          <ul class="in-item-setting in-select-items">
            <li v-for="(item, index) in formData.selectEnum" :key="item.id" class="draggable">
              <i v-if="!isModify" class="move-icon"/>
              <el-input v-model="item.desc" placeholder="请输入选项"/>
              <i v-if="formData.selectEnum.length > 2 && !isModify" class="delete-icon" @click="removeItem(index, item)"/>
            </li>
            <li v-if="!isModify" class="in-add-item dis-draggable" @click="addItem">
              <i class="add-icon"/><span>新增选项</span>
            </li>
          </ul>
        </el-form-item>
      </template>

      <!-- 错误提示 -->
      <el-form-item v-if="status.isErrorShow" class="in-input-row" label="" prop="">
        <div class="el-form-item__error">
          {{ error.errorMsg }}
        </div>
      </el-form-item>

      <!-- 下拉列表默认值 -->
      <template v-if="formData.fieldType === 'SELECT'">
        <el-form-item class="in-input-row" label="默认值" prop="selectDefault">
          <el-select v-model="formData.selectDefault" placeholder="无">
            <el-option label="无" value=""/>
            <template v-for="item in formData.selectEnum">
              <el-option v-if="item.desc !== ''" :key="item.id" :label="item.desc" :value="item.id"/>
            </template>
          </el-select>
        </el-form-item>
      </template>

      <el-form-item class="in-input-row">
        <el-checkbox v-model="formData.isRequired" :disabled="formData.isUnique">必填</el-checkbox>
        <el-checkbox v-if="status.isUnique" v-model="formData.isUnique" :disabled="status.isUniqueDisabled">唯一</el-checkbox>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Sortable from 'sortablejs'

export default {
  name: 'editResourceFieldDialog',

  components: {
    Sortable
  },

  props: {
    columnId: {
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
      loading: false,
      fieldTypeList: [], // 字段类型
      formData: {}, // 字段数据
      status: {
        isInputLegal: true, //默认值是否合法
        isErrorShow: false,
        hasData: false, //是否已有数据,
        isUniqueDisabled: false, //唯一是否可用
        isDefaultDisabled: false, //默认值是否禁用
        isUnique: true //默认展示唯一表单
      },
      error: {
        errorMsg: '',
        countError: '选项个数不可小于2',
        requireError: '请输入选项内容',
        numberError: '请输入数字值',
        numberValidError: '请输入有效数字值',
        numberRangeError: '超出有效范围'
      },
      rules: {
        cnName: [
          { required: true, message: '请输入中文名称', trigger: ['blur', 'change']},
          { validator: this.checkCnName, trigger: 'blur' }
        ],
        enName: [
          { required: true, message: '请输入英文名称', trigger: ['blur', 'change']},
          { validator: this.checkEnName, trigger: ['blur'] }
        ]
      }
    }
  },

  computed: {
    isIe() {
      return navigator.userAgent.indexOf("Trident") >= 0
    },

    isModify () {
      return !!this.columnId
    }
  },

  watch: {
    /**
     * 字段类型变化初始化拖拽
     */
    'formData.fieldType': function(curVal, oldVal) {
      if (this.columnId) return

      let type = curVal.toLowerCase()
      let enumVal = this.formData[type + 'Enum']
      let defaultVal = this.formData[type + 'Default']
      if (this.isEnumerable()) {
        if (!defaultVal) this.$set(this.formData, type + 'Default', type === 'check' ? [] : '')
        if (!enumVal) this.$set(this.formData, type + 'Enum', [{ id: 0, desc: ''}, { id: 1, desc: '' }])
        this.$nextTick(() => {
          this.rowDrop()
        })
      } else if (!defaultVal) {
        this.$set(this.formData, type + 'Default', '')
      }

      this.status.isErrorShow = false
      this.status.isUnique = (!this.isEnumerable())
    },

    /**
     * 必填和默认值表单联动
     */
    'formData.isRequired': function(val) {
      this.$refs.form.clearValidate()
      if(val && !this.formData.isUnique && this.status.hasData) {
        this.setDefaultRule()
      } else if(!val) {
        this.deleteDefaultRule()
      }
    },

    /**
     * 唯一和必填表单联动
     */
    'formData.isUnique': function(val) {
      if (val) {
        this.formData.isRequired = true
        this.status.isDefaultDisabled = true
        this.formData.textDefault = ''
        this.formData.numericalDefault = ''
        this.deleteDefaultRule()
      } else {
        this.status.isDefaultDisabled = false
        if (this.formData.isRequired && this.status.hasData) {
          this.setDefaultRule()
        } else {
          this.deleteDefaultRule()
        }
      }
    }
  },

  mounted() {
    this.queryFieldTypeList().then(() => {
      if (this.columnId) {
        this.findFieldById()
      } else {
        this.initData()
      }
    })
  },

  methods: {
    /**
     * 请求字段类型数据
     */
    queryFieldTypeList() {
      return new Promise((resolve) => {
        let params = {
          purpose: 1
        }

        this.$api.queryFieldType(params).then(data => {
          this.fieldTypeList = data
          resolve()
        })
      })
    },

    /**
     * 初始化数据
     */
    initData () {
      this.formData = {
        cnName: '',
        enName: '',
        fieldType: this.fieldTypeList[0].fieldType,
        isRequired: false,
        isUnique: false
      }
      this.status = Object.assign(this.status, {
        hasData: false,
        isUniqueDisabled: false,
        isDefaultDisabled: false
      })

      this.verifyResourceHasData().then(() => {
        if (this.status.hasData) {
          this.status.isUniqueDisabled = true
        }
      })

      this.$nextTick(() => {
        this.$refs.form.clearValidate()
        // document.querySelector('.in-dialog input').focus()
      })
    },

    /**
     * 查询字段详情
     */
    findFieldById () {
      this.loading = true
      this.status = Object.assign(this.status, {
        hasData: false,
        isUniqueDisabled: false,
        isDefaultDisabled: false
      })

      this.verifyResourceHasData().then(() => {
        let url = {
          standardId: this.query.standardid,
          columnId: this.columnId
        }

        this.$api.queryResourceFieldData(url).then(data => {
          this.formData = Object.assign(data, {
             isRequired: data.isRequired === 1,
             isUnique: data.isUnique === 1
          })

          let type = this.formData.fieldType.toLowerCase()
          let defaultValue = this.formData.defaultValue

          if (!this.isEnumerable()) {
            this.$set(this.formData, type + 'Default', defaultValue)
          } else {
            this.$set(this.formData, type + 'Enum', JSON.parse(data.enumValue))

            if (type === 'radio' || type === 'select') {
              this.$set(this.formData, type + 'Default', defaultValue ? parseInt(defaultValue) : '')
            } else {
              this.$set(this.formData, type + 'Default', defaultValue ? defaultValue.split(',').map((item) => { return parseInt(item) }) : [])
            }
          }

          //有数据且非唯一禁用唯一表单
          if(this.status.hasData && !this.formData.isUnique) {
            this.status.isUniqueDisabled = true
          }

          this.loading = false
        })
      })
    },

    /**
     * 后端校验是否有数据
     */
    verifyResourceHasData() {
      let url = {
        standardId: this.query.standardid
      }

      return new Promise((resolve, reject) => {
        this.$api.verifyResourceHasData(url).then(data => {
          this.status.hasData = data.exists
          resolve()
        })
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
        paramValue: value,
        columnId: this.columnId || ''
      }

      if (name === 'cnName') {
        this.$api.verifyResCname(url, params).then((data) => {
          if(!data.available) {
            callback(new Error(data.msg))
          }
          callback()
        })
      } else {
        this.$api.verifyResCname(url, params).then((data) => {
          if(!data.available) {
            callback(new Error(data.msg))
          }
          callback()
        })
      }
    },

    /**
     * 中文名称校验
     */
    checkCnName (rule, value, callback) {
      this.verifyInput(rule.field, value, callback)
    },

    /**
     * 英文名称校验
     */
    checkEnName (rule, value, callback) {
      let regPat = /^[_a-z\d]+$/
      let prefixPat = /^[_\d]+$/
      if(!regPat.test(value)) {
        callback(new Error('请输入小写英文字母、数字或下划线'))
      } else if(value.match(prefixPat) && value.match(prefixPat).index === 0) {
        callback(new Error('须以小写英文字母开头'))
      } else {
        this.verifyInput(rule.field, value, callback)
      }
    },

    /**
     * 数值校验规则
     */
    numberRestrict (val) {
      this.status.isErrorShow = false
      this.status.isInputLegal = true
      let numberReg = /^[-]?\d+$/
      let prefixReg = /[-]?0+/
      if(val && !numberReg.test(val)) {
        this.showError(this.error.numberError)
      } else if(val !== '0' && val.match(prefixReg) && val.match(prefixReg).index === 0) {
        this.showError(this.error.numberValidError)
      } else if(parseInt(val) > 2147483647 ||parseInt(val) < -2147483647 ) {
        this.showError(this.error.numberRangeError)
      }
    },

    /**
     * 展示数值默认值错误提示
     */
    showError (msg) {
      this.error.errorMsg = msg
      this.status.isErrorShow = true
      this.status.isInputLegal = false
    },

    /**
     * 设置默认值校验规则
     */
    setDefaultRule() {
      this.$set(this.rules, 'textDefault', [{ required: true, message: '请输入默认值', trigger: 'blur' }])
      this.$set(this.rules, 'numericalDefault', [{ required: true, message: '请输入默认值', trigger: 'blur' }])
    },

    /**
     * 去除默认值校验规则
     */
    deleteDefaultRule() {
      this.$set(this.rules, 'textDefault', [])
      this.$set(this.rules, 'numericalDefault', [])
    },

    /**
     * 新增选项
     */
    addItem () {
      let enumValueIds = []
      let enumValueList = this.formData[this.formData.fieldType.toLowerCase() + 'Enum']
      enumValueList.map((item) => {
        enumValueIds.push(item.id)
      })
      enumValueList.push({id: Math.max(...enumValueIds) + 1, desc: ''})
      this.status.isErrorShow = false
    },

    /**
     * 单选框取消默认选中
     */
    toggleRadio(evt, id) {
      if(id === this.formData.radioDefault) {
        this.formData.radioDefault = ''
      }
    },

    /**
     * 移除选项
     * @param index 当前选项索引值
     * @param item 当前选项
     */
    removeItem(index, item) {
      let enumValueList = this.formData[this.formData.fieldType.toLowerCase() + 'Enum']
      if (enumValueList.length <= 2) {
        this.error.errorMsg = this.error.countError
        this.status.isErrorShow = true
      } else {
        enumValueList.splice(index, 1)

        let fieldType = this.formData.fieldType
        if(fieldType === 'RADIO') {
          if(item.id === this.formData.radioDefault) this.formData.radioDefault = ''
        } else if(fieldType === 'SELECT') {
          if(item.id === this.formData.selectDefault) this.formData.selectDefault = ''
        } else if(fieldType === 'CHECK') {
          let checkDefault = this.formData.checkDefault
          let indexVal = checkDefault.indexOf(item.id)
          if(indexVal >= 0) checkDefault.splice(indexVal, 1)
        }
      }
    },

    /**
     * 初始化拖拽
     */
    rowDrop() {
      const el = document.querySelector('ul.in-item-setting')
      Sortable.create(el, {
        group: 'index',
        sort: true,
        delay: 0,
        disabled: false,
        store: null,
        draggable: '.draggable',
        filter: '.dis-draggable',
        handle: '.move-icon',
        forceFallback: true,
        onEnd: (evt) => {
          // 判断是否发生了相对位置变化
          if(evt.newIndex !== evt.oldIndex) {
            let enumValueList = this.formData[this.formData.fieldType.toLowerCase() + 'Enum']
            let item = enumValueList[evt.oldIndex]
            enumValueList.splice(evt.oldIndex, 1)
            enumValueList.splice(evt.newIndex, 0, item)
          }
        }
      })
    },

    /**
     * 判断是否需要获取枚举值
     */
    isEnumerable() {
      const type = this.formData.fieldType
      return type === 'CHECK' || type === 'RADIO' || type === 'SELECT'
    },

    /**
     * 获取枚举值
     */
    getEnumValue() {
      let enumValueArr = []
      let type = this.formData.fieldType.toLowerCase()
      let enumValueList = this.formData[type + 'Enum']
      let defaultValue = this.formData[type + 'Default']
      enumValueList.map((item, index, arr) => {
        if(item.desc !== '') {
          enumValueArr.push({
            id: index,
            desc: item.desc
          })

          if(defaultValue === item.id) {
            defaultValue = index
          } else if(defaultValue.length && defaultValue.indexOf(item.id) >= 0) {
            defaultValue.splice(defaultValue.indexOf(item.id), 1, index)
          }
        }
      })
      return enumValueArr
    },

    /**
     * 获取默认值
     */
    getDefaultValue() {
      const fieldTypeName = this.formData.fieldType.toUpperCase()
      if (fieldTypeName === 'NUMERICAL') {
        return this.formData.numericalDefault
      } else if (fieldTypeName === 'CHECK') {
        return this.formData.checkDefault.join(',')
      } else if (fieldTypeName === 'RADIO' || fieldTypeName === 'SELECT') {
        return this.formData[fieldTypeName.toLowerCase() + 'Default'].toString()
      } else {
        return this.formData.textDefault
      }
    },

    /**
     * 新增字段
     */
    addField (url, params) {
      this.loading = true
      this.$api.addResourceField(url, params).then(data => {
        this.$trsModalSuccess('新增数据表属性字段成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑字段
     */
    editField(url, params) {
      this.loading = true
      this.$api.editResourceField(url, params).then(data => {
        this.$trsModalSuccess('编辑数据表属性字段成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 提交表单
     */
    confirm () {
      this.$refs.form.validate()
      .then(() => {
        if (this.isEnumerable() && (this.getEnumValue().length < 2 || this.getEnumValue().length < this.formData[this.formData.fieldType.toLowerCase() + 'Enum'].length)) {
          this.error.errorMsg = this.error.requireError
          this.status.isErrorShow = true
          return false
        } else if (!this.status.isInputLegal) {
          return false
        }

        this.status.isErrorShow = false
        let url = {
          standardId: this.query.standardid,
        }
        let params = {
          cnName: this.formData.cnName,
          enName: this.formData.enName,
          fieldType: this.formData.fieldType,
          defaultValue: this.getDefaultValue(),
          enumValue: this.isEnumerable() ? JSON.stringify(this.getEnumValue()) : '',
          isRequired: this.formData.isRequired ? 1 : 0,
          isUnique: this.formData.isUnique ? 1 : 0
        }

        if (this.columnId) {
          url.columnId = this.columnId
          this.editField(url, params)
        } else {
          this.addField(url, params)
        }
        return true
      })
    }
  }
}
</script>
