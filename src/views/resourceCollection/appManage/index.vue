<template>
  <div class="main-container app-manage-wrapper">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮群 -->
      <div class="fl">
        <button v-access="'aggr.appmgt.add'" class="edit-btn add-btn" @click="addClick()">新增</button>
        <button v-access="'aggr.appmgt.delete'" :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="deleteClick()">删除</button>
      </div>
      <!-- 右侧检索 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入应用名称" class="normal-input" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 下拉检索 -->
    <div class="sub-filter">
      <el-select v-model="status.curFactory" class="select-item" popper-class="dropdown-select-150" @change="handleFactoryChange">
        <el-option v-for="(item, index) in data.factories" :key="index" :label="item.factoryName" :value="item.factoryName" :title="item.factoryName"></el-option>
      </el-select>

      <el-select v-model="status.curAdapter" class="select-item" @change="queryList">
        <el-option v-for="(item, index) in data.adapters" :key="index" :label="item.adapterName" :value="item.adapterName"></el-option>
      </el-select>
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-select-nav" style="padding:0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :pagination="data.pagination"
        :key-id="'appId'"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button v-access="'aggr.appmgt.edit'" class="list-icon edit-icon" title="编辑" @click="editClick(item.row)"/>
          <button v-access="'aggr.appmgt.delete'" class="list-icon delete-icon" title="删除" @click="deleteClick(item.row.appId)"/>
        </template>
      </com-table>

      <!-- 分页 -->
      <com-pagination :pagination="data.pagination" @callback="queryList"></com-pagination>
    </div>

    <!-- 版本信息 -->
    <edition/>
  </div>
</template>

<script>
import comPagination from '@/views/common/pagination/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import comTable from '@/views/common/table/index'
import edition from '@/views/common/footer/footer.vue'
import { initDate } from '@/utils/index'

import editAppDialog from './components/editApp.vue'
import appDetailDialog from './components/appDetail.vue'

export default {
  components: { comPagination, trsTimeSelect, comTable, edition, editAppDialog, appDetailDialog },

  data () {
    return {
      loading: false,
      status: {
        curFactory: '全部厂商-产品',
        curFactoryId: '',
        curAdapter: '全部接入方式',
        searchText: '',
        selectedIds: ''
      },
      data: {
        factories: [], // 厂商
        adapters: [{adapterName: '全部接入方式'}], // 产品
        listSource: null,
        columns: [],
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
    this.queryFactories()
    // this.queryAdapters()
  },

  methods: {
    initProp () {
      this.data.columns = [{
        label: '应用名称',
        prop: 'appName',
        minWidth: 150,
        render: (row, index) => {
          if (this.$checkRight('aggr.appmgt.overview')) {
            return (<span style="cursor: pointer;" onClick={() => {this.viewAppDetail(row)}}>{ row.appName }</span>)
          } else {
            return (<span>{ row.appName }</span>)
          }
        }
      }, {
        label: 'APPID',
        prop: 'appId',
        minWidth: 80
      }, {
        label: '厂商-产品',
        prop: 'factoryName',
        minWidth: 150
      }, {
        label: '对接方式',
        prop: 'adapterName'
      }, {
        label: '创建人',
        prop: 'createUser',
        align: 'center'
      }, {
        label: '创建时间',
        prop: 'createTime',
        align: 'center',
        minWidth: 100,
        format: (row, prop) => {
          return initDate(row[prop])
        }
      }]
    },

    queryList (page) {
      this.loading = true
      let params = {
        searchText: this.status.searchText,
        factoryId: this.status.curFactory === '全部厂商-产品' ? '' : this.data.factories.find(factory => factory.factoryName === this.status.curFactory).id,
        adapterId: this.status.curAdapter === '全部接入方式' ? '' : this.data.adapters.find(adapter => adapter.adapterName === this.status.curAdapter).id,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryAppWithSearch(params).then((data) => {
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    /**
     * 请求厂商-产品列表
     */
    queryFactories () {
      this.$api.queryFactories().then(data => {
        this.data.factories = data
        this.data.factories.unshift({factoryName: '全部厂商-产品'})
      })
    },

    /**
     * 请求接入方式列表
     */
    queryAdapters () {
      this.data.adapters = []
      if(this.status.curFactoryId) {
        this.$api.queryAdapters({factoryId: this.status.curFactoryId}).then(data => {
          this.data.adapters = data
        })
      }
      this.data.adapters.unshift({adapterName: '全部接入方式'})
    },

    /**
     * 修改厂商筛选条件
     */
    handleFactoryChange () {
      this.status.curAdapter = '全部接入方式'
      this.status.curFactoryId = this.data.factories.find(factory => factory.factoryName === this.status.curFactory).id
      this.queryAdapters()
      this.queryList()
    },

    /**
     * 处理选择项
     * @param ids 已选项ID集合
     */
    handleSelectionChange(ids, row) {
      this.status.selectedIds = row.reduce((all, item) => { return all + (all ? ',' : '') + item.appId }, '')
    },

    /**
     * 新增应用
     */
    addClick () {
      this.$dialog(editAppDialog, {title: '新增应用'}).then(() => {
        this.queryList()
      })
    },

    /**
     * 编辑应用
     */
    editClick (app)  {
      this.$dialog(editAppDialog, {title: '编辑应用', app: app}).then(() => {
        this.queryList()
      })
    },

    /**
     * 查看应用详情
     * @param row 点击应用字段
     */
    viewAppDetail (row) {
      this.$dialog(appDetailDialog, {appId: row.appId})
    },

    /**
     * 删除应用
     */
    deleteClick (id) {
      this.$trsModalConfirm({content: '是否删除当前应用？', title: '删除应用', danger: true}).then(data => {
        this.$api.deleteApp({ids: id || this.status.selectedIds}).then(data => {
          this.$trsModalSuccess('删除应用成功!')
          this.queryList()
        })
      })
    }
  }
}
</script>

<style lang="scss">
.app-manage-wrapper {
  padding: 0 15px;
}
</style>
