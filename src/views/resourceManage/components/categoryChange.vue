<template>
  <!-- 调整分类弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="change-category">
    <el-form v-loading="loading" element-loading-text="数据加载中..." label-width="110px" label-suffix="：" class="in-dialog pwd-input">
      <el-form-item :label="title + '为'" class="in-input-row">
        <treeSelect :selected="categories" :query-all-list="queryCategory" :query-search-list="queryCategoryBySearch"
                    placeholder="请选择分类" @selectedChange="handleCategoryChange"/>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading || (categories.length === 0 && type === 'replace')" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import treeSelect from '@/views/common/searchSelect/treeSelect'

export default {
  name: 'changeCategoryDialog',

  components: {
    treeSelect
  },

  props: {
    standardId: {
      type: [Number, String],
      required: true
    },
    resourceId: {
      type: [Number, String],
      required: true
    },
    dataIds: {
      type: String,
      required: true
    },
    containsAll: {
      type: [Number, String],
      default: 0
    },
    // 列表是否全选
    curCategory: {
      type: Object,
      default: () => {}
    },
    categoryIds: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    params: {
      type: Object,
      default: () => {}
    }
  },

  data () {
    return {
      categories: [],
      loading: false
    }
  },

  computed: {
    title () {
      return this.type === 'add' ? '追加分类' : '替换分类'
    }
  },

  methods: {
    /**
     * 箭头下拉全部分类请求
     */
    queryCategory (conditions = {}) {
      const params = {
        parentCategoryId: conditions.categoryId || 0
      }

      return new Promise(resolve => {
        this.$api.get(`/standards/${this.standardId}/categories/authorization`, params).then(data => {
          resolve(data.map(category => {
            category.name = category.category_name
            return category
          }))
        })
      })
    },

    /**
     * 检索下拉分类请求
     */
    queryCategoryBySearch (conditions) {
      return new Promise(resolve => {
        const params = Object.assign({pageIndex: 1, pageSize: 10}, conditions)

        this.$api.get(`/standards/${this.standardId}/categories/list/authorization`, params).then(data => {
          resolve(data.map(category => {
            category.name = category.category_name
            return category
          }))
        })
      })
    },

    handleCategoryChange(categories) {
      this.categories = categories
    },

    confirm () {
      let params = {
        dataIds: this.dataIds,
        categoryIds: this.categories.map(category => category.id).join(','),
        containsAll: this.containsAll,
        currCategoryIds: this.categoryIds,
        type: this.type === 'replace' ? 1 : 2
      }
      this.loading = true
      this.$api.post(`/standards/${this.standardId}/resources/${this.resourceId}/data/categories`, Object.assign(params, this.params)).then(data => {
        this.$trsModalSuccess(this.title + '成功!')
        this.$close()
      }, err => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss"></style>
