<template>
  <div class="uirb-preview-content">
    <div v-if="ifHeaderShow" class="header-section expand-header">
      <!-- 所属分类字段 -->
      <div v-if="sysColums['category']" class="header-label clearfix">
        <p class="fl">所属分类：</p>
        <category-select v-if="$checkRight('intel.view.changeCategory')" :categories="documentData.category"/>
        <span v-else>{{ documentCategory || '无' }}</span>
      </div>

      <!-- 所属标签字段 -->
      <div v-if="sysColums['label']" class="header-label clearfix">
        <p class="fl">所属标签：</p>
        <label-select v-if="$checkRight('intel.view.changeLabel')" :labels="documentData.label"/>
        <span v-else>{{ documentLabel || '无' }}</span>
      </div>

      <!-- 其他系统默认字段 -->
      <span class="overflow clearfix header-other">
        <span v-if="sysColums['data_sources'] && documentData.data_sources_url" class="header-span">数据来源：
          <a :href="documentData.data_sources_url" target="_blank">{{ documentData.data_sources || '无' }}</a>
        </span>
        <span v-if="sysColums['data_sources'] && !documentData.data_sources_url" class="header-span">数据来源：{{ documentData.data_sources || '无' }}</span>
        <span v-if="sysColums['source_code']" class="header-span">资源编码：{{ documentData.source_code || '无' }}</span>
        <span v-if="sysColums['save_time']" class="header-span">入库时间：{{ documentData.save_time | time }}</span>
        <span v-if="sysColums['create_user']" class="header-span">{{ sysColums['create_user_desc'] }}：{{ documentData.create_user }}</span>
        <span v-if="sysColums['create_time']" class="header-span">{{ sysColums['create_time_desc'] }}：{{ documentData.create_time | time }}</span>
        <span v-if="sysColums['publish_user']" class="header-span">{{ sysColums['publish_user_desc'] }}：{{ documentData.publish_user }}</span>
        <span v-if="sysColums['publish_time']" class="header-span">{{ sysColums['publish_time_desc'] }}：{{ documentData.publish_time | time }}</span>
        <span v-if="sysColums['update_user']" class="header-span">{{ sysColums['update_user_desc'] }}：{{ documentData.update_user }}</span>
        <span v-if="sysColums['update_time']" class="header-span">{{ sysColums['update_time_desc'] }}：{{ documentData.update_time | time }}</span>
      </span>
    </div>

    <div v-loading="loading" v-if="Object.keys(documentData).length > 0" class="content-section" element-loading-text="数据加载中...">
      <!-- 标题 -->
      <h1 class="content-title" v-html="documentData[titleField]"></h1>

      <template v-for="field in fieldData">
        <!-- 富文本 -->
        <section v-if="field.field_type === 'RICH_TEXT'" :key="field.id" class="rich-content">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content clearfix" v-html="filterHtml(documentData[field.en_name])"></div>
        </section>

        <!-- 普通文本 -->
        <section v-if="field.field_type === 'TEXT'" :key="field.id" class="text">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <p>{{ filterText(documentData[field.en_name]) }}</p>
          </div>
        </section>

        <!-- 数值 -->
        <section v-if="field.field_type === 'NUMERICAL'" :key="field.id" class="number">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <p>{{ documentData[field.en_name] }}</p>
          </div>
        </section>

        <!-- 时间 -->
        <section v-if="field.field_type === 'DATE'" :key="field.id" class="text">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <p>{{ documentData[field.en_name] | time }}</p>
          </div>
        </section>

        <!-- 单选框 -->
        <section v-if="field.field_type === 'RADIO'" :key="field.id" class="radio">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <el-radio v-for="item in field.enum_value" v-model="documentData[field.en_name]" :key="item.id" :label="item.id" disabled>{{ item.desc }}</el-radio>
          </div>
        </section>

        <!-- 复选框 -->
        <section v-if="field.field_type === 'CHECK'" :key="field.id" class="checkbox">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <el-checkbox v-for="item in field.enum_value" v-model="documentData[field.en_name]" :key="item.id" :label="item.id" disabled>{{ item.desc }}</el-checkbox>
          </div>
        </section>

        <!-- 下拉 -->
        <section v-if="field.field_type === 'SELECT'" :key="field.id" class="dropdown">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <el-select v-model="documentData[field.en_name]" disabled></el-select>
          </div>
        </section>

        <!-- 附件 -->
        <section v-if="field.field_type === 'APPENDIX'" :key="field.id" class="attach-file">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <appendix :list="documentData[field.en_name]" />
          </div>
        </section>

        <!-- 对象 -->
        <section v-if="field.field_type === 'OBJECT'" :key="field.id" class="object">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <composite-field :field="field" :document-data="documentData" />
          </div>
        </section>

        <!-- 数组 -->
        <section v-if="field.field_type === 'ARRAY'" :key="field.id" class="array">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <composite-field :field="field" :document-data="documentData" />
          </div>
        </section>

        <!-- 关联表 -->
        <section v-if="field.field_type === 'RELATEDTABLE'" :key="field.id" class="related-table">
          <div class="uirb-title">{{ field.cn_name }}</div>
          <div class="content">
            <ul>
              <li v-for="(item, index) in filterTable(documentData[field.en_name])" :key="index">
                <a v-if="item.dataId" :href="'#/ai/preview/?standardid=' + item.standardId + '&resourceid=' + item.resourceId + '&dataid=' + item.dataId" target="_blank">{{ item.title }}</a>
                <span v-else title="数据未接入资源库">{{ item.title }}</span>
              </li>
            </ul>
          </div>
        </section>
      </template>
    </div>

  </div>
