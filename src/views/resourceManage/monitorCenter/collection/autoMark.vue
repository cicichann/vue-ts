<template>
  <div>
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <trs-time-select ref="timeSelect" class="fl" @selectTime="queryList"></trs-time-select>
      </div>

      <div class="fr">
        <el-input v-model="status.searchText" :placeholder="'请输入' + (status.searchType === '0' ? '标题' : '标签')" class="front-condition-type fr" @keyup.enter.native="queryList">
          <el-select slot="prepend" v-model="status.searchType" class="overflow" @change="queryList">
            <el-option label="标题" value="0"></el-option>
            <el-option label="标签" value="1"></el-option>
          </el-select>
          <i slot="suffix" style="top: 0" class="input-icon" @click="queryList"/>
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
        searchText: '',
        searchType: '0'
      },
      data: {
        labelList: [],
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
    this.queryList()
  },

  methods: {
    initProp () {
      this.data.columns = [{
        label: '标题',
        prop: 'title',
        minWidth: 120,
        format: (row, prop) => {
          let content = row[prop].replace(/<[^>]+>/g, '')
          if (content.length > 500) content = content.slice(0, 500) + '...'

          return  `<a class="title-link" href="#/ai/preview/?standardid=${row.standardId}&resourceid=${row.resourceId}&dataid=${row.dataId}" target="_blank">${content}</a>`
        }
      }, {
        label: '标签',
        prop: 'labels',
        format: (row, prop) => {
          let labels = row[prop].split(',').join('、')
          return `<span class="label-item overflow">${labels}</span>`
        }
      }, {
        label: '打标时间',
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
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        searchType: this.status.searchType,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryCollectionMark(params).then((data)=>{
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    queryLabels () {
      this.$api.queryCollectionLabels().then((data)=>{
        this.data.labelList = data.map((item) => {
          return {name: item}
        })
        this.data.labelList.unshift({name: '全部标签'})
      })
    }
  }
}
</script>

