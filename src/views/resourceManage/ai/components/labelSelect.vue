<template>
  <div class="preview-label-attr">
    <div v-if="!editing" class="attr-normal fl overflow">
      <span :title="desc || '无'" class="overflow">{{ desc || '无' }}</span>
      <i class="header-edit-btn fr" title="编辑" @click.stop="editClick"></i>
    </div>
    <div v-clickoutside="saveLabel" v-else class="attr-editing">
      <simple-select ref="labelSelect" :selected="selectLabels" :dropdown="true" :search="true" :query-all-list="queryLabels" :query-search-list="queryLabelBySearch"
                     :append-to-body="false" placeholder="请选择标签" @selectedChange="handleLabelChange"></simple-select>
    </div>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';
import simpleSelect from '@/views/common/searchSelect/simpleSelect'

export default {
  name: 'previewLabelSelect',

  components: { simpleSelect },

  directives: { Clickoutside },

  props: {
    labels: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      editing: false,
      selectLabels: this.labels.map(label => ({ name: label.label, id: label.id }))
    }
  },

  computed: {
    desc () {
      return this.selectLabels.map(label => label.name).join(',')
    }
  },

  methods: {
    editClick () {
      this.editing = true
      this.$nextTick(() => {
        this.$refs.labelSelect.$refs.selectInput.focus()
      })
    },

    /**
     * 标签请求
     */
    queryLabels (conditions) {
      return new Promise(resolve => {
        const params = Object.assign({pageIndex: 1, pageSize: 10}, conditions)

        this.$api.get('/labels', params).then(data => {
          data = data.data.map(label => { return {name: label.label, id: label.id} })
          resolve(data)
        })
      })
    },

    queryLabelBySearch (conditions) {
      return new Promise(resolve => {
        const params = Object.assign({pageIndex: 1, pageSize: 10}, conditions)

        this.$api.get('/labels/search', params).then(data => {
          data = data.map(label => { return {name: label.label, id: label.id} })
          resolve(data)
        })
      })
    },

    handleLabelChange (labels) {
      this.selectLabels = labels
    },

    saveLabel () {
      if (this.editing) {
        this.editing = false
        let params = {
          dataIds: this.$route.query.dataid,
          labelIds: this.selectLabels.map(label => label.id).join(','),
          currCategoryIds: '',
          containsAll: 0,
          type: 1
        }
        this.$api.post(`/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data/labels`, params)
      }
    }
  }
}
</script>

<style lang="scss">
.preview-label-attr {
  .attr-editing {
    margin-top: 5px;
  }
}
</style>