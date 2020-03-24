<template>
  <div class="table-frame">
    <!-- 数组 -->
    <div v-if="field.field_type === 'ARRAY'">
      <table>
        <colgroup>
          <col v-for="item in field.fields" :key="item.id" :width="colWidth(item)">
        </colgroup>
        <thead>
          <tr>
            <td v-for="item in field.fields" :key="item.id">{{ item.cn_name }}</td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(data, index) in documentData[field.en_name]" :key="index">
            <td v-for="item in field.fields" :key="item.id">
              <template v-if="item.field_type === 'RADIO'">
                <el-radio v-for="value in JSON.parse(item.enum_value)" v-model="data[item.en_name]" :key="value.id"
                          :label="value.id.toString()" disabled>{{ value.desc }}</el-radio>
              </template>
              <template v-else-if="item.field_type === 'CHECK'">
                <el-checkbox v-for="value in JSON.parse(item.enum_value)" v-model="data[item.en_name]" :key="value.id"
                             :label="value.id.toString()" disabled>{{ value.desc }}</el-checkbox>
              </template>
              <template v-else-if="item.field_type === 'SELECT'">
                <el-select v-model="data[item.en_name]" disabled />
              </template>
              <template v-else-if="item.field_type === 'APPENDIX'">
                <appendix :list="data[item.en_name]" />
              </template>
              <div v-else v-html="tdContent(item, data[item.en_name])"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 对象 -->
    <table v-if="field.field_type === 'OBJECT'">
      <tr v-for="item in field.fields" :key="item.id">
        <td class="field-name">{{ item.cn_name }}</td>
        <td>
          <template v-if="item.field_type === 'RADIO'">
            <el-radio v-for="value in JSON.parse(item.enum_value)" v-model="documentData[field.en_name][item.en_name]" :key="value.id"
                      :label="value.id.toString()" disabled>{{ value.desc }}</el-radio>
          </template>
          <template v-else-if="item.field_type === 'CHECK'">
            <el-checkbox v-for="value in JSON.parse(item.enum_value)" v-model="documentData[field.en_name][item.en_name]" :key="value.id"
                         :label="value.id.toString()" disabled>{{ value.desc }}</el-checkbox>
          </template>
          <template v-else-if="item.field_type === 'SELECT'">
            <el-select v-model="documentData[field.en_name][item.en_name]" disabled />
          </template>
          <template v-else-if="item.field_type === 'APPENDIX'">
            <appendix :list="documentData[field.en_name][item.en_name]" />
          </template>
          <div v-else v-html="tdContent(item, documentData[field.en_name] ? documentData[field.en_name][item.en_name] : '')"></div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import fecha from 'fecha'
import appendix from './appendix.vue'

export default {
  name: "compisiteField",

  components: {
    appendix
  },

  props: {
    field: {
      type: Object,
      required: true
    },
    documentData: {
      type: Object,
      required: true
    }
  },

  mounted () {
    this.initData()
  },

  methods: {
    /**
     * 初始化数据
     */
    initData () {
      let field = this.field
      field.fields.map(item => {
        if (item.field_type === 'SELECT') {
          this.selectTransform(JSON.parse(item.enum_value), field.en_name + '>' + item.en_name, field)
        }

        if (item.field_type === 'CHECK') {
          if (field.field_type === 'ARRAY') {
            this.documentData[field.en_name].map(value => {
              value[item.en_name] = value[item.en_name].split(',')
            })
          } else {
            this.documentData[field.en_name][item.en_name] = this.documentData[field.en_name][item.en_name].split(',')
          }
        }
      })
    },

    /**
     * 下拉默认值转换
     */
    selectTransform (enumList, name, field) {
      for (let item of enumList) {
        let nameLevel = name.split('>')
        if (field.field_type === 'ARRAY') {
          let list = this.documentData[nameLevel[0]]
          for (let value of list) {
            if (item.id.toString() === value[nameLevel[1]]) {
              value[nameLevel[1]] = item.desc
            }
          }
        } else {
          let value = this.documentData[nameLevel[0]][nameLevel[1]]
          if (item.id.toString() === value) {
            this.documentData[nameLevel[0]][nameLevel[1]] = item.desc
          }
        }
      }
    },

    /**
     * 动态计算列宽
     * @param {Object} 子字段
     */
    colWidth (field) {
      let width
      let type = field.field_type
      if ( type === 'NUMERICAL') {
        width = 160
      } else if (type === 'DATE') {
        width = 200
      } else if (type === 'RICH_TEXT') {
        width = 400
      } else {
        width = 280
      }
      return width
    },

    /**
     * 复合字段单元格
     */
    tdContent (item, value) {
      let type = item.field_type
      if (type === 'TEXT') {
        return `<p>${ this.filterText(value) }</p>`
      } else if (type === 'NUMERICAL') {
        return `<p>${ value || value === 0 ? value : '' }</p>`
      } else if (type === 'DATE') {
        return value ? `<p>${ fecha.format(+value, 'YYYY-MM-DD HH:mm:ss') }</p>` : ``
      } else if (type === 'RICH_TEXT') {
        return `<div class="rich-content">${ this.filterHtml(value) }</div>`
      }
      return value
    },

    /* 普通文本过滤 */
    filterText (value) {
      if (value) {
        return value.replace(/&nbsp;/g, ' ')
      } else return ''
    },

    /* 富文本过滤 */
    filterHtml (value) {
      if (value) {
        value = value.replace(/(( style=")([^"]*)(text-align:\s*\w+)([^"]*))/g, '$2$4') // 过滤包含text-align行内样式的style中的其他样式
        value = value.replace(/(( style=")(?!text-align:)([^"]*))/g, '$2') // 过滤不含text-align的style属性
        value = value.replace(/&nbsp;/g, '')
        value = value.replace(/\s*\n/g, '<br/>')
        value = value.replace(/\s+</g, '<') // 过滤标签前的空格
        value = value.replace(/><br>\s*<\//g, '></') // 过滤空标签中的<br>
        return value
      } else return ''
    }
  }
}
</script>
