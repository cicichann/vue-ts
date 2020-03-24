<template>
  <div class="log-module">
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <el-select v-model="status.curType" :title="status.curType" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.logTypeList"
            :key="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
        <el-select v-model="status.curModule" :title="status.curModule" class="fl active-select" @change="queryList">
          <el-option
            v-for="item in data.moduleList"
            :key="item.name"
            :label="item.name"
            :value="item.name">
          </el-option>
        </el-select>
        <trs-time-select ref="timeSelect" class="fl" @selectTime="queryList"></trs-time-select>
      </div>

      <div class="fr">
        <el-input v-model="status.searchText" class="normal-input" placeholder="请输入描述" @keyup.enter.native="queryList">
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
        element-loading-text="数据加载中..."
        @row-click="handleRowClick">
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
        curType: '全部日志类型',
        curModule: '全部模块',
        searchText: ''
      },
      data: {
        logTypeList: [],
        moduleList: [],
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
    this.queryLogTypeList()
    this.queryModuleList()
    this.queryList()
  },

  methods: {
    initProp () {
      this.data.columns = [{
        label: '用户',
        prop: 'userName',
        minWidth: 70
      }, {
        label: '日志类型',
        prop: 'logType',
        align: 'center'
      }, {
        label: '操作类型',
        prop: 'operateType'
      }, {
        label: '所属模块',
        prop: 'moduleName',
        align: 'center'
      }, {
        label: '时间',
        prop: 'startTime',
        minWidth: 100,
        format: (row, prop) => {
          return initDate(row[prop])
        },
        align: 'center'
      }, {
        label: 'IP',
        prop: 'logUserIP',
        align: 'center'
      }, {
        label: '描述',
        prop: 'logDesc',
        minWidth: 150,
        align: 'center',
        tooltip: false,
        format: (row, prop) => {
          return `<span class="expand-text"></span>` + row[prop]
        }
      }]
      this.data.columnsProps = {
        hasSelection: false, // //是否有复选框
        hasIndex: true, // 是否有序号
        disdraggable: true, // 是否禁用拖拽
        hasEdit: false,
        listenRow: true,
      }
      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    queryList (page) {
      this.initTable()
      this.loading = true
      let params = {
        logType: this.status.curType === '全部日志类型' ? '' : this.status.curType,
        moduleName: this.status.curModule === '全部模块' ? '' : this.status.curModule,
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryCollectionOperation(params).then((data)=>{
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    queryLogTypeList () {
      this.$api.queryCollectionLogTypes().then((data)=>{
        this.data.logTypeList = data.map((item) => {
          return {name: item}
        })
        this.data.logTypeList.unshift({name: '全部日志类型'})
      })
    },

    queryModuleList () {
      this.$api.queryCollectionModuleNames().then((data)=>{
        this.data.moduleList = data.map((item) => {
          return {name: item}
        })
        this.data.moduleList.unshift({name: '全部模块'})
      })
    },

    /**
     * 点击行事件
     */
    handleRowClick({row, column, event}) {
      // 是否已有展开tr
      let detailElement = document.querySelector('.tr-detail')
      // 当前点击的tr
      let target = event.currentTarget
      let parent = target.parentNode

      //  再点一下关闭已经展开的tr
      if (detailElement && detailElement === target.nextSibling) {
        target.setAttribute('class', "el-table__row draggable")
        parent.removeChild(detailElement)
        return
      }

      // 关闭之前的，展开点击的tr
      if (detailElement) {
        detailElement.previousSibling.setAttribute('class', "el-table__row draggable")
        parent.removeChild(detailElement)
      }

      // 展开的tr显示[收起]
      target.setAttribute('class', "el-table__row draggable expand-tr")

      this.insertAfter(parent, target, row)
    },

    /**
     * 删除表格中的展开节点
     */
    initTable () {
      let detailElement = document.querySelector('.tr-detail')
      if (detailElement) {
        detailElement.parentNode.removeChild(detailElement)
      }
    },

    /**
     * 表格行后插入详情数据
     */
    insertAfter(parent, target, row) {
      let newElement = document.createElement('tr')
      newElement.setAttribute("class", "tr-detail");

      let td = document.createElement('td')
      let pre = document.createElement('pre')
      pre.textContent = row.logDesc
      pre.style.cssText= 'width: ' + (target.clientWidth - 40) + 'px;';
      td.appendChild(pre)
      td.setAttribute('colspan', '8')
      td.style.cssText= 'width: ' + target.clientWidth + 'px;';
      newElement.appendChild(td)

      // 原生js只有insertBefore方法，当展开最后一行
      if (parent.lastChild === target) {
        parent.appendChild(newElement)
      } else {
        parent.insertBefore(newElement, target.nextSibling)
      }
    }
  }
}
</script>
