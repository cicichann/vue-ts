<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="默认排序规则" custom-class="set-rule-dialog">
    <div v-loading="loading">
      <el-form ref="form" :model="data" class="rule-form">
        <div v-for="(item, index) in data.sortInfos" :key="item.attrId" class="in-input-row draggable">
          <i class="move-icon"></i>
          <el-form-item :rules="{required: true, message: '请选择排序字段', trigger: 'change'}" :prop="'sortInfos.' + index + '.cn_name'">
            <el-select v-model="item.cn_name" class="select-long" @change="value => selectField(value, index)">
              <el-option v-for="option in optionList" :key="option.id" :label="option.cn_name" :value="option.cn_name" />
            </el-select>
          </el-form-item>

          <el-form-item :rules="{required: true, message: '请选择排序类型', trigger: 'change'}" :prop="'sortInfos.' + index + '.isAsc'">
            <el-select v-model="item.isAsc" class="select-short">
              <el-option :value="1" label="升序"/>
              <el-option :value="0" label="降序"/>
            </el-select>
          </el-form-item>
          <i v-if="data.sortInfos.length > 1" class="delete-icon" @click="deleteRule(index)"></i>
        </div>

        <div v-if="data.sortInfos.length < data.fieldList.length" class="in-add-button dis-draggable" @click="addRule"><i class="add-icon"></i>新增排序</div>
        <p class="tip dis-draggable">排序权重自上而下依次降低</p>
      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Sortable from 'sortablejs'
import { treeToArray } from '@/utils/index'

export default {
  name: "setDeDuplicationDialog",

  props: {
    resourceId: {
      type: Number,
      default: 0
    },
    query: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      data : {
        fieldList: [], // 字段列表数据
        sortInfos: [] // 排序规则数据
      }
    }
  },

  computed: {
    optionList () {
      let list = [...this.data.fieldList]
      this.data.sortInfos.map(item => {
        let index = list.findIndex(field => { return field.cn_name === item.cn_name })
        if (index >= 0) list.splice(index, 1)
      })
      return list
    }
  },

  mounted () {
    this.queryFieldList().then(() => {
      this.querySortInfo()
    })
  },

  methods: {
    /**
     * 请求字段列表数据
     */
    queryFieldList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        this.data.fieldList = []

        let url = {
          standardId: this.query.standardid,
          resourceId: this.resourceId
        }

        this.$api.queryStructureTableList(url).then(data => {
          this.data.fieldList = treeToArray(data.rows)
            .filter(item => {
              let type = item.field_type
              return type === 'NUMERICAL' || type === 'DATE'
            })
            .map(item => {
              return item.parent ? Object.assign(item, {cn_name: item.cn_name + '(' + item.parent.cn_name + ')'}) : item
            })
          resolve()
        }, () => {
          reject()
        })
      })
    },

    /**
     * 查询字段已配置排序信息
     */
    querySortInfo () {
      this.loading = true
      this.data.sortInfos = []

      this.$api.get(`/standards/${this.query.standardid}/resources/${this.resourceId}/sort`).then(data => {
        data.map(item => {
          let targetItem = this.data.fieldList.find(field => { return field.id === item.attrId })
          if (targetItem) this.data.sortInfos.push(Object.assign(item, { cn_name: targetItem.cn_name }))
        })
        this.loading = false
        this.$nextTick(() => { this.rowDrop() })
      }, () => {
        this.loading = false
      })
    },

    /**
     * 新增排序
     */
    addRule () {
      let list = []
      this.data.sortInfos.map(item => { list.push(item.attrId) })
      this.data.sortInfos.push({ attrId: list.length ? Math.max(...list) + 1 : 0, isAsc: 1 })
    },

    /**
     * 删除排序
     */
    deleteRule (index) {
      this.data.sortInfos.splice(index, 1)
    },

    /**
     * 选择字段
     */
    selectField (name, index) {
      this.data.sortInfos[index].attrId = this.data.fieldList.find(item => { return item.cn_name === name }).id
    },

    /**
     * 拖拽排序
     */
    rowDrop () {
      const el = document.querySelector('.rule-form')
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
          if(evt.newIndex !== evt.oldIndex) {
            let list = this.data.sortInfos,
                item = list[evt.oldIndex]
            this.$nextTick(() => {
              list.splice(evt.oldIndex, 1)
              list.splice(evt.newIndex, 0, item)
            })
          }
        }
      })
    },

    /**
     * 确认提交
     */
    confirm () {
      this.$refs.form.validate()
        .then(() => {
          this.loading = true
          let params = this.data.sortInfos.map(item => {
            return {
              attrId: item.attrId,
              isAsc: item.isAsc
            }
          })
          this.$api.post(`/standards/${this.query.standardid}/resources/${this.resourceId}/sort`, { sort: JSON.stringify(params) }).then(() => {
            this.$trsModalSuccess('设置默认排序规则成功！')
            this.$close()
          })
        }, () => {
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss">
.set-rule-dialog {
  /* 布局 */
  .rule-form {
    padding: 0 20px 0 10px;
  }
  .in-input-row {
    position: relative;
  }
  .el-form-item {
    display: inline-block;
    position: relative;
    margin: 0;

    &.is-error {
      margin-bottom: 20px;
    }

    /* 错误信息 */
    .el-form-item__error {
      position: absolute;
    }
  }

  /* 下拉框 */
  .select-short, .select-long {
    display: inline-block;
  }
  .select-short .el-input {
    width: 100px;
  }
  .select-long .el-input {
    width: 325px;
  }

  /* 拖拽图标 */
  .move-icon {
    margin-left: -10px;
  }

  /* 删除图标 */
  .delete-icon {
    cursor: pointer;
    position: absolute;
    right: -20px;
    top: 20px;
    width: 14px;
    height: 14px;
    margin-top: -7px;
    background: url("~@/assets/images/close-icon.png") no-repeat center;

    &:hover {
      background-image: url("~@/assets/images/close-icon-hover.png");
    }
  }

  /* 文案 */
  .tip {
    line-height: 40px;
  }
}
</style>