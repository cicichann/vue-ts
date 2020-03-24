<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="数据表属性" custom-class="attribute-setting">
    <el-table v-loading="loading" :data="attributeData" :row-class-name="setClass" :row-style="setRowStyle" height="360">
      <template slot="empty">
        暂无字段，<a :href="url">立即配置</a>
      </template>

      <el-table-column prop="cn_name" label="字段名称" width="76px">
        <template slot-scope="scope">
          <span>{{ scope.row.cn_name }}</span>
          <i v-if="scope.row.field_type === 'ARRAY' || scope.row.field_type === 'OBJECT'"
             :class="{'el-icon-caret-top': scope.row._expanded, 'el-icon-caret-bottom': !scope.row._expanded}" class="dropdown-btn"
             @click="scope.row._expanded = !scope.row._expanded"></i>
        </template>
      </el-table-column>

      <el-table-column label="标题" width="48px">
        <template slot-scope="scope">
          <el-tooltip :disabled="!isTitleDisabled(scope.row)" :content="promptText(scope.row)" effect="dark" popper-class="type-tooltip" placement="top-start">
            <el-radio v-if="isTitleShow(scope.row)" :disabled="isTitleDisabled(scope.row)" v-model="radio" :label="scope.row.id"
                      :class="{'promptCursor': isTitleDisabled(scope.row)}" @change="changeTitle(scope.row)" />
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="只读" width="50px">
        <template slot-scope="scope">
          <el-checkbox v-if="isTitleShow(scope.row)" v-model="checkAttributes" :label="'attributeOnlyread' + scope.row.id"
                       :disabled="scope.row.is_sys_default === 1" @change="check => changeReadonly(check, scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="概览显示" width="76px">
        <template slot-scope="scope">
          <el-checkbox v-if="isOverviewShow(scope.row)" v-model="checkAttributes" :label="'attributeShow' + scope.row.id"
                       :disabled="scope.row.is_search_field === '1'" @change="check => changeOverview(check, scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="概览检索" width="76px">
        <template slot-scope="scope">
          <el-checkbox v-if="isSearchShow(scope.row)" v-model="checkAttributes" :label="'attributeSearch' + scope.row.id" :disabled="scope.row.is_title === '1'"
                       @change="checked => changeSearch(checked,scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="细览显示" width="76px">
        <template slot-scope="scope">
          <el-checkbox v-if="isOverviewShow(scope.row)" v-model="checkAttributes" :label="'attributeDetail' + scope.row.id"
                       @change="check => changeDetailDisplay(check, scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="必填" width="50px">
        <template slot-scope="scope">
          <el-tooltip :disabled="!scope.row.isRequiredDisabled" :content="requiredPromptText(scope.row)" effect="dark" popper-class="type-tooltip" placement="top-start">
            <el-checkbox v-if="isRequiredShow(scope.row)" v-model="checkAttributes" :disabled="scope.row.is_title === '1' || scope.row.isRequiredDisabled"
                         :label="'attributeIsRequire' + scope.row.id" :class="{'promptCursor': scope.row.isRequiredDisabled}" @change="check => changeRequired(check, scope.row)" />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="saveAttributes">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    query: {
      type: Object,
      required: true
    },
    resource: {
      type: Object,
      default: () => {}
    }
  },

  data () {
    return {
      loading: false,
      attributeData: [], // 接口返回的列表数据
      radio: "", // 选中的标题字段
      checkAttributes: [], // 选中的复选属性列表
      hasData: false // 数据表有无数据
    }
  },

  computed: {
    url () {
      return `/model/structure/list?standardid=${this.query.standardid}&groupid=${this.query.groupid}&resourceid=${this.resource.id}&resourcename=${this.resource.resource_name}`
    },

    isTitleShow () {
      return function (row) {
        let fieldType = row.field_type
        return (fieldType === 'TEXT' || fieldType === 'DATE' || fieldType === 'NUMERICAL') && row.is_sys_default !== 1 && !row.parent
      }
    },

    isOverviewShow () {
      return function (row) {
        return row.field_type !== 'APPENDIX' && !row.fields
      }
    },

    isSearchShow () {
      return function (row) {
        return (row.field_type === 'TEXT' || row.field_type === 'RICH_TEXT') && row.en_name !== 'label' && row.en_name !== 'category'
      }
    },

    isRequiredShow () {
      return function (row) {
        return (!row.is_sys_default && !row.fields)
      }
    },

    isTitleDisabled () {
      return function (row) {
        return (this.hasData && row.is_required === '0')
      }
    },

    promptText () {
      return function (row) {
        return (this.hasData && row.is_required === '0') ? '数据表已有数据，禁止将非必填字段设为标题' : ''
      }
    },

    requiredPromptText () {
      return function (row) {
        return (this.hasData && row.is_required === '0') ? '数据表已有数据，禁止将非必填字段设为必填' : ''
      }
    }
  },

  watch: {
    attributeData: {
      deep: true,
      handler: function (list) {
        this.checkAttributes = []
        let dealData = ((array) => {
          array.map((item) => {
            if (item.is_title === "1") {
              this.radio = item.id
            }
            if (item.is_overview === "1") {
              this.checkAttributes.push("attributeShow" + item.id)
            }
            if (item.is_search_field === "1") {
              this.checkAttributes.push("attributeSearch" + item.id)
            }
            if (item.detail_display === "1") {
              this.checkAttributes.push("attributeDetail" + item.id)
            }
            if (item.read_only === "1") {
              this.checkAttributes.push("attributeOnlyread" + item.id)
            }
            if (item.is_required === "1") {
              this.checkAttributes.push("attributeIsRequire" + item.id)
            }
            if (item.fields) dealData(item.fields)
          })
        })

        dealData(list)
      }
    }
  },

  mounted() {
    this.verifyRourceData()
    this.querList()
  },

  methods: {
    /**
     * 当前数据表有无数据
     */
    verifyRourceData () {
      let url = {
        standardId: this.query.standardid,
        resourceId: this.resource.id
      }
      this.$api.checkResourceData(url).then(data => {
        this.hasData = data
      })
    },

    /**
     * 请求数据
     */
    querList () {
      this.loading = true
      this.attributeData = []

      let url = {
        standardId: this.query.standardid
      }
      let prama = {
        resourceId: this.resource.id
      }
      this.$api.queryAttributeFieldList(url, prama).then(data => {
        this.attributeData = this.treeToArray(data.rows)
        this.loading = false
      })
    },

    /**
     * 设置单元行类名
     */
    setClass (row, rowIndex) {
      let className = 'atrribute-row'
      if (row.row.fields) className += ' parent-row'
      if (row.row._expanded) className += ' complex-row'
      if (row.row.parent) className += ` child-row child-row-${row.row.parent.id}`
      return className
    },

    /**
     * 设置单元行行展示隐藏
     */
    setRowStyle (row) {
      const show = (row.row.parent ? row.row.parent._expanded : true)
      return show ? '' : 'display: none'
    },

    /**
     * 多层级数据转换为数组
     */
    treeToArray (data, parent = null) {
      let list = []
      Array.from(data).forEach((row, index) => {
        row._index = index + 1

        if (parent) {
          this.$set(row, 'parent', parent)
          row.index = parent._index
        }
        list.push(row)

        if (row.fields && row.fields.length > 0) {
          this.$set(row, '_expanded', true)
          const children = this.treeToArray(row.fields, row)
          list = list.concat(children)
        }

        if (this.hasData && row.is_required === '0') this.$set(row, 'isRequiredDisabled', true)
      })
      return list
    },

    /**
     * 保存
     */
    saveAttributes () {
      let attrubiteList = []
      this.attributeData.map((item) => {
        if (item.parent_id === 0) {
          attrubiteList.push(this.$pick(item, ['id', 'is_title', 'read_only', 'is_overview', 'is_search_field', 'detail_display', 'is_required']))
        } else {
          let parent = attrubiteList.find((value) => { return value.id === item.parent_id })
          parent.fields = parent.fields || []
          parent.fields.push(this.$pick(item, ['id', 'is_title', 'read_only', 'is_overview', 'is_search_field', 'detail_display', 'is_required']))
        }
      })

      let url = {
        standardId: this.query.standardid
      }
      let prama = {
        resourceId: this.resource.id,
        data: attrubiteList
      }

      this.loading = true

      this.$api.saveDistribution(url, prama).then(data => {
        this.loading = false
        this.$close()
        this.$trsModalSuccess("保存成功！")
      }, err => {
        this.loading = false
      })
    },

    /**
     * 标题单选事件
     * @param {row}
     */
    changeTitle (row) {
      this.attributeData.map((item) => {
        item.is_title = '0'
      })
      let field = this.attributeData.find((item) => { return item.id === row.id})
      this.$set(this.attributeData, field, Object.assign(field, {
        is_title: '1',
        is_overview: '1',
        detail_display: '1',
        is_required: '1'
      }))

      if (field.field_type === 'TEXT' || field.field_type === 'RICH_TEXT') field.is_search_field = '1'
    },

    /**
     * 只读
     */
    changeReadonly (check, row) {
      this.attributeData.find((item) => { return item.id === row.id}).read_only = check ? "1" : "0"
    },

    /**
     * 概览显示
     * @param {check, row}
     */
    changeOverview (check, row) {
      this.attributeData.find((item) => { return item.id === row.id }).is_overview = check ? "1" : "0"
    },

    /**
     * 概览检索
     * @param {val, row}
     */
    changeSearch (val, row) {
      let field = this.attributeData.find((item) => { return item.id === row.id})
      if (val) {
        field.is_overview = '1'
        field.is_search_field = "1"
      } else {
        field.is_search_field = "0"
      }
    },

    /**
     * 细览显示
     *
     */
    changeDetailDisplay (check, row) {
      this.attributeData.find((item) => { return item.id === row.id}).detail_display = check ? "1" : "0"
    },

    /**
     * 必填
     */
    changeRequired (check, row) {
      this.attributeData.find((item) => { return item.id === row.id }).is_required = check ? "1" : "0"
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
.attribute-setting {
  .cell {
    font-size: 14px;
    text-align: center;
  }

  thead .cell {
    color: #363d4e;
    font-weight: bold;
  }

  .el-table__empty-text a {
    color: #2a8bed;
  }
}

.atrribute-row {
  td {
    border-bottom: 0;
    border-top: 1px solid #EBEEF5;
  }

  .el-radio__input.is-disabled .el-radio__inner {
    border-color: #dcdfe6;
  }

  .el-radio__label,
  .el-checkbox__label {
    font-size: 0 !important;
    padding-left: 0;
  }

  .el-radio__input.is-checked .el-radio__inner {
    border-color: #39cb81;
    background: #39cb81;
  }

  .el-radio__inner:hover {
    border-color: #39cb81;
  }

  .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner {
    background-color: #b4ecd0;
    border-color: #b4ecd0;

    &::after {
      border-color: #fff;
    }
  }

  .dropdown-btn {
    cursor: pointer;
    position: absolute;
    z-index: 6;
    right: -10px;
    top: 50%;
    margin-top: -.5em;
    color: #bcd5f2;
  }

  &.child-row {
    td {
      padding: 8px 0;
      border-top: none;

      &:first-child {
        padding-left: 15px;

        .cell {
          font-size: 13px;
          line-height: 1em;
          text-align: left;
        }
      }
    }
  }
}

.complex-row,
.child-row {
  td {
    background-color: #F1F6FB;
  }

  &:hover td {
    background-color: #DBEBFA !important;
  }
}

.promptCursor {
  .el-radio__input.is-disabled {
    .el-radio__inner, &+span.el-radio_label {
      cursor: help;
    }
  }

  .el-checkbox__input.is-disabled {
    .el-checkbox__inner, &+span.el-checkbox__label {
      cursor: help;
    }
  }
}
</style>
