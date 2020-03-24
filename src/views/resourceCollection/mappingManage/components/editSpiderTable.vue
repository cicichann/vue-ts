<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="tableId ? '编辑表' : '新增表'" custom-class="edit-spider-table">
    <el-form v-loading="loading" ref="form" :model="form" :rules="rules">

      <el-form-item class="in-input-row color-green" prop="tableName">
        <span slot="label"></span><el-input v-model="form.tableName" class="input-short" type="text" placeholder="请输入表名"></el-input>
      </el-form-item>

      <el-form-item class="in-input-row color-green" prop="tableXpath">
        <el-input v-model="form.tableXpath" class="input-long" placeholder="请输入表的Xpath"></el-input>
      </el-form-item>

      <el-form-item>
        <span class="input-short"></span>
      </el-form-item>
      <el-form-item class="in-input-row color-green" prop="recordXpath" style="margin-left: 0px;">
        <el-input v-model="form.recordXpath" class="input-long" placeholder="请输入记录块的Xpath"></el-input>
      </el-form-item>

      <el-form-item>
        <span class="input-short"></span>
      </el-form-item>
      <el-form-item class="in-input-row color-green" prop="pageXpath" style="margin-left: 0px;">
        <el-input v-model="form.pageXpath" class="input-long" placeholder="请输入翻页按钮的文本"></el-input>
      </el-form-item>

      <div v-for="(item, key) in form.fieldInfos" :key="key" style="position: relative;">
        <el-form-item :rules="[{required: true, message: '请输入字段名', trigger: 'blur'},{max: 20, trigger: 'change', message:'最大长度不能超过20个字符'}]"
                      :prop="'fieldInfos.' + key + '.fieldName'" class="in-input-row">
          <span slot="label"></span><el-input v-model="item.fieldName" class="input-short" placeholder="请输入字段名"></el-input>
        </el-form-item>

        <el-form-item :rules="{required: true, message: '请选择类型', trigger: 'change'}" :prop="'fieldInfos.' + key + '.fieldTypeId'" class="in-input-row">
          <el-select v-model="item.fieldTypeId" :disabled="editItem.sourceFields && editItem.sourceFields[key] && (editItem.sourceFields[key].mappingId > 0)" placeholder="请选择类型">
            <el-option
              v-for="item in fieldTypeList"
              :key="item.fieldTypeId"
              :label="item.fieldTypeName"
              :value="item.fieldTypeId">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :rules="{required: true, message: '请输入Xpath', trigger: 'blur'}" :prop="'fieldInfos.' + key + '.fieldXpath'" class="in-input-row">
          <el-input v-model="item.fieldXpath" placeholder="请输入Xpath" style="width: 205px;"></el-input>
        </el-form-item>

        <i v-if="key > 0 || form.fieldInfos.length > 1" class="delete-icon" @click="deleteField(key)"></i>
      </div>

      <el-form-item class="in-input-row">
        <p class="add-field" @click="addField">
          <span>新增字段</span>
        </p>
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
  name: 'editSpiderTableDialog',

  props: {
    editItem: {
      type: Object,
      default: function () {
        return {}
      }
    },
    tableId: {
      type: [String, Number],
      default: ''
    },
    standardId: {
      type: [String, Number],
      default: ''
    },
    dataSourceId: {
      type: [String, Number],
      default: ''
    }
  },

  data() {
    return {
      fieldTypeList: [],  // 字段类型集合
      fieldTypeMap: {},
      form: {
        tableName: undefined,  // 爬虫表名
        tableXpath: '', // 爬虫表xpath
        recordXpath: '',  // 爬取记录xpath
        pageXpath: '',  // 翻页xpath
        fieldInfos: [{
          fieldId: '0', // 字段id
          fieldName: '',  // 字段名
          fieldXpath: '',  // 字段xpath
          fieldTypeId: '',
          fieldTypeName: ''
        }]
      },

      rules: {
        tableName: [
          {required: true, trigger: 'blur', message: '请输入表名'},
          {max: 20, trigger: 'blur', message:'最大长度不能超过20个字符'}
        ],
        tableXpath: [{required: true, trigger: 'blur', message: '请输入表的Xpath'}],
        recordXpath: [{required: true, trigger: 'blur', message: '请输入记录块的Xpath'},],
        pageXpath: [{required: true, trigger: 'blur', message: '请输入翻页按钮的文本'}]
      },
      loading: false
    }
  },

  mounted() {
    this.queryFieldTypeList()

    if (this.tableId) {
      this.queryTableInfo()
    }
  },

  methods: {
    /**
     * 查询字段类型下拉
     */
    queryFieldTypeList() {
      this.$api.queryFieldType({purpose: 3}).then(data => {
        this.fieldTypeList = data
        data.map(item => {
          this.$set(this.fieldTypeMap, item.fieldTypeId, item.fieldTypeName)
        })
        // if(!this.tableId) document.querySelector('.edit-spider-table input').focus()
      })
    },

    /**
     * 查询表字段数据
     */
    queryTableInfo() {
      let url = this.$pick(this, ['standardId', 'dataSourceId', 'tableId'])

      this.$api.findSpiderTableById(url).then(data => {
        this.form = data
      })
    },

    /**
     * 新增字段
     */
    addField() {
      this.form.fieldInfos.push({
        fieldId: '0',
        fieldName: '',
        fieldXpath: '',
        fieldTypeId: ''
      })
    },

    /**
     * 删除字段
     */
    deleteField(index) {
      this.form.fieldInfos.splice(index, 1)
    },

    /**
     * 新增爬虫表
     */
    addSpiderTable() {
      let url = this.$pick(this, ['standardId', 'dataSourceId'])
      let params = Object.assign({}, this.form)
      for (let i = 0; i < params.fieldInfos.length; i++) {
        params.fieldInfos[i].fieldTypeName = this.fieldTypeMap[params.fieldInfos[i].fieldTypeId]
      }
      params.fieldInfos = JSON.stringify(this.form.fieldInfos)

      this.$api.addSpiderTable(url, params).then(() => {
        this.$close()
        this.$trsModalSuccess('新建爬虫表成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 修改爬虫表
     */
    modifySpiderTable() {
      let url = this.$pick(this, ['standardId', 'dataSourceId', 'tableId'])
      let params = Object.assign({}, this.form)
      for (let i = 0; i < params.fieldInfos.length; i++) {
        params.fieldInfos[i].fieldTypeName = this.fieldTypeMap[params.fieldInfos[i].fieldTypeId]
      }
      params.fieldInfos = JSON.stringify(this.form.fieldInfos)

      this.$api.modifySpiderTable(url, params).then(() => {
        this.$close()
        this.$trsModalSuccess('编辑爬虫表成功！')
      }, () => {
        this.loading = false
      })
    },

    confirm() {
      this.loading = true
      this.$refs.form.validate().then(() => {
        if (this.tableId) {
          this.modifySpiderTable()
        } else {
          this.addSpiderTable()
        }
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.edit-spider-table {
  &.el-dialog {
    width: 540px;
    max-height: inherit;
    overflow: visible;

    > .el-form {
      max-height: 400px;
      overflow-y: auto;
    }
  }

  .el-form-item__label {
    width: 0;
    float: left;
    vertical-align: top;
  }
  .el-form-item__content {
    float: left;
    vertical-align: top;
  }

  /* 错误信息位置定位 */
  .el-form-item {
    display: inline-block;
    position: relative;
    vertical-align: top;

    .el-form-item__error {
      position: absolute;
      left: 0;
      top: 100%;
    }

    .input-short + .el-form-item__error {
      margin-left: 15px;
    }

    &.is-error {
      margin-bottom: 25px;
    }
  }

  .el-form-item.color-green .el-input__inner {
    color: #39CB82;
  }

  /* 名称、xpath输入框 */
  .input-short, .input-long {
    display: inline-block;

    .el-input__inner {
      padding: 0 8px;
    }
  }
  .input-short {
    width: 110px;
    margin-left: 10px;
    margin-right: 5px;
  }
  .input-long {
    width: 320px;
  }
  span.input-short {
    margin-right: 9px;
  }
  .el-select {
    width: 110px;

    .el-input {
      width: 110px;
    }

    input {
      padding-left: 8px;
    }
    input::-webkit-input-placeholder {
      /* placeholder颜色  */
      color: #969ea6;
    }
  }

  /* 删除字段图标 */
  i.delete-icon {
    position: absolute;
    top: 12px;
    left: 457px;
    display: inline-block;
    width: 14px;
    height: 14px;
    background: url("~@/assets/images/close-icon.png") no-repeat center;
    cursor: pointer;
  }

  /* 新增字段 */
  .add-field {
    display: inline-block;
    width: 435px;
    margin-left: 15px;
    border: 1px dashed #E6EBEF;
    text-align: center;
    cursor: pointer;
    > span {
      margin-left: -20px;
      padding-left: 20px;
      background: url("~@/assets/images/add-icon-small.png") no-repeat left center;
    }
  }
}
</style>
