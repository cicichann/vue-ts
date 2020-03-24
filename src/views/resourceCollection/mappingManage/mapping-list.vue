<template>
  <div class="content-container">

    <div class="sub-nav">
      <button v-access="'aggr.mappingmgt.config'" v-if="isSpider" class="edit-btn add-btn" @click="editSpiderTable({})">新增表</button>
      <div class="fr">
        <el-input
          v-model="tempSearchText"
          placeholder="请输入表名检索"
          @keyup.enter.native="searchText = tempSearchText.trim()">
          <i slot="suffix" class="input-icon" @click="searchText = tempSearchText.trim()"/>
        </el-input>
      </div>
    </div>

    <!-- 主体 -->
    <div v-loading="loading" :class="{'uirb-no-data': (mappings.length === 0 && !loading)}"
         element-loading-text="数据加载中..." class="table-content">

      <water-fall ref="waterfall" :line-gap="510" :min-line-gap="500" :max-line-gap="700" :fixed-height="true" :watch="mappings" @reflowed="reflowed">

        <!-- 瀑布流卡片项 -->
        <water-fall-slot v-for="(item, index) in mappings" :width="510" :height="60 + 34 + Math.max(item.sourceFields.length, item.uirbFields.length) * 38"
                         :order="index" :key="item.index" :class="['mappingId-'+item.sourceTableId]" move-class="item-move">

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
                <h4 :title="item.sourceTableCnName" class="title">{{ item.sourceTableCnName }}</h4>

                <!-- 配置按钮 -->
                <span v-if="!isSpider" class="operate el-dropdown">
                  <i v-access="'aggr.mappingmgt.config'" title="映射配置" class="setting-icon" @click="editDataMap(item)"></i>
                </span>
                <el-dropdown v-access="'aggr.mappingmgt.config'" v-else class="operate" trigger="click" placement="bottom" @visible-change="handleDropChange">
                  <span>
                    <i class="setting-icon"></i>
                  </span>
                  <el-dropdown-menu slot="dropdown" class="setting-popover">
                    <el-dropdown-item><p @click="editDataMap(item)">配置</p></el-dropdown-item>
                    <el-dropdown-item><p @click="editSpiderTable(item)">编辑</p></el-dropdown-item>
                    <el-dropdown-item><p @click="deleteSpiderTable(item)">删除</p></el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>

                <ul class="field">
                  <li v-for="field in item.sourceFields" :key="field.id" :sourceId="field.id"
                      :class="{'parent-field': (field.fieldType === 'ARRAY' || field.fieldType === 'OBJECT') && !field.parent, 'child-field': field.parent,
                               'normal-field': !field.fields && !field.parent}" class="source-field" @mouseenter="mouseEnter(item, field)" @mouseleave="mouserLeave">
                    <span :title="field.cnName" :class="{'is-required': Number(field.isRequired) === 1}" class="field-name">{{ field.cnName }}</span>
                  </li>
                </ul>
              </div>

              <!-- 目标字段列表 -->
              <div v-if="item.uirbFields.length > 0" class="table-item target fr">
                <h4 :title="item.uirbTableCnName" class="title">{{ item.uirbTableCnName }}</h4>

                <i v-access="'aggr.mappingmgt.removeAll'" class="delete-mapping" title="解除映射" @click="clearMapping(item)"></i>

                <ul class="field">
                  <li v-for="field in item.uirbFields" :key="field.id" :targetId="field.id"
                      :class="{'parent-field': (field.fieldType === 'ARRAY' || field.fieldType === 'OBJECT') && !field.parent, 'child-field': field.parent,
                               'normal-field': !field.fields && !field.parent}" class="target-field" @mouseenter="mouseEnter(item, field)" @mouseleave="mouserLeave">
                    <span>
                      <i :class="{'is-required': Number(field.isRequired) === 1}" :title="field.cnName" class="fl field-name">{{ field.cnName }}</i>

                      <el-tooltip v-if="field.errorInfo && field.errorInfo.length > 0" effect="dark" popper-class="type-tooltip" placement="top-start">
                        <div slot="content">
                          <p v-for="(msg, index) in field.errorInfo" :key="index">{{ msg }}</p>
                        </div>
                        <i class="fl warning-icon"></i>
                      </el-tooltip>
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </water-fall-slot>

      </water-fall>
    </div>

    <!-- 版本信息 -->
    <edition/>
  </div>
</template>

<script>
import * as d3 from 'd3'
import waterFall from './components/waterfall'
import waterFallSlot from './components/waterfall-slot'
import edition from '@/views/common/footer/footer.vue'
import setDataMapDialog from './components/setDataMapping'
import editSpiderTableDialog from './components/editSpiderTable'
import eventBus from '@/utils/eventBus'

