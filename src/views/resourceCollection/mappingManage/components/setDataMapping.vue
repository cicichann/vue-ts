<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="映射配置" custom-class="edit-data-map">
    <div class="data-map-card clearfix">

      <svg>
        <defs>
          <marker id="arrow-green" class="green" markerWidth="6" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L6,5 L0,10 z" />
          </marker>

          <marker id="arrow-grey" class="grey" markerWidth="6" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L6,5 L0,10 z" />
          </marker>
        </defs>
      </svg>

      <div class="table-box clearfix">
        <!-- 来源字段列表 -->
        <div class="table-item source fl">
          <h4 :title="mapping.sourceTableCnName" class="title">{{ mapping.sourceTableCnName }}</h4>
          <ul class="field">
            <li v-for="field in mapping.sourceFields" :key="field.id" :sourceId="field.id"
                :class="{'parent-field': field.fieldType === 'ARRAY' || field.fieldType === 'OBJECT', 'child-field': field.parent,
                         'normal-field': field.fieldType !== 'ARRAY' && field.fieldType !== 'OBJECT' && !field.parent}"
                class="source-field" @click="selectStartField($event, field)" @mouseenter="mouseEnter(field)" @mouseleave="mouserLeave">
              <span>
                <i :title="field.cnName" :class="{'is-required': Number(field.isRequired) === 1}" class="fl field-name">{{ field.cnName }}</i>
                <i :title="field.fieldTypeName" class="fr type-name">{{ field.fieldTypeName }}</i>
              </span>
              <!-- <div class="field-search">
                <input v-model="searchField" type="text" placeholder="输入或者点击目标字段">
                <el-select v-model="searchField" :popper-append-to-body="false" filterable popper-class="field-search-dropdown" placeholder="输入或者点击目标字段">
                  <el-option
                    v-for="item in dropFields"
                    :class="[item.mapped ? 'disable': '', 'overflow']"
                    :key="item.name"
                    :label="item.name"
                    :value="item.name"
                    @click="handleSelectChange(item)">
                  </el-option>
                </el-select>
                <div class="arrow"></div>
              </div> -->
              <div class="field-search">
                <input v-model="searchField" type="text" placeholder="输入或者点击目标字段">
                <div class="arrow"></div>
                <ul v-if="searchField">
                  <li v-if="dropFields.length === 0" class="disable">暂无数据</li>
                  <li v-for="(item, index) in dropFields" :key="index" :title="item.name"
                      :class="[item.mapped ? 'disable': '', 'overflow']" @click="handleSelectChange(item)">{{ item.name }}</li>
                </ul>
              </div>
            </li>
          </ul>
        </div>

        <!-- 映射联线遮罩 -->
        <div v-if="startField" class="mapping-mask"></div>

        <!-- 目标字段列表 -->
        <div class="table-item target fr">
          <!-- 数据表选择下拉 -->
          <el-select v-model="mapping.resourceId" :popper-append-to-body="false" filterable placeholder="请选择数据表"
                     popper-class="source-select" @change="selectResource">
            <el-option-group v-for="group in groupResList" :key="group.id" :label="group.groupName">
              <el-option v-for="item in group.resources" :key="item.id" :label="item.resource_name" :value="item.id" />
            </el-option-group>
          </el-select>
          <ul v-if="!mapping.resourceId" class="fake-ul"></ul>

          <ul v-if="mapping.uirbFields.length > 0 && mapping.resourceId" class="field">
            <li v-for="field in mapping.uirbFields" :class="{'parent-field': field.fields, 'child-field': field.parent, 'normal-field': !field.fields && !field.parent}"
                :key="field.id" :targetId="field.id" class="target-field" @click="selectEndField($event.currentTarget, field)" @mouseenter="mouseEnter(field)" @mouseleave="mouserLeave">
              <span>
                <i :title="field.cn_name || field.cnName" :data-title="field.cn_name || field.cnName"
                   :class="{'is-required': Number(field.isRequired) === 1 || field.is_required === '是'}" class="fl field-name">{{ field.cn_name || field.cnName }}</i>
                <el-tooltip v-if="field.errorInfo && field.errorInfo.length > 0" effect="dark" popper-class="type-tooltip" placement="top-start">
                  <div slot="content">
                    <p v-for="(msg, index) in field.errorInfo" :key="index">{{ msg }}</p>
                  </div>
                  <i class="fl warning-icon"></i>
                </el-tooltip>
                <i :title="field.field_type_name || field.fieldTypeName" :data-title="field.field_type_name || field.fieldTypeName"
                   class="fr type-name">{{ field.field_type_name || field.fieldTypeName || field.fieldType }}</i>
                <i class="fr delete-link" title="取消映射" @click="deleteMap(field)"></i>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 悬浮气泡提示 -->
    <transition name="suspension">
      <div v-show="showSuspension" class="suspension-tip" @mouseenter="showSuspension = true"
           @mouseleave="showSuspension = false" @click="locateTarget(suspension.target, suspension.data)">
        <span :title="suspension.name" class="fl field-name overflow">{{ suspension.name }}</span>
        <span class="fr type-name">{{ suspension.type }}</span>
        <div class="tip-angle"></div>
      </div>
    </transition>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import * as d3 from 'd3'
