<template>
  <div class="configuration-manage">
    <div class="sub-nav">

      <!-- 左侧按钮群 -->
      <div class="fl">
        <button v-access="'sysconf.config.add'" class="edit-btn add-btn" @click="edit">新增</button>
        <button v-access="'sysconf.config.delete'" :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="deleteConfig(status.selectedIds)">删除</button>
      </div>

      <!-- 右侧检索 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入配置项名称" class="normal-input" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-pagination-no-select" style="padding:0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button v-access="'sysconf.config.edit'" title="编辑" class="list-icon edit-icon" @click="edit(item.row)"></button>
          <button v-access="'sysconf.config.delete'" title="删除" class="list-icon delete-icon" @click="deleteConfig(item.row.id)"></button>
        </template>
      </com-table>
      <com-pagination :pagination="data.pagination" @callback="queryList">
      </com-pagination>
    </div>

    <!-- 版本信息 -->
    <edition/>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import comPagination from '@/views/common/pagination/index'
import editConfigDialog from './components/editConfiguration'
import edition from '@/views/common/footer/footer.vue'

export default {
  components: {
    comTable,
    comPagination,
    edition
  },

  data() {
    return {
      loading: false,
      status: {
        selectedIds: [], // 已选配置项
        searchText: '' // 检所输入
      },
      data: {
        listSource: null,
        pagination: {},
        columns: []
      }
    }
  },

  mounted() {
    this.initProp()
    this.queryList()
  },

  methods: {
    /**
     * 初始化数据
     */
    initProp() {
      this.data.columns = [{
        label: '配置项名称',
        prop: 'name',
        minWidth: 100,
      }, {
      //   label: '类型',
      //   prop: 'type',
      //   minWidth: 50,
      // }, {
        label: '内容',
        prop: 'value',
        minWidth: 100,
      }, {
        label: '描述',
        prop: 'desc',
        minWidth: 150,
      }]

      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    /**
     * 获取列表数据
     */
    queryList() {
      this.loading = true
      let params = {
        searchText: this.status.searchText,
        pageIndex: this.data.pagination.currPage,
        pageSize: this.data.pagination.pageSize
      }
      this.$api.queryConfig(params).then(data => {
        this.loading = false
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
      })
    },

    /**
     * 选择项改变
     * @param ids 已选配置项ID
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /**
     * 新增/编辑配置项
     */
    edit(item) {
      this.$dialog(editConfigDialog, {editItem: Object.assign({}, item)}).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除配置项
     */
    deleteConfig(id) {
      this.$trsModalConfirm({
        title: '删除配置项',
        content: '是否确认删除所选配置项？',
        danger: true
      }).then(() => {
        this.loading = true

        this.$api.deleteConfig(id.toString()).then(() => {
          this.$trsModalSuccess('删除配置项成功！')
          this.queryList()
          this.loading = false
        })
      })
    }
  }
}
</script>

<style lang="scss">
.configuration-manage {
  padding: 0 15px;

  .table-content {
    height: calc(100vh - 140px);
  }
}
</style>
