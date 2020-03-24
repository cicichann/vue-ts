<template>
  <!-- 分类筛选多层级组件 -->
  <filter-group
    :selected-item="selectedItem"
    :group-list="parentList"
    :class="{'parent-group': parentList.length > 0}"
    @title-click="queryCategory"
    @filteritem-change="handleCategoryChange">
    <template v-if="parentList.length > 0" slot="child-append">
      <category-filter :parent-list="childList" :get-category="getCategory" :selected-item="selectedItem"
                       :check-disabled="checkDisabled" @filteritem-change="handleCategoryChange"></category-filter>
    </template>
  </filter-group>
</template>

<script>
import filterGroup from './filterGroup.vue'

export default {
  name: 'category-filter',

  components: { filterGroup },

  props: {
    parentList: {
      type: Array,
      default: () => {
        return []
      }
    },
    selectedItem: {
      type: Array,
      default: () => {
        return []
      }
    },
    getCategory: {
      type: Function,
      default: () => {}
    },
    // 特殊禁用逻辑
    checkDisabled: {
      type: Function,
      default: () => { return false }
    }
  },

  data () {
    return {
      childList: []
    }
  },

  watch: {
    'parentList' (newVal) {
      this.childList = []
    }
  },

  methods: {
    /**
     * 回调请求下级子分类
     */
    queryCategory (val) {
      let params = { parentCategoryId: +val.id }
      if (+val.id !== 0 && (val.parentId && +val.parentId === 0)) params.rootCategoryId = val.id

      this.getCategory(params).then(data => {
        this.childList = data.map(item => {
          const disabled = this.checkDisabled(item, val)
          return {name: item.category_name, id: item.id, hasRight: item.hasRight, parentId: item.parentId, disabled: disabled}
        })
      })
    },

    handleCategoryChange (val) {
      this.$emit('filteritem-change', val)
    }
  }
}
</script>

<style>
.filter-append .parent-group {
  border-top: 1px solid #e5e9ee;
}
</style>
