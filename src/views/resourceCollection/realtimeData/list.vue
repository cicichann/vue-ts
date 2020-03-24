<template>
  <div class="list-wrapper reltime-list">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <button class="edit-btn other-btn back-btn" @click="goBack">返回</button>
      </div>
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入标题" @keyup.enter.native="requestList">
          <i slot="suffix" class="input-icon" @click="requestList"/>
        </el-input>
      </div>
    </div>

    <!-- 下拉 -->
    <div class="sub-filter">
      <el-select v-model="data.value" class="select-item" placeholder="全部状态" @change="changeStatus">
        <el-option
          v-for="item in data.options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
      <trs-time-select ref="timeSelect" class="select-item" @selectTime="requestList"></trs-time-select>

      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/collection/realtime/cardList',
                                    query: {standardid: this.$route.query.standardid, appid: this.$route.query.appid,groupname: this.$route.query.groupname}}">
            全部</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.query.resourceName }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-select-nav no-selected" style="padding: 0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        element-loading-text="数据加载中...">
      </com-table>
      <com-pagination ref="pagination" :pagination="data.pagination" @callback="requestList">
      </com-pagination>
    </div>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import comPagination from '@/views/common/pagination/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import { initDate } from '@/utils/index'
export default {
   name: 'realtimeTableList',

  components: {
    comTable,
    comPagination,
    trsTimeSelect
  },

  data() {
    return {
      data: {
        listSource: null, //表格数据
        columns: [], //每一列的配置
        pagination: {}, //分页
        options: [{
          value: 0,
          label: '全部状态'
        },{
          value: 2,
          label: '失败'
        },{
          value: 1,
          label: '成功'
        }],
        value: 0, //默认状态
        columnsProps : {
          hasSelection: false, // //是否有复选框
          hasIndex: true, // 是否有序号
          disdraggable: true, // 是否禁用拖拽
          listenRow: true,
          hasEdit: false
        }
      },
      item: {
        appName: '',
        title: '',
        id: ''
      },
      status: {
        selectedIds: '',
        searchText: '',
        status: '',
        beginTime: '',
        endTime: '',
        granularity: 'ALL',
        pageIndex: 1,
        pageSize: 15
      },
      loading: false,
      popMsg: {}
    }
  },

  mounted() {
    this.initProp()
    this.requestList()
  },

  methods: {
    /**
     * 请求数据
     */
    requestList(page) {
      this.loading = true
      let params = {
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        dataSourcesId: this.$route.query.adapterid,
        appId: this.$route.query.appid,
        status: this.status.status,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.realtimeDateTableList(params).then(data => {
        this.data.pagination = data.pager
        this.data.listSource = data.data
        this.data.pagination.pageSizes = [10, 20, 30, 50, 100]
        this.$refs.pagination.jumpValue = ''
        this.loading = false
      })
    },
     /**
     * 初始化数据
     */
    initProp() {
      this.data.columns = [{
        label: '标题',
        prop: 'title',
        minWidth: 330,
        tooltip: false,
        render: (row, index) => {
            let content = row.title.replace(/<[^>]+>/g, '')
            if (content.length > 500) content = content.slice(0, 500) + '...'

            if (row.status === '成功') {
              return +row.versionNum === 1 ? <router-link title={ content } class="title-link" to={{path: '/ai/preview/', query: {standardid: row.standardId, resourceid: row.resourceId, dataid: row.dataId}}} target="_blank">{ content }</router-link>
                      : <span>
                          <el-popover placement="bottom-start" trigger="hover" popper-class="version-detail data-prop" >
                            {Object.values(this.popMsg).length ? (this.popMsg.failMsg ? this.popMsg.failMsg
                              : <span>
                                与{this.popMsg.appName ? this.popMsg.appName + '发布' : ''}《
                                <a class="title-link" href={`#/ai/preview/?standardid=${this.popMsg.standardId}&resourceid=${this.popMsg.resourceId}&dataid=${this.popMsg.id}`} target="_blank">{this.popMsg.title}</a>
                                》[{this.popMsg.id}]因相似度过高，入版本库
                              </span>)
                              : ''}
                            <div class={Object.values(this.popMsg).length ? '' : 'pop-loading'} style="display: none">
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
                        <span class="disable-title" title={ content } slot="reference">{ content || '-' }</span>
                      </el-popover>)
            }
          }
      }, {
        label: '接入状态',
        prop: 'status',
        format: (row, prop) => {
          if(row.status === '失败') {
            return `<span class="lose-wrapper">失败
                      <i class='lose-icon'><i>
                    <span>`
          } else {
             return `<span class="success-wrapper">成功
                      <i class='success-icon'><i>
                    <span>`
          }
        },
        minWidth: 100
      }, {
        label: '接入时间',
        prop: 'time',
        minWidth: 100,
        format: (row, prop) => {
          return initDate(row.time)
        }
      },]

      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    /**
     * 返回卡片页面
     */
    goBack() {
       this.$router.push({ path: '/collection/realtime/cardList',
       query: {
          standardid: this.$route.query.standardid,
          appid: this.$route.query.appid,
          adapterid: this.$route.query.adapterid,
          groupname: this.$route.query.groupname
        }})
    },

    /**
     * 相似的过高文章入版本库的信息hover显示
     */
    handleVersionHover(row) {
      this.popMsg = {}
      let params = {
        standardId: this.$route.query.standardid,
        resourceId: row.originResourceId
      }
      if (row.originResourceId && row.originDataId) {
        this.$api.queryVersionDate({ id: row.originDataId }, params).then(data => {
          this.popMsg = data
        })
      } else {
        this.popMsg = {failMsg: '获取源文档信息失败'}
      }
    },

    /**
     * 改变状态回调
     */
    changeStatus(val) {
      this.status.status = val
      this.requestList()
    }
  }
}
</script>

<style>

</style>
