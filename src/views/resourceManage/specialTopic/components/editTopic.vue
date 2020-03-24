<template>
  <!-- 新建、编辑专题弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="edit-topic">
    <el-form v-loading="loading" ref="form" :model="topicMsg" :rules="rules" element-loading-text="数据加载中..." label-width="110px" label-suffix="：" class="in-dialog pwd-input">
      <el-form-item label="专题名称" prop="name" class="in-input-row">
        <el-input ref="name" v-model.trim="topicMsg.name" type="text" placeholder="请输入专题名称"></el-input>
      </el-form-item>

      <el-form-item label="关键词" prop="keywords" class="in-input-row">
        <simple-select :selected="topicMsg.keyWord" :manual-fill="true" placeholder="不做限制" @selectedChange="handleKeywordChange"></simple-select>
      </el-form-item>

      <el-form-item label="分类" prop="categories" class="in-input-row">
        <categorySelect :selected="topicMsg.categories" :query-all-list="queryCategory"
                        :query-search-list="queryCategoryBySearch" placeholder="不做限制" @selectedChange="handleCategoryChange"/>
      </el-form-item>

      <el-form-item label="标签" prop="labels" class="in-input-row">
        <simple-select :selected="topicMsg.labels" :dropdown="true" :search="true" :query-all-list="queryLabels" :query-search-list="queryLabelBySearch"
                       placeholder="不做限制" @selectedChange="handleLabelChange"></simple-select>
      </el-form-item>

      <el-form-item label="数据表" prop="resources" class="in-input-row">
        <simple-select :selected="topicMsg.resources" :dropdown="true" :search="true" :query-all-list="querySources" :query-search-list="querySources"
                       placeholder="不做限制" @selectedChange="handleResourceChange"></simple-select>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import categorySelect from '@/views/common/searchSelect/treeSelect'
import simpleSelect from '@/views/common/searchSelect/simpleSelect'

export default {
  name: 'addAuthDialog',

  components: {
    categorySelect, simpleSelect
  },

  props: {
    title: {
      type: String,
      required: true
    },
    standardId: {
      type: [Number, String],
      required: true
    },
    topic: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    return {
      rules: {
        name: [
          {required: true, trigger: ['change', 'blur'], message:'请输入专题名称'},
          {max: 20, trigger: 'blur', message:'最大长度不能超过20个字符'},
          {trigger: 'blur', validator: this.isTopicNameExist}
        ]
      },
      resources: [],
      loading: false,
      topicMsg: {
        id: this.topic.id,
        name: this.topic.name || '',
        categories: this.topic.categories ? this.topic.categories.map(category => {
          category.name = category.categoryName
          return category
        }) : [],
        resources: this.topic.resources ? this.topic.resources.map(resource => {
          resource.name = resource.resourceName
          return resource
        }) : [],
        labels: this.topic.labels ? this.topic.labels.map(label => {
          label.name = label.labelName
          return label
        }) : [],
        keyWord: this.topic.keyWord ? this.topic.keyWord.split(',').map(keyWord => ({name: keyWord})) : []
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.$refs.name.focus()
    })
  },

  methods: {
    /**
     * 分类请求
     */
    queryCategory (conditions = {}) {
      const params = {
        parentCategoryId: conditions.categoryId || 0
      }

      return new Promise(resolve => {
        this.$api.get(`/standards/${this.standardId}/categories`, params).then(data => {
          resolve(data.map(category => {
            category.name = category.category_name
            return category
          }))
        })
      })
    },

    queryCategoryBySearch (conditions) {
      return new Promise(resolve => {
        const params = Object.assign({pageIndex: 1, pageSize: 10}, conditions)

        this.$api.get(`/standards/${this.standardId}/categories/list`, params).then(data => {
          resolve(data.map(category => {
            category.name = category.category_name
            return category
          }))
        })
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

    /**
     * 数据表请求
     */
    querySources (conditions) {
      return new Promise(resolve => {
        const params = Object.assign({pageIndex: 1, pageSize: 10}, conditions)

        this.$api.get(`/standards/${this.standardId}/resources/paging`, params).then(data => {
          data = data.data.map(resource => { return {name: resource.resource_name, id: resource.id} })
          resolve(data)
        })
      })
    },

    handleKeywordChange (keywords) {
      this.topicMsg.keyWord = keywords
    },

    handleLabelChange (labels) {
      this.topicMsg.labels = labels
    },

    handleCategoryChange(categories) {
      this.topicMsg.categories = categories
    },

    handleResourceChange(resources) {
      this.topicMsg.resources = resources
    },

    /**
     * 专题重名校验
     */
    isTopicNameExist(rule, value, callback) {
      return this.$api.get(`/standards/${this.standardId}/dissertations/validation/name`, { id: this.topic.id, name: this.topicMsg.name }).then(data => {
        if(!data.available){
          return callback(new Error('专题名称已存在'))
        }
        return callback()
      })
    },

    editTopic (id) {
      const url = id ? `/standards/${this.standardId}/dissertations/${id}` : `/standards/${this.standardId}/dissertations`
      let params = {
        name: this.topicMsg.name,
        keyWord: this.topicMsg.keyWord.map(keyword => keyword.name).join(','),
        labelIds: this.topicMsg.labels.map(label => label.id).join(','),
        categoryIds: this.topicMsg.categories.map(category => category.id).join(','),
        resourceIds: this.topicMsg.resources.map(resource => resource.id).join(',')
      }

      this.$api.post(url, params).then(data => {
        if (id) {
          this.$trsModalSuccess('编辑专题成功!')
          this.$close()
        } else {
          this.$trsModalSuccess('新增专题成功!')
          this.$close(data)
        }
      }, () => {
        this.loading = false
      })
    },

    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          this.editTopic(this.topic.id)
        }, () => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss">
.edit-topic {
  .el-dialog__body {
    max-height: 500px;
  }

  .uirb-search-select .el-select-dropdown {
    position: absolute;
    top: initial;
  }
}
</style>
