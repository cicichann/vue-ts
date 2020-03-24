<template>
  <!-- 调整标签弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="change-label">
    <el-form v-loading="loading" ref="form" element-loading-text="数据加载中..." label-width="110px" label-suffix="：" class="in-dialog pwd-input">
      <el-form-item :label="title + '为'" class="in-input-row">
        <simple-select :selected="labels" :dropdown="true" :search="true" :query-all-list="queryLabels" :query-search-list="queryLabelBySearch"
                       placeholder="请选择标签" @selectedChange="handleLabelChange"></simple-select>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import simpleSelect from '@/views/common/searchSelect/simpleSelect'

export default {
  name: 'changeLabelDialog',

  components: {
    simpleSelect
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
    // 列表是否全选
    containsAll: {
      type: [Number, String],
      default: 0
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
      labels: [],
      loading: false
    }
  },

  computed: {
    title () {
      return this.type === 'add' ? '追加标签' : '替换标签'
    }
  },

  methods: {
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
      this.labels = labels
    },

    confirm () {
      let params = {
        dataIds: this.dataIds,
        labelIds: this.labels.map(category => category.id).join(','),
        containsAll: this.containsAll,
        categoryIds: this.categoryIds,
        type: this.type === 'replace' ? 1 : 2
      }
      this.loading = true
      this.$api.post(`/standards/${this.standardId}/resources/${this.resourceId}/data/labels`, Object.assign(params, this.params)).then(data => {
        this.$trsModalSuccess(this.title + '成功!')
        this.$close()
      }, err => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.change-label .is-error .el-select {
  border-color: #F56C6C;
}
</style>