import { treeToArray } from '@/utils/index'

export default {
  props: {
    editItem: {
      type: Object,
      default: function () {
        return {}
      }
    },
    isSpider: {
      type: Boolean,
      default: false
    },
    mappings: {
      type: Array,
      default: function () {
        return []
      }
    }
  },

  data() {
    return {
      mapping: JSON.parse(JSON.stringify(this.editItem)),
      groupResList: [], // 数据库、数据表列表
      resourceFields: [], // 数据表字段列表
      startField: null,
      endField: null,
      suspension: {
        target: null,
        name: '',
        type: '',
        data: null
      },
      showSuspension: false,
      loading: false,
      searchField: '',
      dropFields: [], // 检索下拉字段列表
      showFieldSearch: false
    }
  },

  watch: {
    showFieldSearch (newVal) {
      if (newVal) {
        document.addEventListener('click', this.handleBlur)
      }
    },

    searchField (newVal) {
      this.dropFields = newVal ? this.mapping.uirbFields
        .filter(item => ~(item.cn_name || item.cnName).indexOf(newVal))
        .filter(item => !(item.fields && item.fields.length > 0))
        .map(field => {
          let name = field.cn_name || field.cnName
          if (field.parent) name += `(${field.parent.cn_name || field.parent.cnName})`
          return {
            name: name,
            id: field.id,
            mapped: this.mappings.some(mapping => mapping.uirbFieldId === field.id)
          }
        }) : []
    }
  },

  mounted() {
    this.querySources()
    if (this.mapping.resourceId === 0) {
      this.mapping.resourceId = ''
    }

    if (this.mapping.resourceId) {
      this.queryResourceFields()
    }
  },

  methods: {
    /**
     * 查询数据表列表
     */
    querySources() {
      this.$api.queryGroupResList({standardId: this.mapping.standardId}).then(data => this.groupResList = data)
    },

    /**
     * 获取数据表字段列表
     */
    queryResourceFields() {
      const filterAttr = ['data_sources', 'label', 'category', 'source_code', 'save_time']
      this.$api.queryStructureTableList(this.mapping).then(data => {
        this.mapping.uirbFields = treeToArray(data.rows).filter(row => !filterAttr.includes(row.en_name))
        this.initErrorInfo()
        this.reflowed()
      })
    },

    /**
     * 选中数据表
     */
    selectResource(id) {
      this.mapping.resourceId = id
      this.mappings = []
      this.searchField = ''

      if (+this.mapping.resourceId === +this.editItem.resourceId) {
        this.mapping = JSON.parse(JSON.stringify(this.editItem))
        this.mappings = this.mapping.sourceFields
          .filter((field) => {
            return !!field.mappingFieldId
          }).map(field => {
            return {sourceFieldId: field.id, uirbFieldId: field.mappingFieldId}
          })

        this.queryResourceFields()
      } else {
        this.autoDataMapping()
      }
    },

    /**
     * 初始化映射联系错误信息提示
     */
    initErrorInfo () {
      if (this.mappings.length > 0) {
        this.mappings.forEach(item => {
          let sourceField = this.mapping.sourceFields.find(field => +field.id === +item.sourceFieldId)
          let uirbField = this.mapping.uirbFields.find(field => +field.id === +item.uirbFieldId)

          if (sourceField && uirbField) uirbField.errorInfo = this.checkErrorInfo(sourceField, uirbField)
        })
      }
    },

    /**
     * 检查映射字段是否异常，返回异常信息
     */
    checkErrorInfo (sourceField, uirbField) {
      let errorInfo = []

      if (sourceField.fieldType !== uirbField.field_type) {
        errorInfo.push('源字段类型和目标字段类型不匹配')
      }
      if (sourceField.fieldType === 'TEXT' && uirbField.field_type === 'TEXT' && sourceField.length > uirbField.data_length) {
        errorInfo.push('源字段长度大于目标字段长度')
      }
      return errorInfo
    },

    /**
     * d3.js曲线绘制函数
     */
    line: d3.linkHorizontal().x(d => d.x).y(d => d.y),

    /**
     * 映射关系画图连线
     */
    reflowed() {
      this.$nextTick(() => {
        d3.selectAll('.edit-data-map path').remove()

        this.mappings.forEach((item) => {
          let mappingCard = d3.select('.edit-data-map')

          let source = {};
          let sourceNode = mappingCard.select(`li[sourceId="${item.sourceFieldId}"]`).node()
          if (!sourceNode) return
          source.x = sourceNode.offsetLeft + sourceNode.offsetWidth;
          source.y = sourceNode.offsetTop + sourceNode.offsetHeight / 2 - 34;

          let target = {};
          let targetNode = mappingCard.select(`li[targetId="${item.uirbFieldId}"]`).node()
          if (!targetNode) return
          target.x = targetNode.offsetLeft;
          target.y = targetNode.offsetTop + targetNode.offsetHeight / 2 - 34;

          mappingCard.select('svg')
            .append('path')
            .attr('d', this.line({source, target}))
            .attr('marker-end', 'url(#arrow-green)')
            .attr('sourceId', item.sourceFieldId)
            .attr('targetId', item.uirbFieldId)
        })
      })
    },

    /**
     * 选中映射起始节点
     */
    selectStartField($event, field) {
      if (field.children.length > 0) return

      // 起始节点存在映射关系
      for (let i = 0; i < this.mappings.length; i++) {
        if (+field.id === +this.mappings[i].sourceFieldId) return
      }

      d3.selectAll('.edit-data-map .table-item.source li').classed('select-active', false)
      let sourceNode = d3.select($event.currentTarget).classed('select-active', true).node()

      this.startField = {}
      this.startField.x = sourceNode.offsetLeft + sourceNode.offsetWidth;
      this.startField.y = sourceNode.offsetTop + sourceNode.offsetHeight / 2 - 34;
      this.startField.field = field
      this.showFieldSearch = true
    },

    /**
     * 选中映射目标节点
     */
    selectEndField(target, field) {
      // 未选择初始节点或选择了复合字段父字段
      if (!this.startField || (field.fields && field.fields.length > 0)) return

      // 目标节点存在映射关系
      for (let i = 0; i < this.mappings.length; i++) {
        if (+field.id === +this.mappings[i].uirbFieldId) return
      }

      let targetNode = d3.select(target).node()
      this.endField = {};
      this.endField.x = targetNode.offsetLeft;
      this.endField.y = targetNode.offsetTop + targetNode.offsetHeight / 2 - 34;
      this.endField.field = field

      d3.select('.edit-data-map svg')
        .append('path')
        .attr('d', this.line({source: this.startField, target: this.endField}))
        .attr('marker-end', 'url(#arrow-green)')
        .attr('sourceId', this.startField.field.id)
        .attr('targetId', this.endField.field.id)

      field.errorInfo = this.checkErrorInfo(this.startField.field, this.endField.field)
      this.mappings.push({sourceFieldId: this.startField.field.id, uirbFieldId: this.endField.field.id})
      this.$forceUpdate()

      d3.selectAll('.edit-data-map .table-item.source li').classed('select-active', false)
      this.startField = null
      this.endField = null
    },

    /**
     * 鼠标移入，映射关联节点、连线高亮，其余连线置灰，关联节点不可见时悬浮展示
     * @param item
     * @param field
     */
    mouseEnter(field) {
      let mappingBox = d3.select('.edit-data-map')
      let selector = d3.select(event.target).classed('source-field')
                      ? `path[sourceId="${field.id}"]`
                      : `path[targetId="${field.id}"]`
      let activePath = mappingBox.select(selector)

      let liTarget = d3.select(event.target)

      if (!activePath.node()) return;

      let liSource = liTarget.classed('source-field') ?
        mappingBox.select(`li[targetId="${activePath.attr('targetId')}"]`)
        : mappingBox.select(`li[sourceId="${activePath.attr('sourceId')}"]`)

      let suspensionData = null
      if (liTarget.classed('source-field')) {
        suspensionData = this.mapping.uirbFields.find(field => +field.id === +liSource.attr('targetId'))
      } else {
        suspensionData = this.mapping.sourceFields.find(field => +field.id === +liSource.attr('sourceId'))
      }

      // 更新及显示悬浮层信息
      this.updateTipPosition(suspensionData, liSource)

      this.$nextTick(() => {
        document.querySelector('.el-dialog__body').addEventListener('scroll', this.hiddenSuspension)
      })

      // 高亮当前连线节点
      liSource.classed('active', true)
      liTarget.classed('active', true)
    },

    /**
     * 鼠标移出，重置连线样式
     */
    mouserLeave() {
      let liTarget = d3.select(event.target)
      liTarget.selectAll('span i').each(function () {
        d3.select(this).attr('title', d3.select(this).attr('data-title'))
      })

      d3.selectAll('.edit-data-map path[sourceId][targetId]').classed('grey', false).attr('marker-end', 'url(#arrow-green)');
      d3.selectAll('.edit-data-map .data-map-card li').classed('active', false)

      this.showSuspension = false
    },

    /**
     * 更新悬浮提示位置
     * @param {Object} data 对应映射字段数据
     * @param {Object} target 对应映射字段DOM信息
     */
    updateTipPosition (data, target) {
      if (!target) {
        this.showSuspension = false
        return
      }

      const boxWrapScrollTop = d3.select('.el-dialog__body').node().scrollTop
      const targetLiOffsetTop = target.node().offsetTop
      const tip = d3.select('.suspension-tip')

      if (targetLiOffsetTop - boxWrapScrollTop > 500 || targetLiOffsetTop + 38 < boxWrapScrollTop) {
        // 悬浮层显示信息
        this.suspension.target = target
        this.suspension.data = data
        this.suspension.type = data.fieldTypeName || data.field_type_name
        this.suspension.name = data.parent ? 
          (`${data.cnName || data.cn_name}(${data.parent.cnName || data.parent.cn_name})`)
          : (data.cnName || data.cn_name)

        // 悬浮层位置
        tip.style('left', target.classed('source-field') ? '30px' : '642px')
          .style('top', targetLiOffsetTop - boxWrapScrollTop > 500 ? '512px' : '80px')

        // 尖角方向
        tip.select('.tip-angle')
          .style('transform', targetLiOffsetTop - boxWrapScrollTop > 500 ? 'rotateZ(180deg)' : 'none')
          .style('top', targetLiOffsetTop - boxWrapScrollTop > 500 ? '38px' : '-30px')

        this.showSuspension = true
      } else {
        this.showSuspension = false
      }
    },

    hiddenSuspension () {
      this.showSuspension = false
      document.querySelector('.el-dialog__body').removeEventListener('scroll', this.hiddenSuspension)
    },

    /**
     * 浮层滚动定位
     */
    locateTarget (target, data) {
      if (!target || !data) return

      let curScroll = document.querySelector('.el-dialog__body').scrollTop
      let scrollHeight = (target.classed('source-field') ? this.mapping.sourceFields : this.mapping.uirbFields)
          .findIndex(field => +field.id === +(data.id)) * 38

      // 消除误差，滚动更顺滑精准
      if (scrollHeight > curScroll) {
        scrollHeight -= 428
      } else {
        scrollHeight += 25
      }

      const distance = scrollHeight - curScroll

      let interval = setInterval(() => {
        if ((curScroll >= scrollHeight && distance > 0) || (curScroll <= scrollHeight && distance < 0)) {
          this.showSuspension = false
          clearInterval(interval)
        } else {
          curScroll += distance / 30
          document.querySelector('.el-dialog__body').scrollTop = curScroll
        }
      }, 10)
    },

    handleSelectChange (item) {
      if (!item.mapped) {
        this.searchField = ''
        let target = document.querySelector(`.edit-data-map .target li[targetId="${item.id}"]`)
        this.selectEndField(target, this.mapping.uirbFields.find(field => field.id === item.id))
      }
    },

    handleBlur (event) {
      if (event.target.className === 'mapping-mask') {
        d3.selectAll('.edit-data-map .table-item.source li').classed('select-active', false)
        this.startField = null
        this.showFieldSearch = false
        this.searchField = ''
        document.removeEventListener('click', this.handleBlur)
      }
    },

    /**
     * 取消映射连线
     */
    deleteMap(field) {
      event.stopPropagation()

      d3.select(`.edit-data-map path[targetId="${field.id}"]`).remove()

      field.errorInfo = []
      this.$forceUpdate()

      for (let i = 0; i < this.mappings.length; i++) {
        if (+field.id === +this.mappings[i].uirbFieldId) {
          this.mappings.splice(i, 1)
          return
        }
      }
    },

    /**
     * 自动映射
     */
    autoDataMapping() {
      this.$api.queryStructureTableList(this.mapping).then(data => {
        const filterAttr = ['data_sources', 'label', 'category', 'source_code', 'save_time']
        this.mapping.uirbFields = treeToArray(data.rows).filter(row => !filterAttr.includes(row.en_name))

        // 根据中文名自动映射
        this.mapping.uirbFields.filter(field => field.parent).forEach(field => {
          this.mappingField(this.getSourceField(field, 'cnName', 'cn_name'), field)
        })
        this.mapping.uirbFields.filter(field => !(field.parent)).forEach(field => {
          this.mappingField(this.getSourceField(field, 'cnName', 'cn_name'), field)
        })

        // 根据英文名自动映射
        this.mapping.uirbFields
          .filter(field => field.parent && !this.mappings.some(mapping => mapping.uirbFieldId === field.id))
          .forEach(field => {
            this.mappingField(this.getSourceField(field, 'enName', 'en_name'), field)
          })
        this.mapping.uirbFields
          .filter(field => !(field.parent) && !this.mappings.some(mapping => mapping.uirbFieldId === field.id))
          .forEach(field => {
            this.mappingField(this.getSourceField(field, 'enName', 'en_name'), field)
          })

        this.reflowed()
      })
    },

    mappingField (sourceField, uirbField) {
      if (sourceField && !this.mappings.some(mapping => mapping.sourceFieldId === sourceField.id) && !uirbField.fields) {
        uirbField.errorInfo = this.checkErrorInfo(sourceField, uirbField)
        this.mappings.push({sourceFieldId: sourceField.id, uirbFieldId: uirbField.id})
      }
    },

    /**
     * 根据目标字段查询同名源字段
     */
    getSourceField (field, sourceAttr, targetAttr) {
      let sourceField = this.mapping.sourceFields.find(sourceField => sourceField[sourceAttr]=== field[targetAttr])

      if (field.parent) {
        let fieldInComplex = this.mapping.sourceFields.find(sourceField => {
          return sourceField.parent && sourceField.parent[sourceAttr] === field.parent[targetAttr] && sourceField[sourceAttr] === field[targetAttr]
        })

        if (fieldInComplex) sourceField = fieldInComplex
      }
      return sourceField
    },

    /**
     * 新建映射关系
     */
    addDataMapping() {
      let url = this.$pick(this.mapping, ['standardId', 'dataSourceId', 'resourceId'])
      let params = {
        resourceId: this.mapping.resourceId,
        mappings: JSON.stringify(this.mappings),
        fromTableId: this.mapping.sourceTableId
      }

      this.loading = true
      this.$api.addDataMapping(url, params).then(() => {
        this.$close()
        this.$trsModalSuccess('新建映射关系成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 修改映射关系
     */
    modifyDataMapping() {
      let url = this.$pick(this.mapping, ['standardId', 'dataSourceId', 'sourceId'])
      let params = {
        resourceId: this.mapping.resourceId,
        mappings: JSON.stringify(this.mappings),
        fromTableId: this.mapping.sourceTableId
      }

      this.loading = true
      this.$api.modifyDataMapping(url, params).then(() => {
        this.$close()
        this.$trsModalSuccess('修改映射关系成功！')
      }, () => {
        this.loading = false
      })
    },

    /**
     * 点击确认按钮
     */
    confirm() {
      // 是否有资源库必填字段未映射
      let requiredMapping = this.mapping.uirbFields.filter(item => {
        return (Number(item.isRequired) === 1 || item.is_required === '是')
          && !this.mappings.some(mapping => {return Number(mapping.uirbFieldId) === Number(item.id)})
      })
      if (requiredMapping.length > 0){
        this.$trsModalErrorDialog({
          msg: '有必填字段未映射',
          title: '操作失败'
        })
        return
      }

      if (this.editItem.resourceId) {
        this.modifyDataMapping()
      } else {
        this.addDataMapping()
      }
    }
  }
}
</script>

<style lang="scss">
.edit-data-map {
  width: 1000px;
  .el-dialog__body {
    min-height: 360px;
    max-height: 500px;
  }

  .data-map-card {
    width: 100%;
    padding: 0;
    border: none;

    svg {
      top: 34px;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }

  .fake-ul {
    width: 100%;
    height: 290px;
    border: 1px solid #E6EBEF;
    border-top: none;
  }

  .data-map-card .table-item {
    width: 320px;
  }

  .data-map-card .field li.select-active {
    background-color: #4BD083;
    color: #fff;
    i.type-name {
      color: #fff;
    }
  }

  .data-map-card .field li i.field-name {
    max-width: 185px !important;

    &.is-required::before {
      content: '*';
      margin-right: 4px;
      color: #f56c6c;
    }
  }

  .data-map-card .field li i.type-name {
    width: 80px;
    margin-right: 10px;
    color: #A9ADB2;
    text-align: right;
    font-size: 11px;
    font-style: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .data-map-card .source .field li {
    &:hover, &.active {
      i.type-name {
        color: #fff;
      }
      &.parent-field i.type-name {
        color: #A9ADB2;
      }
    }
  }

  .data-map-card .table-item.target .field li.normal-field,
  .data-map-card .table-item.target .field li.child-field {
    &:hover {
      border-color: #4BD083;
      background: transparent;

      .field-name {
        color: #4BD083;
      }
    }

    &.active {
      background-color: #4BD083;
      color: #fff;
      i.type-name {
        color: #fff;
      }
      i.field-name {
        color: #fff;
      }
    }

    &.active:hover {
      i.type-name {
        display: none;
      }
      i.delete-link {
        display: inline-block;
      }
    }
  }

  .mapping-mask {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 320px;
    right: 320px;
    background-color: rgba(255, 255, 255, .8);
  }

  .table-item.source .field-search {
    display: none;
    position: absolute;
    left: 330px;
    top: 0;
    width: 150px;
  }

  .table-item.source .select-active .field-search {
    display: block;
  }

  .field .field-search {
    line-height: 0;

    input {
      height: 30px;
      line-height: 30px;
      padding: 0 5px;
      border: 0;
      font-size: 12px;
      color: #333333;
      outline: 0;
      background: transparent;
    }

    .arrow {
      position: relative;
      border-bottom: 1px solid #39cb81;

      &::after {
        content: '';
        position: absolute;
        right: -10px;
        top: -4px;
        width: 0;
        height: 0;
        border: 5px solid transparent;
        border-left-color: #39cb81;
      }
    }

    ul {
      max-height: 200px;
      margin-top: 10px;
      padding: 10px 0;
      border: 1px solid #E5E9EE;
      border-radius: 3px;
      background-color: #ffffff;
      overflow: auto;
    }

    ul li {
      height: 30px;
      line-height: 30px;
      padding: 0 15px;
      border: 0;
      color: #333333;
      font-size: 12px;

      &:hover {
        background-color: #F1F6FB;
        color: #333333;
      }

      &.disable {
        color: #bbbbbb;
        cursor: not-allowed;
      }

      &.disable:hover {
        background-color: #ffffff;
      }
    }
  }

  .source-select {
    position: absolute !important;
  }

  .el-select, .el-input {
    width: 100%;
  }
  .el-input, .el-input input {
    height: 34px;
    line-height: 34px;
    color: #4A8EFD;
    border-color: #E5EBF6;
    background-color: #F6FAFD;
  }
  .el-select:hover .el-input__inner {
    border-color: #E5EBF6;
  }

  /* 悬浮项 */
  .suspension-tip {
    position: absolute;
    top: 80px;
    width: 320px;
    height: 38px;
    line-height: 38px;
    background-color: #4BD083;
    color: #fff;
    z-index: 100;
    cursor: pointer;

    .field-name {
      max-width: 200px;
      padding-left: 20px;
      white-space: nowrap;
    }

    .type-name {
      width: 80px;
      margin-right: 20px;
      text-indent: 10px;
      text-align: right;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tip-angle {
      position: absolute;
      top: -30px;
      width: 0;
      height: 0;
      border: 160px solid transparent;
      border-top: 15px solid #4BD083;
      border-bottom: 15px solid #4BD083;
      border-top-color: transparent;
    }

    &:hover {
      opacity: 1;
    }
  }

  .suspension-leave-active {
    transition: opacity 1.2s;
  }

  .suspension-leave-to {
    opacity: 0;
  }
}

.select-source {
  width: 195px;
}

.el-select-group__title {
  color: #A9ADB2;
  font-size: 13px;
}
.el-select-group__wrap:not(:last-of-type) {
  padding-bottom: 0;

  &::after {
    display: none;
  }
}
</style>