import { treeToArray } from '@/utils/index'

export default {

  components: {
    waterFall,
    waterFallSlot,
    edition,
    eventBus
  },

  data() {
    return {
      loading: true,
      mappingList: [],  // 映射关系列表
      isCheckMapping: false,
      searchText: '',
      tempSearchText: '',
      timer: null
    }
  },

  computed: {
    isSpider () {
      return this.$route.query.spider && this.$route.query.spider.toString() === 'true'
    },

    mappings () {
      return this.mappingList.filter(mapping => {
        return mapping.sourceTableCnName.indexOf(this.searchText) > -1
        || mapping.sourceTableEnName.indexOf(this.searchText) > -1
        || mapping.uirbTableCnName.indexOf(this.searchText) > -1
        || mapping.uirbTableEnName.indexOf(this.searchText) > -1
      })
    }
  },

  watch: {
    '$route'(value) {
      if (!this.$route.query.datasourceid) {
        if (typeof this.$route.query.spider !== 'undefined') {
          this.loading = false
        }
        return
      }
      this.tempSearchText = ''
      this.searchText = ''
      this.queryMappingData()
    }
  },

  mounted() {
    if (!this.$route.query.datasourceid) return
    this.queryMappingData()
    this.updateMappingList()
  },

  beforeDestroy() {
    clearTimeout(this.timer)
  },

  methods: {
    /**
     * 查询映射关系
     */
    queryMappingData() {
      this.loading = true
      this.mappingList = []
      this.$api.queryDataMappings(this.$route.query).then(data => {
        if (data[0] && data[0].finishLoad !== undefined && !data[0].finishLoad) {
          return this.timer = setTimeout(() => {
            this.queryMappingData()
          }, 3000)
        }
        this.loading = false
        document.querySelector('.table-content').scrollTop = 0

        this.mappingList = data.map(mapping => {
          mapping.sourceFields = treeToArray(mapping.sourceFields, 'children')
          mapping.uirbFields = treeToArray(mapping.uirbFields, 'children')

          mapping.sourceFields.filter(field => !!field.mappingFieldId).forEach(sourceField => {
            let uirbField = mapping.uirbFields.find(field => +field.id === +sourceField.mappingFieldId)
            if (uirbField) uirbField.errorInfo = this.checkErrorInfo(sourceField, uirbField)
          })
          return mapping
        })
      })
    },

    /**
     * 检查映射字段是否异常，返回异常信息
     * @param sourceField 来源字段
     * @param uirbField 资源库目标字段
     */
    checkErrorInfo (sourceField, uirbField) {
      let errorInfo = []

      if (uirbField && (sourceField.fieldType !== uirbField.fieldType)) {
        errorInfo.push('源字段类型和目标字段类型不匹配')
      }
      if (sourceField.fieldType === 'TEXT' && uirbField.fieldType === 'TEXT' && sourceField.length > uirbField.length) {
        errorInfo.push('源字段长度大于目标字段长度')
      }
      return errorInfo
    },

    /**
     * D3.js获取映射关系容器
     * @param mappingId 映射关系Id
     */
    getMappingBox(mappingId) {
      return d3.select(`.mappingId-${mappingId}`)
    },

    /**
     * 映射关系画图连线
     */
    reflowed() {
      setTimeout(() => {
        d3.selectAll('.vue-waterfall path[sourceId][targetId]').remove()
        for (let i =0; i<this.mappings.length; i++) {
          let item = this.mappings[i]
          let mappings = item.sourceFields.filter(field => !!field.mappingFieldId)

          // 映射连线
          mappings.forEach((field) => {
            let mappingCard = this.getMappingBox(item.sourceTableId)

            // 起始字段节点位置
            let source = {};
            let sourceNode = mappingCard.select(`li[sourceId="${field.id}"]`).node()
            if (!sourceNode) return
            source.x = sourceNode.offsetLeft + sourceNode.offsetWidth;
            source.y = sourceNode.offsetTop + sourceNode.offsetHeight / 2;

            // 目标字段节点位置
            let target = {};
            let targetNode = mappingCard.select(`li[targetId="${field.mappingFieldId}"]`).node()
            if (!targetNode) return
            target.x = targetNode.offsetLeft;
            target.y = targetNode.offsetTop + targetNode.offsetHeight / 2;

            // 连线
            mappingCard.select('svg')
              .append('path')
              .attr('d', d3.linkHorizontal().x(d => d.x).y(d => d.y)({source, target}))
              .attr('marker-end', 'url(#arrow-green)')
              .attr('sourceId', field.id)
              .attr('targetId', field.mappingFieldId)
          })
        }
      }, 100)
    },

    /**
     * 鼠标移入，关联节点高亮、连线高亮，其余连线置灰
     * @param item
     * @param field
     */
    mouseEnter(item, field) {
      let mappingCard = this.getMappingBox(item.sourceTableId)
      let selector = d3.select(event.target).classed('source-field')
                      ? `path[sourceId="${field.id}"]`
                      : `path[targetId="${field.id}"]`
      let activePath = mappingCard.select(selector)

      // hover的字段，是否有映射关系存在
      if (!activePath.node()) return;

      // 高亮连线
      mappingCard.selectAll('path[sourceId][targetId]').classed('grey', true).attr('marker-end', 'url(#arrow-grey)')
      activePath.classed('grey', false).attr('marker-end', 'url(#arrow-green)')

      // 高亮起始字段节点、目标字段节点
      mappingCard.select(`li[sourceId="${activePath.attr('sourceId')}"]`).classed('active', true)
      mappingCard.select(`li[targetId="${activePath.attr('targetId')}"]`).classed('active', true)
    },

    /**
     * 鼠标移出，所有连线恢复高亮样式(置绿)
     */
    mouserLeave() {
      d3.selectAll('path[sourceId][targetId]').classed('grey', false).attr('marker-end', 'url(#arrow-green)');
      d3.selectAll('.data-map-card li').classed('active', false)
    },

    handleDropChange (type) {
      if (type) this.checkExistence()
    },

    /**
     * 配置映射关系
     */
    editDataMap(item) {
      if (this.isCheckMapping) return

      this.isCheckMapping = true

      this.checkExistence().then(data => {
        if (!data) {
          this.checkMapping(item).then(data => {
            this.isCheckMapping = false
            if (data) {
              let mappings = item.sourceFields
                .filter((field) => {
                  return !!field.mappingFieldId
                }).map(field => {
                  return {sourceFieldId: field.id, uirbFieldId: field.mappingFieldId}
                })

              let props = {
                editItem: JSON.parse(JSON.stringify(item)),
                isSpider: this.isSpider,
                mappings
              }

              this.$dialog(setDataMapDialog, props).then(() => {
                this.queryMappingData()
              })
            }
          }, (err) => {
            this.isCheckMapping = false
          })
        }
      }, (err) => {
        this.isCheckMapping = false
      })
    },

    /**
     * 检查当前数据源是否正在执行迁移任务
     */
    checkExistence () {
      return new Promise((resolve, reject) => {
        this.$api.checkTaskExist(this.$route.query.datasourceid, {status: '1,3'}).then((data) => {
          if (data) {
            this.$trsModalErrorDialog({
              msg: '当前数据源正在进行迁移任务，不能修改映射配置',
              title: '操作失败'
            })
          }
          resolve(data)
        }, (err) => {
          reject()
        })
      })
    },

    /**
     * 检查当前数据表是否在资源库已配置映射
     */
    checkMapping (item) {
      return new Promise((resolve, reject) => {
        let url = {
          appId: this.$route.query.appid,
          dataSourceId: this.$route.query.datasourceid
        }
        this.$api.checkMappingExist(url, {sourceTableId: item.sourceTableId}).then(data => {
          if (!data) {
            this.$trsModalErrorDialog({
              msg: '当前数据表已配置映射，不能修改映射配置',
              title: '操作失败'
            })
          }
          resolve(data)
        }, (err) => {
          reject()
        })
      })
    },

    /**
     * 新增/编辑爬虫表
     */
    editSpiderTable(item) {
      this.checkExistence().then(data => {
        if (!data) {
          let props = {
            standardId: this.$route.query.standardid,
            dataSourceId: this.$route.query.datasourceid,
            tableId: item && item.sourceTableId,
            editItem: item
          }
          this.$dialog(editSpiderTableDialog, props).then(() => {
            this.queryMappingData()
          })
        }
      })
    },

    /**
     * 删除爬虫表
     * @param item
     */
    deleteSpiderTable(item) {
      this.checkExistence().then(data => {
        if (!data) {
          this.$trsModalConfirm({
            title: '删除表',
            content: '是否确认删除所选爬虫数据表？',
            danger: true
          }).then(() => {
            let url = this.$pick(item, ['standardId', 'dataSourceId', 'sourceTableId'])

            this.$api.deleteSpiderTable(url).then(() => {
              this.$trsModalSuccess('删除爬虫数据表成功！')
              this.queryMappingData()
            })
          })
        }
      })
    },

    /**
     * 解除映射配置
     */
    clearMapping (item) {
      this.checkExistence().then(data => {
        if (!data) {
          this.$trsModalConfirm({ title: '解除映射', content: '是否确认解除映射关系？', danger: true }).then(() => {
            let params = {
              standardId: this.$route.query.standardid,
              dataSourceId: this.$route.query.datasourceid,
              tableId: item && item.sourceTableId
            }
            this.$api.clearDataMapping(params).then(() => {
              this.$trsModalSuccess('解除映射关系成功！')
              this.queryMappingData()
            })
          })
        }
      })
    },

    /**
    * 更新映射列表
    */
    updateMappingList() {
      eventBus.$on('getMappingList', () => {
        this.queryMappingData()
      })
    }
  }
}
</script>