</template>

<script>
import fecha from 'fecha'
import appendix from './components/appendix.vue'
import compositeField from './components/compositeField.vue'
import categorySelect from './components/categorySelect.vue'
import labelSelect from './components/labelSelect.vue'

export default {
  name: 'preview-document',

  components: {
    appendix,
    compositeField,
    categorySelect,
    labelSelect
  },

  filters: {
    time(value) {
      if (!value) return ''

      return fecha.format(+value, 'YYYY-MM-DD HH:mm:ss')
    }
  },

  data() {
    return {
      loading: false,
      documentData: {}, // 文档信息
      fieldData: [], // 文档所有字段信息
      titleField: '',  // 标题字段
      sysColums: {}, // 系统默认字段
      ifHeaderShow: false
    }
  },

  computed: {
    documentCategory () {
      return this.documentData.category.map(category => category.category_name).join(',')
    },
    documentLabel () {
      return this.documentData.label.map(label => label.label).join(',')
    }
  },

  created() {
    this.queryDocumentData().then(() => {
      this.queryFieldData()
    })
  },

  methods: {
    /**
     * 查询文档数据信息
     */
    queryDocumentData() {
      return new Promise((resolve, reject) => {
        this.loading = true
        const { standardid, resourceid, dataid } = this.$route.query
        this.$api.queryDocDataById({ standardid, resourceid, dataid }).then((data) => {
          this.loading = false
          this.documentData = data
          resolve()
        }, (err) => {
          document.addEventListener('click', this.closeBtnClick)
        })
      })
    },

    /**
     * 查询所有的字段列表信息
     */
    queryFieldData() {
      this.loading = true
      const { standardid, resourceid } = this.$route.query
      this.$api.queryDocFieldData({standardid, resourceid }).then((data) => {
        let filterItem = ['label', 'category', 'data_sources', 'source_code', 'save_time', 'create_user', 'create_time', 'publish_user', 'publish_time', 'update_user', 'update_time']
        let filterType = ['ARRAY', 'OBJECT']

        this.fieldData = data.rows
        this.fieldData.forEach(field => {
          // 标题
          if (field.is_title === '1') this.titleField = field.en_name

          // 枚举值json解析
          if (field.enum_value) {
            field.enum_value = JSON.parse(field.enum_value)
            for (let item of field.enum_value) {
              item.id = item.id.toString()
            }

            // 复选框
            if (field.field_type === 'CHECK' && this.documentData[field.en_name]) {
              this.documentData[field.en_name] = this.documentData[field.en_name].split(',')
            }

            // 下拉框
            if (field.field_type === 'SELECT') {
              for (let item of field.enum_value) {
                if (item.id === this.documentData[field.en_name]) {
                  this.documentData[field.en_name] = item.desc
                }
              }
            }
          }
        })

        // 过滤细览不显示字段、系统默认字段、标题字段
        this.fieldData = data.rows.filter(row => {
          return (row.detail_display === '1' && filterItem.indexOf(row.en_name) === -1 && row.is_title !== '1') || filterType.indexOf(row.field_type) >= 0
        })

        // 提取系统默认字段，并判断是否在头部显示
        filterItem.forEach(item => {
          this.sysColums[item] = data.rows.some(row => row.en_name === item && row.detail_display === '1')
          this.sysColums[item + '_desc'] = data.rows.find(row => row.en_name === item) ? data.rows.find(row => row.en_name === item).cn_name : ''
        })

        this.loading = false

        this.$nextTick(() => {
          Array.prototype.map.call(document.querySelectorAll('.insertfileTag a'), function(item, index, arr) {
            item.setAttribute('target', '_black')
          })

          // 系统默认字段均没有设置细览显示，头部隐藏
          this.ifHeaderShow = Object.keys(this.sysColums).length === 0 || Object.values(this.sysColums).indexOf(true) > -1

          if (this.ifHeaderShow) this.scrollToContent()
        })
      }, () => {
        this.loading = false
      })
    },

    /**
     * 头部默认字段滚动
     */
    scrollToContent () {
      this.$nextTick(() => {
        const headerHeight = document.querySelector('.header-section').clientHeight + 22
        document.querySelector('.main-container').scrollTop = 0

        setTimeout(() => {
          let time = 0
          let interval = setInterval(() => {
            if (time > 300) {
              clearInterval(interval)
            } else {
              const a = headerHeight / Math.pow(150, 2)
              const x = time < 150 ? (a * time * time) / 2 : (headerHeight - a * (300 - time) * (300 - time) / 2)
              document.querySelector('.main-container').scrollTop = x
            }
            time += 10
          }, 10)
        }, 500)
      })
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
        // value = value.replace(/<([^>]+)><\/\w+>/g, '') // 过滤空标签
        return value
      } else return ''
    },

    /* 普通文本过滤 */
    filterText (value) {
      return value ? value.replace(/&nbsp;/g, ' ') : ''
    },
    
    /**
     * 关联表字段
     */
    filterTable (value) {
      return value && typeof(value) === 'string' ? JSON.parse(value) : value
    },

    /**
     * 监听弹窗按钮关闭事件
     */
    closeBtnClick (event) {
      if (!event.target.className) return
      if (event.target.className.indexOf('el-dialog__headerbtn') > -1 || event.target.className.indexOf('el-dialog__close') > -1) {
        document.removeEventListener('click', this.closeBtnClick)
        this.close()
      }
    },

    /**
     * 关闭预览页面
     */
    close() {
      window.close()
    }
  }
}
</script>

<style lang="scss">

</style>
