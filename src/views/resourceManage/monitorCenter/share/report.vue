<template>
  <div>
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <el-select v-model="status.curSuperior" :title="status.curSuperior" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.superDeptList"
            :key="item.name"
            :title="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
        <el-select v-model="status.curSub" :title="status.curSub" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.subDeptList"
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
        <template slot-scope="item">
          <button class="list-icon trail-icon" title="使用轨迹" @click.stop="trailClick(item.row)"/>
        </template>
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
        curSuperior: '全部上级部门',
        curSub: '全部下级部门',
        searchText: ''
      },
      data: {
        superDeptList: [],
        subDeptList: [],
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
    this.querySuperDeptList()
    this.querSubDeptList()
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

          return  `<a class="title-link" href="#/ai/preview/?standardid=${row.standardId}&resourceid=${row.resourceId}&dataid=${row.dataId}" target="_blank">${content}</a>`
        }
      }, {
        label: '下级部门',
        prop: 'subDept'
      }, {
        label: '上级部门',
        prop: 'superDept'
      }, {
        label: '报送时间',
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
        hasEdit: true
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
        superDept: this.status.curSuperior === '全部上级部门' ? '' : this.status.curSuperior,
        subDept: this.status.curSub === '全部下级部门' ? '' : this.status.curSub,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryCollectionReport(params).then((data)=>{
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    /**
     * 请求上级分类
     */
    querySuperDeptList () {
      this.$api.queryCollectionUpdepts().then((data)=>{
        this.data.superDeptList = data.map((item) => {
          return {name: item}
        })
        this.data.superDeptList.unshift({name: '全部上级部门'})
      })
    },

    /**
     * 请求下级分类
     */
    querSubDeptList () {
      this.$api.queryCollectionDowndepts().then((data)=>{
        this.data.subDeptList = data.map((item) => {
          return {name: item}
        })
        this.data.subDeptList.unshift({name: '全部下级部门'})
      })
    },

    /**
     * 使用轨迹点击
     */
    trailClick (row) {
      const params = {
        standardid: row.standardId,
        resourceid: row.resourceId,
        dataid: row.dataId
      }
      const { href } = this.$router.resolve({path: '/ai/trace', query: params})
      window.open(href, '_blank')
    }
  }
}
</script>
