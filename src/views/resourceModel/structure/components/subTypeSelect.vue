<template>
  <div class="sub-type-select">
    <!-- 字段类型 -->
    <el-select v-model="type" :disabled="!!fieldData.id" placeholder="请选择字段类型" @change="handleTypeChange">
      <el-option v-for="item in fieldTypeList" :key="item.fieldType" :label="item.fieldTypeName" :value="item.fieldType"/>
    </el-select>

    <!-- 普通文本 -->
    <el-form-item v-if="type === 'TEXT'" class="in-input-row in-sub-row" label="默认值" prop="defaultValue">
      <el-input v-model.trim="formData.defaultValue" placeholder="请输入默认值"/>
    </el-form-item>

    <!-- 整型数值 -->
    <el-form-item v-if="type === 'NUMERICAL'" :class="{'is-error': !status.isInputLegal}" class="in-input-row in-sub-row" label="默认值" prop="numericalDefault">
      <el-input v-model.trim="formData.numericalDefault" placeholder="请输入默认值" maxlength="11" @input="numberRestrict"/>
    </el-form-item>

    <!-- 单选框 -->
    <el-form-item v-if="type === 'RADIO'" class="in-input-row" prop="radioDefault">
      <el-radio-group v-model="formData.radioDefault">
        <ul class="in-item-setting in-radio-items">
          <li v-for="(item, index) in formData.radioEnum" :key="item.id" class="draggable">
            <i class="move-icon"/>
            <template v-if="isIe"><el-radio :label="item.id" :disabled="item.desc === ''"/></template>
            <template v-else><el-radio :label="item.id" :disabled="item.desc === ''" @click.native="toggleRadio($event, item.id)"/></template>
            <el-input v-model="item.desc" placeholder="请输入选项"/><i v-if="formData.radioEnum.length > 2" class="delete-icon" @click="removeItem(index, item)"/>
          </li>
          <li class="in-add-item dis-draggable" @click="addItem"><i class="add-icon"/><span>新增选项</span></li>
        </ul>
      </el-radio-group>
    </el-form-item>

    <!-- 复选框 -->
    <el-form-item v-if="type === 'CHECK'" class="in-input-row" label="" prop="checkDefault">
      <el-checkbox-group v-model="formData.checkDefault">
        <ul class="in-item-setting in-check-items">
          <li v-for="(item, index) in formData.checkEnum" :key="item.id" class="draggable">
            <i class="move-icon"/><el-checkbox :label="item.id" :disabled="item.desc === ''"/><el-input v-model="item.desc" placeholder="请输入选项"/>
            <i v-if="formData.checkEnum.length > 2" class="delete-icon" @click="removeItem(index, item)"/>
          </li>
          <li class="in-add-item dis-draggable" @click="addItem"><i class="add-icon"/><span>新增选项</span></li>
        </ul>
      </el-checkbox-group>
    </el-form-item>

    <!-- 下拉列表 -->
    <template v-if="type === 'SELECT'">
      <el-form-item class="in-input-row" label="" prop="" style="margin-top: 10px;">
        <ul class="in-item-setting in-select-items">
          <li v-for="(item, index) in formData.selectEnum" :key="item.id" class="draggable">
            <i class="move-icon"/><el-input v-model="item.desc" placeholder="请输入选项"/>
            <i v-if="formData.selectEnum.length > 2" class="delete-icon" @click="removeItem(index, item)"/>
          </li>
          <li class="in-add-item dis-draggable" @click="addItem"><i class="add-icon"/><span>新增选项</span></li>
        </ul>
      </el-form-item>
    </template>

    <!-- 错误提示 -->
    <el-form-item v-if="status.isErrorShow" class="in-input-row" prop="">
      <div class="el-form-item__error">{{ error.errorMsg }}</div>
    </el-form-item>

    <!-- 下拉列表默认值 -->
    <template v-if="type === 'SELECT'">
      <el-form-item class="in-input-row in-sub-row" label="默认值" prop="selectDefault">
        <el-select v-model="formData.selectDefault" placeholder="无">
          <el-option label="无" value=""/>
          <template v-for="item in formData.selectEnum">
            <el-option v-if="item.desc !== ''" :key="item.id" :label="item.desc" :value="item.id"/>
          </template>
        </el-select>
      </el-form-item>
    </template>

    <!-- 日期 -->
    <el-form-item v-if="type === 'DATE'" class="in-input-row in-sub-row" label="默认值" prop="dateValue">
      <el-radio-group v-model="formData.time" @change="handleDateChange">
        <el-radio label="empty">无</el-radio>
        <el-radio label="systemTime">系统时间</el-radio>
        <el-radio label="customTime">自定义
          <el-date-picker v-model="formData.dateCustomeValue" :default-value="formData.dateCustomeValue" :editable="false"
                          :class="{'is-visible': formData.time === 'customTime'}" format="yyyy-MM-dd" type="date" placeholder="选择日期" @focus="handleDateFocus"/>
        </el-radio>
      </el-radio-group>
    </el-form-item>
  </div>
