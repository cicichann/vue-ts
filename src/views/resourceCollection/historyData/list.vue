<template>
  <div v-loading="loading" class="history-data" element-loading-text="数据加载中...">
    <!-- 头部按钮、检索 -->
    <div class="sub-nav">
      <div class="fl">
        <router-link :to="{path: '/collection/history/task',
                           query: {standardid: $route.query.standardid, datasourceid: $route.query.datasourceid,
                                   datasourcetype: $route.query.datasourcetype, taskid: $route.query.taskid, taskname: $route.query.taskname}}"
                     tag="button" class="edit-btn other-btn back-btn">返回</router-link>
        <button v-access="'aggr.historydata.delete'" :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click.prevent="deleteDetail(status.selectedIds)">删除</button>
      </div>
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入标题" class="normal-input" @keyup.enter.native="queryList">
          <i slot="suffix" style="top: 0" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 头部筛选、面包屑 -->
    <div class="sub-filter">
      <!-- 动态检索 -->
      <el-select v-if="data.fieldsList.length > 0" v-model="status.parentClassifyId" :placeholder="'全部' + data.fieldsList[0].desc" class="select-item" popper-class="dropdown-select-150" @change="queryList">
        <el-option v-for="item in data.enumList" :key="item.parentClassifyId" :label="item.parentClassifyName" :value="item.parentClassifyId" :title="item.parentClassifyName"/>
      </el-select>

      <!-- 状态检索 -->
      <el-select v-model="status.status" :title="status.status" class="filter-select select-item" placeholder="全部结果" @change="queryList">
        <el-option label="全部结果" value="" />
        <el-option :value="1" label="成功" />
        <el-option :value="0" label="失败" />
      </el-select>

      <!-- 时间检索 -->
      <trs-time-select ref="timeSelect" class="select-item" @selectTime="queryList"></trs-time-select>

      <!-- 面包屑 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/collection/history/task',
                                    query: {standardid: $route.query.standardid, datasourceid: $route.query.datasourceid,
                                            datasourcetype: $route.query.datasourcetype, taskid: $route.query.taskid, taskname: $route.query.taskname}}">
            全部
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.query.taskname }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 主体 -->
    <div class="table-content table-has-select-nav task-detail">
      <com-table
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button v-access="'aggr.historydata.delete'" class="list-icon delete-icon" title="删除" @click.stop="deleteDetail(item.row.id)"/>
        </template>
      </com-table>

      <!-- 分页 -->
      <com-pagination :pagination="data.pagination" @callback="queryList"></com-pagination>
    </div>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import comPagination from '@/views/common/pagination/index'
import trsBreadcrumb from '@/views/common/breadcrumb/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import fecha from 'fecha'

