<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="拆分分类" custom-class="split-category">
    <el-form v-loading="loading" ref="form" :model="form" :rules="rules" :validate-on-rule-change="false" element-loading-text="数据加载中..."
             class="in-dialog" label-width="100px" label-suffix="：">
      <p class="in-annotation">正拆分“<span class="overflow">{{ editItem.category_name }}</span>”分类，拆分后请及时确认并调整分类映射</p>

      <div v-for="(item, index) in form.dataList" :key="index" class="in-fieldset">
        <template v-for="field in fieldList">
          <!-- 分类名称 -->
          <el-form-item v-if="field.enName === 'category_name'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.category_name'"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ required: true, message: '请输入分类名', trigger: ['blur', 'change']},
                                 { max: 50, message: '分类名最长支持50个字符', trigger: ['blur', 'change']},
                                 { validator: checkCnName, trigger: 'blur'}]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-input v-model.trim="item[field.enName]" :placeholder="'请输入' + field.cnName" />
          </el-form-item>

          <!-- 普通文本 -->
          <el-form-item v-if="field.fieldType === 'TEXT' && field.enName !== 'category_name'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.' + field.enName"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ required: field.isRequired, message: '请输入' + field.cnName, trigger: ['blur', 'change'] },
                                 { validator: checkText, trigger: 'blur' }]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-input v-model.trim="item[field.enName]" :placeholder="'请输入' + field.cnName" />
          </el-form-item>

          <!-- 整型数值 -->
          <el-form-item v-if="field.fieldType === 'NUMERICAL'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.' + field.enName"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ required: field.isRequired, message: '请输入' + field.cnName, trigger: ['blur', 'change'] },
                                 { validator: checkNumber, trigger: 'blur' }]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-input v-model.trim="item[field.enName]" :placeholder="'请输入' + field.cnName" maxlength="11"/>
          </el-form-item>

          <!-- 单选框 -->
          <el-form-item v-if="field.fieldType === 'RADIO'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.' + field.enName"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ required: field.isRequired === 1, message: '请选择' + field.cnName, trigger: ['blur', 'change'] }]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-radio-group v-model="item[field.enName]">
              <el-radio v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.id">{{ item.desc }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 复选框 -->
          <el-form-item v-if="field.fieldType === 'CHECK'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.' + field.enName"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ type: 'array', required: field.isRequired === 1, message: '请至少选择一项' + field.cnName, trigger: ['blur', 'change'] }]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-checkbox-group v-model="item[field.enName]">
              <el-checkbox v-for="item in JSON.parse(field.enumValue)" :title="item.desc" :label="item.id" :key="item.id">{{ item.desc }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- 下拉列表 -->
          <el-form-item v-if="field.fieldType === 'SELECT'" :key="field.id + '_' + index" :prop="'dataList.' + index + '.' + field.enName"
                        :label="field.cnName.length <= 11 ? field.cnName : field.cnName.substring(0, 11) + '...'"
                        :rules="[{ required: field.isRequired === 1, message: '请选择' + field.cnName, trigger: ['blur', 'change'] }]"
                        :class="{'double-row-label' : field.cnName.length > 5}" class="in-input-row">
            <el-select v-model="item[field.enName]" placeholder="请选择">
              <el-option label="无" value=""/>
              <el-option v-for="item in JSON.parse(field.enumValue)" :key="item.id" :label="item.desc" :value="item.id"/>
            </el-select>
          </el-form-item>
        </template>

        <!-- 保留数据和分类 -->
        <el-form-item class="in-input-row in-customized-row">
          <el-checkbox v-model="item.isRetain" :disabled="item.isRetain && !status.isRetainable" @change="changeRetain">保留分类数据</el-checkbox>
          <el-checkbox v-if="editItem.hasChildren" v-model="item.isInherit" :disabled="item.isInherit && !status.isInheritable" @change="changeInherit">继承子分类(含数据)</el-checkbox>
        </el-form-item>
        <i v-if="form.dataList.length > 2" class="remove-icon" @click="removeItem(index, item)"/>
      </div>

      <div v-if="form.dataList.length < 20" class="in-add-button" @click="addItem"><i class="add-icon"></i>新增分类</div>
    </el-form>

    <span slot="footer">
      <p v-if="status.isRetainErrorShow && status.isInheritErrorShow && editItem.hasChildren" class="err-msg">保留分类数据、继承子分类（含数据）均不可无选中项</p>
      <p v-else-if="status.isInheritErrorShow && editItem.hasChildren" class="err-msg">继承子分类（含数据）不可无选中项</p>
      <p v-else-if="status.isRetainErrorShow" class="err-msg">保留分类数据不可无选中项</p>
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'splitCategoryDialog',

  props: {
    editItem: {
      type: Object,
      required: true
    },
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      fieldList: [], // 字段列表
      fieldData: {},
      form: {
        dataList: []
      },
      status: {
        isRetainable: false, // 保留分类数据可用性
        isInheritable: false, // 继承子分类可用性
        isRetainErrorShow: false, // 保留分类数据错误提示
        isInheritErrorShow: false // 继承子分类错误提示
      },
      rules: {}
    }
  },

  mounted () {
    this.findCategoryById()
  },

  methods: {
    /**
     * 请求被拆分分类数据
     */
    findCategoryById () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        categoryId: this.editItem.id
      }
      this.$api.queryCategoryData(url).then(data => {
        this.fieldData = this.generateForm(data.columns)
        let firstCate = this.generateForm(data.columns, data.data)
        this.editItem.hasChildren ? Object.assign(firstCate, { isRetain: true, isInherit: true }) : Object.assign(firstCate, { isRetain: true })

        this.fieldList = data.columns
        this.form.dataList.push(firstCate)
        this.form.dataList.push(JSON.parse(JSON.stringify(this.fieldData)))

        this.loading = false
      })
    },

    /**
     * 生成表单
     * @param data 单个分类数据
     */
    generateForm (fieldList, data) {
      let obj = {}
      fieldList.map((item) => {
        let type = item.fieldType
        let value = data ? data[item.enName] : item.defaultValue
        if (type === 'RADIO' || type === 'SELECT') {
          this.$set(obj, item.enName, value ? parseInt(value) : '')
        } else if (type === 'CHECK') {
          this.$set(obj, item.enName, value ? value.split(',').map((id) => { return parseInt(id) }) : [])
        } else if (type === 'NUMERICAL') {
          this.$set(obj, item.enName, value)
        } else {
          this.$set(obj, item.enName, value)
        }
      })
      if (this.editItem.hasChildren) {
        Object.assign(obj, { isRetain: false, isInherit: false })
      }
      return obj
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
        categoryIds: this.editItem.id,
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
     * 中文名校验规则
     */
    checkCnName (rule, value, callback) {
      let matchedList = this.form.dataList.filter((item) => { return item.category_name === value })
      if (matchedList.length > 1) {
        callback(new Error(`字段中文名[${value}]重复`))
      } else {
        this.verifyInput('category_name', value, callback)
      }
    },

    /**
     * 文本校验规则
     */
    checkText (rule, value, callback) {
      this.verifyInput(rule.field.split('.')[2], value, callback)
    },

    /**
     * 数值校验规则
     */
    checkNumber (rule, value, callback) {
      let regExp = /^[0-9]+$/
      if (value && !regExp.test(value)) {
        callback(new Error('请输入数字值'))
      } else {
        this.verifyInput(rule.field.split('.')[2], value, callback)
      }
    },

    /**
     * 保留分类数据
     */
    changeRetain () {
      this.status.isRetainable = this.form.dataList.filter(item => { return item.isRetain }).length > 1
    },

    /**
     * 继承子分类及数据
     */
    changeInherit () {
      this.status.isInheritable = this.form.dataList.filter(item => { return item.isInherit }).length > 1
    },

    /**
     * 新增分类
     */
    addItem () {
      let ele = document.querySelector('.el-dialog__body')
      this.form.dataList.push(JSON.parse(JSON.stringify(this.fieldData)))
      this.$nextTick(() => {
        let distance = ele.scrollHeight - ele.scrollTop - 360
        let step = distance / 20
        let interval = setInterval(() => {
          if (ele.scrollTop >= ele.scrollHeight - 360) {
            clearInterval(interval)
          } else {
            ele.scrollTop = ele.scrollTop + step
          }
        }, 10)
      })
    },

    /**
     * 移除分类
     * @param index 当前分类索引值
     * @param item 当前分类
     */
    removeItem (index, item) {
      this.form.dataList.splice(this.form.dataList.indexOf(item), 1)
    },

    /**
     * 组织数据
     */
    formData () {
      let formData = this.form.dataList.map(data => {
        let cateInfo = {}
        this.fieldList.map((item) => {
          let type = item.fieldType
          let name = item.enName
          let value = data[item.enName]
          if (type === 'CHECK') {
            cateInfo[name] = value.join(",")
          } else if (type === 'SELECT' || type === 'RADIO') {
            cateInfo[name] = value.toString()
          } else {
            cateInfo[name] = value
          }
        })

        cateInfo.isRetain = data.isRetain ? 1 : 0
        cateInfo.isInherit = data.isInherit ? 1 : 0
        return cateInfo
      })
      return formData
    },

    /**
     * 确认提交
     */
    confirm () {
      this.$refs.form.validate()
        .then(() => {
          this.status.isRetainErrorShow = this.form.dataList.filter(item => { return item.isRetain }).length === 0
          this.status.isInheritErrorShow = this.form.dataList.filter(item => { return item.isInherit }).length === 0
          if (this.status.isRetainErrorShow || (this.status.isInheritErrorShow && this.editItem.hasChildren)) return false

          this.loading = true
          let url = {
            standardId: this.query.standardid,
            categoryId: this.editItem.id
          }
          let params = {
            data: JSON.stringify(this.formData()),
            parentCategoryId: this.query.categoryid
          }

          this.$api.splitCategory(url, params).then(() => {
            this.$trsModalSuccess('拆分分类成功！')
            this.$close(this.query.categoryid)
          }, () => {
            this.loading = false
          })
        }, () => {
          this.$nextTick(() => {
            let errInputs = document.querySelectorAll(".is-error")
            errInputs[0].querySelector('input').focus()
          })
        })
    }
  }
}
</script>

<style lang="scss">
.split-category {
  .el-dialog__body {
    padding: 0 20px;
  }

  .in-customized-row {
    .el-checkbox__label {
      padding-right: 0;
    }
  }

  .in-annotation {
    margin-bottom: 16px;
    font-size: 12px;

    span {
      display: inline-block;
      max-width: 15em;
      color: #4A8EFD;
      vertical-align: bottom;
    }
  }

  .in-fieldset {
    margin: 10px 0;
    padding: 20px 0;
    border-radius: 3px;
    background: #F6F6F6;
    position: relative;

    &:hover {
      background: #F1F6FB;
    }
  }

  .el-input input {
    background: #fff;
  }

  .remove-icon {
    cursor: pointer;
    position: absolute;
    right: 20px;
    top: 50%;
    margin-top: -7px;
  }

  .el-dialog__footer {
    position: relative;
  }

  .err-msg {
    padding: 0 20px;
    color: #FE5461;
    font-size: 12px;
    text-align: left;
    position: absolute;
    top: 6px;
    left: 0;
  }
}
</style>