</template>

<script>
import Sortable from 'sortablejs'

export default {
  name: 'typeSelect',

  components: {
    Sortable
  },

  props: {
    query: {
      type: Object,
      required: true
    },
    fieldTypeList: {
      type: Array,
      required: true
    },
    fieldData: {
      type: Object,
      required: true
    },
    index: {
      type: [Number, String],
      default: ''
    }
  },

  data () {
    return {
      type: '', // 选择的字段类型
      formData: {},
      status: {
        isInputLegal: true, //默认值是否合法
        isErrorShow: false
      },
      error: {
        errorMsg: '',
        countError: '选项个数不可小于2',
        requireError: '请输入选项内容',
        numberError: '请输入数字值',
        numberValidError: '请输入有效数字值',
        numberRangeError: '超出有效范围'
      },
      enumFieldArr: ['CHECK', 'RADIO', 'SELECT'] // 可枚举表单类型
    }
  },

  computed: {
    isIe () {
      return navigator.userAgent.indexOf("Trident") >= 0
    }
  },

  watch: {
    type (curVal) {
      this.status.isErrorShow = false

      if (this.isEnumerable()) {
        setTimeout(() => {
          this.rowDrop()
        }, 200)
      }
    }
  },

  mounted () {
    this.initData()
  },

  methods: {
    /**
     * 初始化数据
     */
    initData () {
      this.type = this.fieldData.field_type
      this.formData = {
        textDefault: '',
        numericalDefault: '',
        checkDefault: [],
        radioDefault: '',
        selectDefault: '',
        time: 'empty',
        dateDefault: '',
        dateCustomeValue: new Date(),
        checkEnum: [{ id: 0, desc: '' }, { id: 1, desc: '' }],
        radioEnum: [{ id: 0, desc: '' }, { id: 1, desc: '' }],
        selectEnum: [{ id: 0, desc: '' }, { id: 1, desc: '' }],
        compositeEnum: [],
      }

      if (this.index === '') return

      let type = this.type
      let enumValue = this.fieldData.enum_value
      let defaultValue = this.fieldData.default_value
      if (type === 'CHECK') {
        this.formData.checkDefault = defaultValue ? defaultValue.split(',').map((value) => { return parseInt(value) }) : []
      } else if (type === 'RADIO' || type === 'SELECT') {
        this.formData[type.toLowerCase() + 'Default'] = defaultValue ? parseInt(defaultValue) : ''
      } else if (type === 'DATE') {
        if (defaultValue === '') {
          this.formData.time = 'empty'
        } else if (defaultValue === '0') {
          this.formData.time = 'systemTime'
        } else {
          this.formData.time = 'customTime'
          this.formData.dateCustomeValue = new Date(parseInt(defaultValue))
        }
      } else {
        this.formData[type.toLowerCase() + 'Default'] = defaultValue
      }
      if (enumValue) this.formData[type.toLowerCase() + 'Enum'] = JSON.parse(enumValue)
    },

    /**
     * 选择字段类型
     */
    handleTypeChange (val) {
      this.$emit('typeChange', val)
    },

    /**
     * 数值限制规则
     */
    numberRestrict (val) {
      this.status.isErrorShow = false
      this.status.isInputLegal = true
      let numberRex = /^[-]?\d+$/
      let prefixReg = /[-]?0+/
      if (val && !numberRex.test(val)) {
        this.showError(this.error.numberError)
      } else if (val !== '0' && val.match(prefixReg) && val.match(prefixReg).index === 0) {
        this.showError(this.error.numberValidError)
      } else if (parseInt(val) > 2147483647 || parseInt(val) < -2147483647) {
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
     * 新增选项
     */
    addItem () {
      let enumValueIds = []
      let enumValueList = this.formData[this.type.toLowerCase() + 'Enum']
      enumValueList.map((item) => {
        enumValueIds.push(item.id)
      })
      enumValueList.push({ id: Math.max.apply(this, enumValueIds) + 1, desc: '' })
      this.isErrorShow = false
    },

    /**
     * 移除选项
     * @param index 当前选项索引值
     * @param item 当前选项
     */
    removeItem (index, item) {
      let enumValueList = this.formData[this.fieldData.field_type.toLowerCase() + 'Enum']

      enumValueList.splice(index, 1)
      let fieldType = this.fieldData.field_type
      if (fieldType === 'RADIO') {
        if (item.id === this.formData.radioDefault) this.formData.radioDefault = ''
      } else if (fieldType === 'SELECT') {
        if (item.id === this.formData.selectDefault) this.formData.selectDefault = ''
      } else if (fieldType === 'CHECK') {
        let checkDefault = this.formData.checkDefault
        let indexVal = checkDefault.indexOf(item.id)
        if (indexVal >= 0) checkDefault.splice(indexVal, 1)
      }
    },

    /**
     * 初始化拖拽
     */
    rowDrop () {
      const el = document.querySelector('.sub-type-select ul.in-item-setting')
      // 实例化，定义初始配置
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
          if (evt.newIndex !== evt.oldIndex) {
            let enumValueList = this.formData[this.fieldData.field_type.toLowerCase() + 'Enum']
            let item = enumValueList[evt.oldIndex]
            enumValueList.splice(evt.oldIndex, 1)
            enumValueList.splice(evt.newIndex, 0, item)
          }
        }
      })
    },

    /**
     * 单选框取消默认选中
     */
    toggleRadio (evt, id) {
      if (id === this.formData.radioDefault) this.formData.radioDefault = ''
    },

    /**
     * 日期类型切换
     */
    handleDateChange () {
      let dateVal = (this.formData.time === 'systemTime') ? '0' : this.formData.dateCustomeValue.getTime().toString()
      this.formData.dateDefault = (this.formData.time === 'empty') ? '' : dateVal
    },

    /**
     * 日历控件交互
     */
    handleDateFocus () {
      this.formData.time = 'customTime'
    },

    /**
     * 判断是否为枚举值表单元素
     */
    isEnumerable () {
      return this.enumFieldArr.indexOf(this.type) >= 0
    },

    /**
     * 获取枚举值
     */
    getEnumValue () {
      let enumValueArr = []
      let enumValueList = this.formData[this.type.toLowerCase() + 'Enum']
      let defaultValue = this.formData[this.type.toLowerCase() + 'Default']
      enumValueList.map((item, index, arr) => {
        if (item.desc !== '') {
          enumValueArr.push({
            id: index,
            desc: item.desc
          })

          if (parseInt(defaultValue) === item.id) {
            defaultValue = index
          } else if (defaultValue.length && defaultValue.indexOf(item.id) >= 0) {
            defaultValue.splice(defaultValue.indexOf(item.id), 1, index)
          }
        }
      })
      return enumValueArr
    },

    /**
     * 获取默认值
     */
    getDefaultValue () {
      const type = this.type
      if (type === 'NUMERICAL') {
        return this.formData.numericalDefault
      } else if (type === 'DATE') {
        return this.formData.dateDefault
      } else if (type === 'CHECK') {
        return this.formData.checkDefault.join(',')
      } else if (type === 'RADIO' || type === 'SELECT') {
        return this.formData[type.toLowerCase() + 'Default'].toString()
      } else return this.formData.textDefault
    },

    /**
     * 表单校验
     */
    validation () {
      return new Promise((resolve, reject) => {
        if (this.isEnumerable() && this.getEnumValue().length < 2) {
          this.error.errorMsg = this.error.requireError
          this.status.isErrorShow = true
          return reject()
        } else if (!this.status.isInputLegal) {
          return reject()
        }

        this.status.isErrorShow = false
        return resolve()
      })
    }
  }
}
</script>

<style lang="scss">
.in-sub-row {
  margin-left: -100px;
  margin-top: 10px !important;
}
</style>
