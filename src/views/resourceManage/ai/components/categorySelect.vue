<template>
  <div class="preview-category-attr">
    <div v-if="!editing" class="attr-normal fl overflow">
      <span :title="desc || '无'" class="overflow">{{ desc || '无' }}</span>
      <i class="header-edit-btn fr" title="编辑" @click.stop="editClick"></i>
    </div>
    <div v-clickoutside="saveCategory" v-else class="attr-editing">
      <treeSelect ref="treeSelect" :selected="selectCategories" :query-all-list="queryCategory" :query-search-list="queryCategoryBySearch"
                  :append-to-body="false" :check-disabled="checkDisabled" placeholder="请选择分类" @selectedChange="handleCategoryChange"/>
    </div>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import treeSelect from '@/views/common/searchSelect/treeSelect'

export default {
  name: 'previewCategorySelect',

  components: { treeSelect },

  directives: { Clickoutside },

  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      editing: false,
      selectCategories: this.categories.map(category => ({ name: category.category_name, id: category.id }))
    }
  },

  computed: {
    desc () {
      return this.selectCategories.map(category => category.name).join(',')
    }
  },

  methods: {
    editClick () {
      this.editing = true
      this.$nextTick(() => {
        this.$refs.treeSelect.$refs.selectInput.focus()
      })
    },

    /**
     * 箭头下拉全部分类请求
     */
    queryCategory (conditions = {}) {
      const params = {
        parentCategoryId: conditions.categoryId || 0
      }

      return new Promise(resolve => {
        this.$api.get(`/standards/${this.$route.query.standardid}/categories/authorization`, params).then(data => {
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

        this.$api.get(`/standards/${this.$route.query.standardid}/categories/list/authorization`, params).then(data => {
          resolve(data.map(category => {
            category.name = category.category_name
            return category
          }))
        })
      })
    },

    handleCategoryChange(categories) {
      this.selectCategories = categories
    },

    checkDisabled (item) {
      return this.selectCategories.length === 1 && item.name === this.selectCategories[0].name
    },

    saveCategory () {
      if (this.editing) {
        this.editing = false
        let params = {
          dataIds: this.$route.query.dataid,
          categoryIds: this.selectCategories.map(category => category.id).join(','),
          currCategoryIds: '',
          containsAll: 0,
          type: 1
        }
        this.$api.post(`/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data/categories`, params)
      }
    }
  }
}
</script>

<style lang="scss">
.preview-category-attr {
  .attr-editing {
    margin-bottom: 5px;
  }
}
</style>