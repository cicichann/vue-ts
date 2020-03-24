<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="isModifyDataSource ? '编辑数据源' : '新增数据源'" custom-class="edit-data-source">
    <el-form v-loading="loading" ref="form" :model="dataSource" :rules="rules" element-loading-text="数据加载中..." label-width="100px" label-suffix="：" class="in-dialog">

      <el-form-item class="in-input-row" label="数据源名称" prop="dataSourceName">
        <el-input v-model="dataSource.dataSourceName" placeholder="请输入数据源名称"/>
      </el-form-item>

      <el-form-item v-if="app.appAdapterType !== 'crawler' && editItem.transferModeType !== 'crawler'" class="in-input-row" label="附加参数">
        <el-input v-model="dataSource.extraParams" :rows="3" type="textarea" placeholder="请输入附加参数"/>
      </el-form-item>

      <el-form-item class="in-input-row" label="迁移到" prop="standardId">
        <el-select v-model="dataSource.standardName" :disabled="isModifyDataSource" placeholder="请选择迁移标准" @change="selectStandard();checkNameValid()">
          <el-option v-for="item in standards" :key="item.id" :label="item.name" :value="item.name" />
        </el-select>
      </el-form-item>

      <el-form-item class="in-input-row" label="默认分类" prop="categoryInfo">
        <categorySelect :standard-id="dataSource.standardId" :checked-categories="dataSource.category"
                        :is-tree="true" :get-category="queryCategory" @category-change="handleCategoryChange"/>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import categorySelect from '@/views/common/searchSelect/categorySelect'

export default {
  name: 'editDataSourceDialog',

  components: {
    categorySelect
  },

  props: {
    editItem: {
      type: Object,
      default: function () {
        return {}
      }
    },
    app: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      loading:false,
      dataSource: JSON.parse(JSON.stringify(this.editItem)),
      standards: [], // 标准列表
      rules: {
        dataSourceName: [
          {required: true, trigger: ['change', 'blur'], message: '请输入数据源名称'},
          {max: 20, trigger: 'blur', message:'最大长度不能超过20个字符'},
          {trigger: 'blur', validator: this.isDataSourceNameExist}
        ],
        standardId: [{required: true, trigger: ['change', 'blur'], message: '请选择迁移标准'}]
      }
    }
  },

  computed: {
    /**
     * 处于数据源编辑状态
     */
    isModifyDataSource() {
      return !!this.editItem.id
    }
  },

  mounted() {
    if (!this.dataSource.id) this.queryStandardList()

    if (this.dataSource.id) {
      let params = {standardId: this.dataSource.standardId, dataSourceId: this.dataSource.id}
      this.$api.findDataSourceById(params).then(data => {
        this.editItem = Object.assign({}, data)
        this.dataSource = Object.assign({}, data)
      })
    }
  },

  methods: {
    /**
     * 查询标准列表
     */
    queryStandardList() {
      let url = {
        appId: this.app.appId
      }
      this.$api.queryAppStandardAuth(url).then(data => this.standards = data)
    },

    /**
     * 选择迁移标准
     */
    selectStandard(name) {
      this.dataSource.standardId = this.standards.find(standard => { return standard.name === this.dataSource.standardName}).id
    },

    /**
     * 选择标准时，需要校验系统名称是否重复
     */
    checkNameValid() {
      if (this.dataSource.dataSourceName) {
        this.$refs.form.validateField(['dataSourceName'])
      }
    },

    /**
     * 查询系统名称是否重名
     */
    isDataSourceNameExist(rule, name, callback) {
      if (!this.dataSource.standardId || !this.dataSource.dataSourceName) {
        return callback()
      }

      let url = `/standards/${this.dataSource.standardId}/datasources/datasourcename`
      let params = {
        transferMode: this.dataSource.transferMode,
        datasourceId: this.dataSource.id || 0,
        dataSourceName: name
      }
      return this.$ajax.get(url, {params}).then(data => {
        if (data) {
          callback(new Error('该系统名称已存在'))
        }
        callback()
      })
    },

    /**
     * 新建数据源
     */
    addDataSource() {
      this.loading = true
      let categoryIds = []
      if(this.dataSource.category) this.dataSource.category.map(item => {
        categoryIds.push(item.id)
      })
      let params = Object.assign(this.dataSource, { categoryIds: categoryIds.join(','), appId: this.app.appId })

      this.$api.addDataSource({standardId: this.dataSource.standardId}, params).then(() => {
        this.$close()
        this.$trsModalSuccess('新建数据源成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑数据源
     */
    modifyDataSource() {
      this.loading = true
      let categoryIds = []
      this.dataSource.category.map(item => {
        categoryIds.push(item.id)
      })
      let params = Object.assign(this.dataSource, { categoryIds: categoryIds.join(',') })

      this.$api.modifyDataSource(this.$pick(this.dataSource, ['id', 'standardId']), params).then(() => {
        this.$close()
        this.$trsModalSuccess('编辑数据源成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 点击确认按钮
     */
    confirm() {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          return this.mappingValidation()
        })
        .then(() => {
          if (this.editItem.id) {
            this.modifyDataSource()
          } else {
            this.addDataSource()
          }
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 修改附加参数校验
     */
    mappingValidation() {
      let url = `/standards/${this.dataSource.standardId}/datasources/${this.dataSource.id}/validation`
      let params = this.$pick(this.dataSource, ['extraParams'])

      return new Promise((resolve) => {
        if (!this.dataSource.id) {
          return resolve()
        }

        return this.$ajax.get(url, {params: params, type: '张数据表'}).then(data => {
          return resolve()
        })
      })
    },

    /**
     * 分类请求方法
     */
    queryCategory (params) {
      let url = this.$pick(params, ['standardId', 'categoryId'])
      url.appId = this.isModifyDataSource ? this.editItem.appId : this.app.appId

      return new Promise(resolve => {
        this.$api.queryAppClassifyAuth(url, {searchText: params.searchText}).then(data => {
          resolve(data)
        })
      })
    },

    /**
     * 默认分类改变
     */
    handleCategoryChange(categories) {
      this.dataSource.category = categories
    }
  }

}
</script>

<style lang="scss">
.edit-data-source {
  .el-dialog__body {
    max-height: 500px;
    overflow-y: auto;
  }
  .el-form-item {
    position: relative;
  }
  .el-textarea{
    width: 320px;
  }
  .el-textarea__inner {
    resize: none;
    font-family: Arial;
  }
}
</style>
