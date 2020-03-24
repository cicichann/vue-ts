<template>
  <div class="info-list">
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <router-link :to="{path: '/recycle/home', query: $pick($route.query, ['standardid', 'categoryid', 'categoryname', 'searchType', 'searchText'])}"
                     tag="button" class="edit-btn other-btn back-btn">返回</router-link>
        <!-- <button :disabled="status.selectedIds.length === 0" class="edit-btn other-btn" @click="reductionClick(status.selectedIds)">还原</button> -->
        <button v-access="'recyclebin.recyclebin.delete'" :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="deleteClick(status.selectedIds)">彻底删除</button>
      </div>
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入标题检索" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 头部筛选下拉、面包屑 -->
    <div class="sub-filter">
      <div class="select-filter fl clearfix">
        <el-select v-model="status.curSource" :title="status.curSource.name" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
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

      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/recycle/home', query: $pick($route.query, ['standardid', 'categoryid', 'categoryname', 'searchType', 'searchText'])}">全部</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.query.resourcename }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content flex-table">
      <!-- 表格 -->
      <com-table
        v-loading="loading"
        ref="table"
        :data="data.listSource"
        :key-id="'dataId'"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        :special-selection="true"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <!-- <button class="list-icon reduction-icon" title="还原" @click.stop="reductionClick(item.row.dataId)"/> -->
          <button v-access="'recyclebin.recyclebin.delete'" class="list-icon delete-icon" title="彻底删除" @click.stop="deleteClick(item.row.dataId)"/>
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
import trsTimeSelect from '@/views/common/timeSelect/index'
import deleteDialog from './components/deleteDialog'

import { TIME_TYPE } from '@/config/index'
import { initDate } from '@/utils/index'

export default {
  name: 'ResourceManageInfoRepoList',

  components: {
    comTable, comPagination, trsTimeSelect, TIME_TYPE, initDate
  },

  data() {
    return {
      loading: true,
      status: {
        searchText: '', // 检索输入
        selectedIds: '', // 已选字段id
        rights: {}, // 当前列表数据权限
        curSource: '全部来源'
      },
      data: {
        listSource: null, // 表格数据
        columns: [], // 表格列初始化数据
        columnsProps: {
          hasSelection: true, // //是否有复选框
          hasIndex: true, // 是否有序号
          hasEdit: true
        },
        pagination: {
          itemCount: 0,
          pageSize: 20,
          pageSizes: [10, 20, 30, 50, 100],
          currPage: 1
        },
        sourceList: []
      }
    }
  },

  mounted () {
    if(this.$route.query.searchType === 'data') this.status.searchText = this.$route.query.searchText

    this.data.columns = [{
      label: '标题',
      prop: 'title',
      minWidth: 150,
      format: (row, prop) => {
        return  `<a class="title-link" href="#/ai/preview/?standardid=${row.standardId}&resourceid=${row.resourceId}&dataid=${row.dataId}" target="_blank">${row[prop]}</a>`
      }
    }, {
      label: '数据来源',
      prop: 'dataSourceName'
    }, {
      label: '删除人',
      prop: 'updateUser'
    }, {
      label: '删除时间',
      prop: 'updateTime',
      format: (row, prop) => {
        return initDate(row[prop])
      },
      align: 'center'
    }]

    this.queryList()
    this.querySourceList()
  },

  methods: {
    /**
     * 列表数据请求
     */
    queryList(page) {
      this.loading = true

      let specialSearch = []
      if (this.$refs.timeSelect.selected.value !== 'ALL') {
        specialSearch.push({
          field: 'sys_update_time',
          text: this.$refs.timeSelect.selected.value,
          type: 'DATE',
          beginTime: this.$refs.timeSelect.timeProp.fromTime,
          endTime: this.$refs.timeSelect.timeProp.endTime
        })
      }
      if (this.status.curSource !== '全部来源') {
        specialSearch.push({field: 'data_sources', text: this.status.curSource, type: 'TEXT'})
      }

      let params = {
        specialSearch: specialSearch.length > 0 ? JSON.stringify(specialSearch) : '',
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }

      this.checkOnlyMyConfigStatus().then(data => {
        params.isOnlyCategory = data ? 1 : 0
        this.$api.get(`/recycleBin/standards/${this.$route.query.standardid}/categories/resources/${this.$route.query.resourceid}/data`, params).then((data)=>{
          this.data.listSource = data.data
          this.data.pagination = Object.assign(this.data.pagination, data.pager)
          this.loading = false
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 查询来源列表
     */
    querySourceList () {
      this.$api.get(`/recycleBin/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/dataSources`, {}).then((data)=>{
        this.data.sourceList = data
        this.data.sourceList.unshift({name: '全部来源', id: 0})
      })
    },

    /**
     * 检查只看当前分类配置项是否开启
     */
    checkOnlyMyConfigStatus () {
      return new Promise(resolve => {
        if (sessionStorage.onlyMyStatus) {
          resolve(sessionStorage.onlyMyStatus === 'true')
        } else {
          this.$api.checkOnlyMy().then(data => {
            sessionStorage.onlyMyStatus = data === 'true'
            resolve(data === 'true')
          })
        }
      })
    },

    /**
     * 获取属于不同分类的单张数据表的权限
     */
    querySourceRight (dataIds, categoryIds) {
      let params = {
        categoryIds: categoryIds || '',
        dataIds: dataIds,
        type: 1
      }
      return new Promise(resolve => {
        if (this.$route.query.standardid && this.$route.query.resourceid) {
          this.$api.querySourceRight({standardid: this.$route.query.standardid, resourceid: this.$route.query.resourceid}, params).then(data => {
            data.forEach(item => { this.status.rights[item.dataId] = item.rights })
            resolve()
          })
        } else {
          resolve()
        }
      })
    },

    /**
     * 全部分类、有分类筛选条件下初始化单张数据表权限
     */
    checkRight (ids, key) {
      if (this.status.selectedCategories.length !== 1 && !this.loading && this.data.listSource) {
        // 有权限的数据id集合
        let checkIds = ids ? ids : this.data.listSource.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
        let hasRightId = checkIds.split(',').filter((id) => {
          return this.status.rights[id] ? this.status.rights[id].find(right => { return right.name === key }) : false
        }).join(',')
        return hasRightId === checkIds || (hasRightId && !ids)
      } else {
        return this.$checkRight(key)
      }
    },

    /**
     * 处理选择项
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /**
     * 还原
     */
    reductionClick (ids) {
      let params = {
        dataIds: this.$refs.table.selectType === 'all' ? '' : ids,
        categoryIds: this.$route.query.categoryid,
        containsAll: this.$refs.table.selectType === 'all' ? 1 : 0
      }

      this.$trsModalConfirm({
        content: '是否确认还原已选数据？',
        title: '还原',
        danger: false
      }).then(data => {
        this.$api.post(`/recycleBin/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data`, params).then(() => {
          this.$trsModalSuccess('还原成功!')
          this.queryList()
        })
      })
    },

    /**
     * 彻底删除
     */
    deleteClick (ids) {
      let params = {
        dataIds: this.$refs.table.selectType === 'all' ? '' : ids,
        categoryIds: this.$route.query.categoryid,
        containsAll: this.$refs.table.selectType === 'all' ? 1 : 0
      }
      this.$dialog(deleteDialog, {
        url: `/recycleBin/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data`,
        params: params,
        tipMsg: '彻底删除将清除所有选中的数据,<br>删除后无法还原，确定删除？',
        title: '彻底删除'
      }).then(() => {
        this.$trsModalSuccess('彻底删除成功！')
        this.queryList()
      })
    }
  }
}
</script>
