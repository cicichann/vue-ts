<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="排重规则" custom-class="deduplication-dialog">
    <el-form v-loading="loading" ref="form" :model="formData" :rules="rules" label-width="110px" class="demo-ruleForm">
      <el-form-item label="字段：" class="in-input-row">
        <simple-select :selected="selectedAttrs" :dropdown="true" :search="true" :query-all-list="queryAttrs" :query-search-list="queryAttrs"
                       :is-lazy="false" :all-select="true" placeholder="请选择字段" @selectedChange="handleAttrChange"></simple-select>
      </el-form-item>
      <el-form-item label="重复率阈值：" prop="simRate" class="in-input-row">
        <el-input v-model="formData.simRate" placeholder="请输入重复率阈值"><span slot="suffix">%</span></el-input>
      </el-form-item>
      <el-form-item label="" class="in-input-row">
        <p :class="{'disable-restore': ifDefault}" class="restore-btn fl" @click="restoreDefault()">恢复到系统默认</p>
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
import { treeToArray } from '@/utils/index'

export default {
  name: "setDeDuplicationDialog",

  components:{ simpleSelect },

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
      attrs: [],
      selectedAttrs: [],
      formData: {
        simRate: ''
      },
      ifDefault: true, // 是否为系统默认
      defaultSimRate: null, // 默认阈值
      rules: {
        simRate: [
          { required: true, message: '请输入重复率阈值', trigger: ['blur', 'change'] },
          { validator: this.checkSimRate, trigger: ['blur', 'change'] }
        ]
      }
    }
  },

  watch: {
    'formData.simRate': function (newVal, oldVal) {
      if (this.defaultSimRate && newVal !== this.defaultSimRate) {
        this.ifDefault = false
      }
    }
  },

  mounted () {
    this.loading = true
    Promise.all([
      this.querySimrule(),
      this.queryAttrs()
    ]).then(values => {
      if (values[0]) {
        this.selectedAttrs = values[0].isSysDefault === 1 ? this.attrs
        : values[0].simAttrIds.split(',').map(id => {
          return this.attrs.find(item => +item.id === +id)
        })
      }
      this.loading = false
    })
  },

  methods: {
    /**
     * 查询排重规则
     */
    querySimrule () {
      return new Promise((resolve, reject) => {
        this.$api.get(`/standards/${this.query.standardid}/resources/${this.resourceId}/simrule`, {}).then(data => {
          this.formData.simRate = data.simRate
          this.defaultSimRate = data.defaultSimRate
          this.ifDefault = data.isSysDefault === 1
          resolve(data)
        })
      })
    },

    /**
     * 查询所有字段
     */
    queryAttrs (conditions = {}) {
      return new Promise((resolve, reject) => {
        let url = {
          standardId: this.query.standardid,
          resourceId: this.resourceId
        }
        let params = {
          isOverview: 0, // 0-全部字段，1-概览属性字段，2-非概览
          isSearchField: 0, // 0-全部，1-检索，2-非检索
          searchText: ''
        }
        this.$api.queryStructureTableList(url, Object.assign(params, conditions)).then((data) => {
          this.attrs = treeToArray(data.rows)
            // 过滤整型数值、附件、关联表、复合字段父字段类型
            .filter(attr => {
              return attr.field_type !== 'RELATEDTABLE' && attr.field_type !== 'NUMERICAL' && attr.field_type !== 'APPENDIX'
                && !((attr.field_type === 'ARRAY' || attr.field_type === 'OBJECT') && attr.parent_id === 0)
            })
            .map(attr => {
              let attrName = attr.cn_name
              if (attr.parent) {
                attrName = attr.parent.cn_name + '-' + attr.cn_name
              }
              return {name: attrName, id: attr.id}
            })
          resolve(this.attrs)
        })
      })
    },

    /**
     * 阈值校验
     */
    checkSimRate (rule, value, callback) {
      if ((/^(0|[1-9]\d*)$/.test(this.formData.simRate) || /^\d+(\.\d+)?$/.test(this.formData.simRate)) && +this.formData.simRate >= 0 && +this.formData.simRate <= 100) {
        callback()
      } else {
        callback(new Error('请输入0-100的数值'))
      }
    },

    /**
     * 字段选择修改回调
     */
    handleAttrChange (attrs) {
      this.selectedAttrs = attrs
      this.ifDefault = false
    },

    /**
     * 恢复到系统默认
     */
    restoreDefault () {
      if (!this.ifDefault) {
        this.formData.simRate = this.defaultSimRate
        this.selectedAttrs = JSON.parse(JSON.stringify(this.attrs))
        this.ifDefault = true
      }
    },

    /**
     * 确认提交
     */
    confirm () {
      this.$refs.form.validate()
      .then(() => {
        this.loading = true
        this.$api.post(`/standards/${this.query.standardid}/resources/${this.resourceId}/simrule`, {
          simAttrIds: this.selectedAttrs.map(attr => attr.id).join(','),
          simRate: this.formData.simRate,
          isSysDefault: this.ifDefault ? 1 : 0
        }).then(data => {
          this.$trsModalSuccess('排重规则设置成功！')
          this.$close()
        })
      })
    }
  }
}
</script>

<style lang="scss">
.deduplication-dialog {
  .restore-btn {
    color: #4a8efd;
    cursor: pointer;
  }

  .restore-btn.disable-restore {
    color: #C5C8CC;
    cursor: not-allowed;
  }
}
</style>