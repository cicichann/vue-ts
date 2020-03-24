<template>
  <div>
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <el-select v-model="status.curStatus" :title="status.curStatus" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.statusList"
            :key="item"
            :title="item"
            :label="item"
            :value="item">
          </el-option>
        </el-select>
        <el-select v-model="status.curSystem" :title="status.curSystem" popper-class="dropdown-select-150" class="fl active-select" @change="handleSysChange">
          <el-option
            v-for="item in data.systemList"
            :key="item.name"
            :title="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
        <el-select v-model="status.curSource" :title="status.curSource" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.sourceList"
            :key="item.name"
            :title="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
        <trs-time-select ref="timeSelect" class="fl" @selectTime="queryList"></trs-time-select>
      </div>

      <div class="fr">
        <el-input v-model="status.searchText" class="normal-input" placeholder="请输入标题" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <div class="table-content" style="padding:0">
      <!-- 列表 -->
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        :index-col="{'width':90, align:'center'}"
        element-loading-text="数据加载中...">
      </com-table>
      <!-- 分页 -->
      <com-pagination :pagination="data.pagination" @callback="queryList"></com-pagination>
    </div>
  </div>
</template>

<script>
import comPagination from '@/views/common/pagination/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import comTable from '@/views/common/table/index'
import { initDate } from '@/utils/index'

export default {
  components: { comPagination, trsTimeSelect, comTable },

  data () {
    return {
      loading: false,
      status: {
        curStatus: '全部状态',
        curSystem: '全部系统',
        curSource: '全部数据表',
        searchText: '',
        popMsg: {}
      },
      data: {
        systemList: [],
        sourceList: [],
        statusList: ['全部状态', '成功', '失败'],
        listSource: null,
        columns: [],
        columnsProps: {},
        pagination: {
          itemCount: 0,
          pageSize: 20,
          pageSizes: [10, 20, 30, 50, 100],
          currPage: 1
        }
      }
    }
  },

  mounted () {
    this.initProp()
    this.querySystem()
    this.querySource()
    this.queryList()
  },

  methods: {
    initProp () {
      this.data.columns = [{
        label: '标题',
        prop: 'title',
        minWidth: 150,
        tooltip: false,
        render: (row, index) => {
          let content = row.title.replace(/<[^>]+>/g, '')
          if (content.length > 500) content = content.slice(0, 500) + '...'

          if (row.status === '成功') {
            return +row.versionNum === 1 ? <router-link title={ content } class="title-link" to={{path: '/ai/preview/', query: {standardid: row.standardId, resourceid: row.resourceId, dataid: row.dataId}}} target="_blank">{ content }</router-link>
                    : <span>
                        <el-popover placement="bottom-start" trigger="hover" popper-class="version-detail data-prop" >
                          {Object.values(this.status.popMsg).length ? (this.status.popMsg.failMsg ? this.status.popMsg.failMsg
                            : <span>
                              与{this.status.popMsg.appName ? this.status.popMsg.appName + '发布' : ''}《
                              <a class="title-link" href={`#/ai/preview/?standardid=${this.status.popMsg.standardId}&resourceid=${this.status.popMsg.resourceId}&dataid=${this.status.popMsg.id}`} target="_blank">{this.status.popMsg.title}</a>
                              》[{this.status.popMsg.id}]因相似度过高，入版本库
                            </span>)
                            : ''}
                          <div class={Object.values(this.status.popMsg).length ? '' : 'pop-loading'} style="display: none">
                            <i class="el-icon-loading"></i>
                          </div>
                          <span class="version-icon" onMouseenter = {() => {this.handleVersionHover(row)}} slot="reference"></span>
                        </el-popover>
                        <router-link title={ content } class="title-link" to={{path: '/ai/preview/',query: {standardid: row.standardId, resourceid: row.resourceId, dataid: row.dataId, isorigin: 0}}} target="_blank">{ content }</router-link>
                      </span>
          } else {
            return (<el-popover placement="top-start" trigger="hover" popper-class="data-prop">
                      <p><strong>标题:  </strong>{ content }</p>
                      <p><strong>失败原因:  </strong>{ row.desc }</p>
                      <span class="disable-title" slot="reference" title={ content }>{ content || '-' }</span>
                    </el-popover>)
          }
        }
      }, {
        label: '接入状态',
        prop: 'status',
        align: 'center'
      }, {
        label: '所属系统',
        prop: 'systemName'
      }, {
        label: '数据表',
        prop: 'resourceName'
      }, {
        label: '接入时间',
        prop: 'startTime',
        format: (row, prop) => {
          return initDate(row[prop])
        },
        align: 'center'
      }]
      this.data.columnsProps = {
        hasSelection: false, // //是否有复选框
        hasIndex: true, // 是否有序号
        disdraggable: true, // 是否禁用拖拽
        hasEdit: false
      }
    },

    queryList (page) {
      this.loading = true
      let params = {
        systemName: this.status.curSystem === '全部系统' ? '' : this.status.curSystem,
        resourceName: this.status.curSource === '全部数据表' ? '' : this.status.curSource,
        status: this.data.statusList.indexOf(this.status.curStatus),
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryCollectionAccess(params).then((data)=>{
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    querySystem () {
      this.$api.queryCollectionSystem().then((data)=>{
        this.data.systemList = data.map((item) => {
          return {name: item}
        })
        this.data.systemList.unshift({name: '全部系统'})
      })
    },

    querySource () {
      this.$api.queryCollectionResource({systemName: this.status.curSystem === '全部系统' ? '' : this.status.curSystem}).then((data)=>{
        this.data.sourceList = data.map((item) => {
          return {name: item}
        })
        this.data.sourceList.unshift({name: '全部数据表'})
      })
    },

    /**
     * 相似的过高文章入版本库的信息hover显示
     */
    handleVersionHover(row) {
      this.status.popMsg = {}
      let params = {
        standardId: row.standardId,
        resourceId: row.distResId
      }
      if (row.distResId && row.originDataId) {
        this.$api.queryVersionDate({ id: row.originDataId }, params).then(data => {
          this.status.popMsg = data
        })
      } else {
        this.status.popMsg = {failMsg: '获取源文档信息失败'}
      }
    },

    /**
     * 选择系统
     */
    handleSysChange () {
      this.status.curSource = '全部数据表'
      this.querySource()
      this.queryList()

    }
  }
}
</script>