<style lang="scss">
/* 管理映射卡片容器 */
.data-map-card {
  position: relative;
  width: 510px;
  padding: 20px;
  border: 1px solid #E5E9EE;
  background: #fff;
  text-align: left;

  svg {
    position: absolute;
    left: 20px;
    top: 20px;
    width: calc(100% - 40px);
    height: calc(100% - 40px);
    z-index: 12;
  }

  path {
    fill: none;
    stroke: #6fcf9f;
    stroke-width: 1;
  }
  path.grey {
    stroke: #e9e9e9;
  }

  marker.green path {
    fill: #6fcf9f;
    stroke: #6fcf9f;
  }
  marker.grey path {
    fill: #e9e9e9;
    stroke: #e9e9e9;
  }

  .table-box {
    position: relative;
    z-index: 15;
  }
}

/* 字段列表容器 */
.data-map-card .table-item {
  width: 195px;

  .operate.el-dropdown {
    position: absolute;
    left: 170px;
    top: 10px;
  }

  i.setting-icon {
    display: inline-block;
    width: 15px;
    height: 15px;
    background: url("~@/assets/images/setting.png") no-repeat center;
    cursor: pointer;
    z-index: 18;
  }

  .title {
    height: 34px;
    padding: 0 18px;
    border: 1px solid #D9F1E5;
    line-height: 34px;
    color: #39cb81;
    font-weight: bold;
    background-color: #F2FBF7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field li {
    position: relative;
    z-index: 15;
    height: 38px;
    line-height: 36px;
    padding: 0 10px;
    cursor: pointer;
    border: 1px solid #e6ebef;
    border-top-color: transparent;

    & > span {
      display: inline-block;
      width: 100%;
      text-indent: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    i.field-name {
      max-width: calc(100% - 20px);
      font-style: normal;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    &:hover, &.active {
      background-color: #39cb81;
      color: #fff;

      span {
        border-color: #39cb81;
      }

      &.child-field .field-name {
        color: #fff;
      }
    }

    &.parent-field {
      background-color: #F9FBFD;
      color: #363d4e !important;
      cursor: default;
    }

    &.parent-field:hover {
      background-color: #F9FBFD !important;
    }

    &.child-field .field-name {
      padding-left: 10px;
    }
  }

  .parent-field,
  .child-field {
    background-color: #F2F6FB;
  }

  li.child-field {
    border-bottom-color: transparent;
  }

  &.target .title {
    color: #4A8EFD;
    border-color: #E5EBF6;
    background-color: #F6FAFD;
  }

  i.delete-link,
  i.delete-mapping {
    display: none;
    width: 15px;
    height: 15px;
    margin-top: 10px;
    background: url("~@/assets/images/delete-link.png") no-repeat center;
    cursor: pointer;
  }

  i.delete-mapping {
    display: block;
    position: absolute;
    right: 10px;
    top: 0;
    background: url("~@/assets/images/delete-mapping.png") no-repeat center;
  }

  i.warning-icon {
    margin-left: 8px;
    margin-top: 13px;
  }
}

.data-map-card.no-connect {
  .table-item.source .title, .table-item.target .title {
    border-color: #FFE7E9;
    color: #FE6772;
    background-color: #FEF6F7;
  }
}

.data-map-wrapper .uirb-no-data {
  height: calc(100vh - 140px);
}

/* 配置下拉popover */
.el-dropdown-menu.setting-popover {
  min-width: 60px;
  line-height: 30px;
  margin-top: 8px;
  padding: 0;
  font-size: 12px;
  text-align: center;

  .el-dropdown-menu__item {
    padding: 0;
  }

  li:hover {
    color: #fff;
    background-color: #2a8bed;
    cursor: pointer;
  }

  .popper__arrow {
    display: block;
    border-bottom-color: #fff;
  }
}
</style>