export default {
  name: 'HistoryTaskList',

  components: {
    comTable, comPagination, trsBreadcrumb, trsTimeSelect
  },

  data () {
    return {
      loading: false,
      channelLoading: false, // 栏目分页loading
      data: {
        listSource: null, // 表格数据
        columns: [], // 表格列初始化数据
        columnsProps: {}, // 表格其他配置
        pagination: {}, // 分页信息
        fieldsList: [], // 动态表头列表
        enumList: [] // 动态筛选枚举值列表
      },
      status: {
        selectedIds: '', // 已选详情id
        searchText: '', // 检索输入
        status: '', // 状态，0-失败，1-成功
        beginTime: '', // 开始时间
        endTime: '', // 结束时间
        datasourceType: 'http', // 任务类型，1为CMS，2为爬虫
        parentClassifyId: '',
        popMsg: {}
      }
    }
  },

  mounted () {
    this.initProps()
    this.queryList()
  },

  methods: {
    /**
     * 初始化配置
     */
    initProps () {
      this.data.columns = [
        {
          label: '标题',
          prop: 'title',
          minWidth: 150,
          tooltip: false,
          render: (row, index) => {
            let content = row.title.replace(/<[^>]+>/g, '')
            if (content.length > 500) content = content.slice(0, 500) + '...'

            if (row.status === 1) {
              return this.$checkRight('aggr.historydata.view') ? (+row.versionNum === 1 ?
                <router-link title={ content } class="title-link" to={{ path: '/ai/preview/', query: { standardid: row.standardId, resourceid: row.resourceId, dataid: row.dataId } }} target="_blank">{content}</router-link>
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
                    <span class="version-icon" onMouseenter={() => { this.handleVersionHover(row) }} slot="reference"></span>
                  </el-popover>
                  <router-link title={ content } class="title-link" to={{ path: '/ai/preview/', query: { standardid: row.standardId, resourceid: row.resourceId, dataid: row.dataId, isorigin: 0 } }} target="_blank">{content}</router-link>
                </span>)
                : <span>{content}</span>
            } else {
              return (<el-popover placement="top-start" trigger="hover" popper-class="data-prop" >
                <p><strong>失败原因:  </strong>{row.failedReason}</p>
                <span class="disable-title" title={ content } slot="reference">{content || '-'}</span>
              </el-popover>)
            }
          }
        },
        {
          label: '迁移结果',
          prop: 'status',
          // 格式规则
          format: (row, prop) => {
            return row[prop] === 1 ? `<span class="status-icon succ-icon">成功</span>` : `<span class="status-icon fail-icon">失败</span>`
          }
        },
        {
          label: '迁移时间',
          prop: 'transferTime',
          align: 'center',
          format: (row, prop) => {
            return fecha.format(+row[prop], 'YYYY-MM-DD HH:mm:ss')
          }
        }
      ]

      let type = this.$route.query.datasourcetype
      if (type === 'crawler') {
        this.data.columns.splice(1, 0, {
          label: '原URL',
          prop: 'url',
          align: 'center',
          format: (row, prop) => {
            return `<a class="title-link" href="${row[prop]}" target="_blank">${row[prop]}</a>`
          }
        })
      } else {
        let url = {
          standardId: this.$route.query.standardid,
          datasouceId: this.$route.query.datasourceid,
          transferTaskId: this.$route.query.taskid
        }
        this.$api.queryTaskFields(url).then(data => {
          this.data.fieldsList = data
          let fields = this.data.fieldsList.map(item => {
            return {
              label: item.desc,
              prop: item.name
            }
          })
          this.data.columns.splice(1, 0, ...fields)

          if (data.length > 0) {
            this.queryEnumList()
          }
        })
      }

      this.data.columnsProps = {
        hasSelection: true, // //是否有复选框
        hasIndex: true, // 是否有序号
        disdraggable: true, // 是否禁用拖拽
        hasEdit: true
      }
      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }

      this.status.datasourceType = type
      Array.prototype.map.call(document.querySelectorAll('.el-select input'), (input, index) => {
        input.setAttribute('unselectable', 'on')
      })
    },

    /**
     * 请求列表数据
     */
    queryList (page) {
      this.loading = true
      let url = {
        standardId: this.$route.query.standardid,
        datasourceId: this.$route.query.datasourceid,
        taskId: this.$route.query.taskid
      }

      let params = {
        title: this.status.searchText,
        parentClassifyId: this.status.parentClassifyId,
        status: this.status.status,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }

      this.$api.queryTaskDetail(url, params).then(data => {
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    /**
     * 相似的过高文章入版本库的信息hover显示
     */
    handleVersionHover (row) {
      this.status.popMsg = {}
      let params = {
        standardId: this.$route.query.standardid,
        resourceId: row.originResourceId
      }
      if (row.originResourceId && row.originDataId) {
        this.$api.queryVersionDate({ id: row.originDataId }, params).then(data => {
          this.status.popMsg = data
        })
      } else {
        this.status.popMsg = {failMsg: '获取源文档信息失败'}
      }
    },

    /**
     * 删除详情
     */
    deleteDetail (id) {
      this.$trsModalConfirm({
        content: '是否删除所选数据？',
        title: '删除数据',
        danger: true
      }).then(data => {
        this.loading = true
        let url = {
          standardId: this.$route.query.standardid,
          datasourceId: this.$route.query.datasourceid,
          taskId: this.$route.query.taskid,
          detailIds: id
        }

        this.$api.deleteTaskDetail(url).then((data) => {
          this.$trsModalSuccess('删除数据成功!')
          this.queryList()
          this.loading = false
        })
      })
    },

    /**
     * 处理选择项
     */
    handleSelectionChange (ids) {
      this.status.selectedIds = ids
    },

    /**
     * 请求动态下拉枚举值
     */
    queryEnumList () {
      let url = {
        standardId: this.$route.query.standardid,
        datasouceId: this.$route.query.datasourceid,
        transferTaskId: this.$route.query.taskid
      }
      this.$api.queryFilterEnum(url).then(data => {
        data.unshift({
          parentClassifyId: '',
          parentClassifyName: '全部' + this.data.fieldsList[0].desc
        })
        this.data.enumList = data
      })
    }
  }
}
</script>
