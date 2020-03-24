<template>
  <div>
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <el-select v-model="status.curSystem" :title="status.curSystem" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.systemList"
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
        curSystem: '全部系统',
        searchText: ''
      },
      data: {
        systemList: [],
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
    this.queryList()
  },

  methods: {
    initProp () {
      this.data.columns = [{
        label: '标题',
        prop: 'title',
        minWidth: 150,
        format: (row, prop) => {
          let content = row[prop].replace(/<[^>]+>/g, '')
          if (content.length > 500) content = content.slice(0, 500) + '...'

          return `<span class="withdrawal-icon">${content}</span>`
        }
      }, {
        label: '所属系统',
        prop: 'systemName'
      }, {
        label: '撤稿人',
        prop: 'userName'
      }, {
        label: '撤稿时间',
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
      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    queryList (page) {
      this.loading = true
      let params = {
        systemName: this.status.curSystem === '全部系统' ? '' : this.status.curSystem,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryCollectionWithdrawal(params).then((data)=>{
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
  }
}
</script>
