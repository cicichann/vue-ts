<template>
  <div>
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <button class="edit-btn add-btn" @click.prevent="editField()">新增</button>
        <button :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click.prevent="deleteField(status.selectedIds)">删除</button>
      </div>

      <!-- 右侧面包屑、检索 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入中文名称或英文名称" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content no-selected" style="padding:0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :disdraggable="false"
        element-loading-text="数据加载中..."
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button v-if="!item.row.isSysDefault" class="list-icon edit-icon" title="编辑" @click.stop="editField(item.row.id)"/>
          <button v-if="!item.row.isSysDefault" class="list-icon delete-icon" title="删除" @click.stop="deleteField(item.row.id)"/>
        </template>
      </com-table>
    </div>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import editResourceFieldDialog from './components/editResourceField.vue'

export default {
  name: 'resourceFieldList',

  components: {
    comTable
  },

  data() {
    return {
      loading: false,
      status: {
        selectedIds: '', // 已选字段id
        searchText: ''
      },
      data: {
        listSource: null, // 表格数据
        columns: [] // 表格列初始化数据
      }
    }
  },

  watch: {
    '$route' (newValue) {
      this.queryList()
    }
  },

  mounted() {
    this.queryList()
    this.initProps()
  },

  methods: {
    /**
     * 列表数据请求
     */
    queryList() {
      this.loading = true
      let url = `/standards/${this.$route.query.standardid}/resource/columns/transform`
      this.$api.queryModelList(url, { searchText: this.status.searchText }).then((data) => {
        this.data.listSource = data
        this.loading = false
      })
    },

    /**
     * 表格配置初始化
     */
    initProps() {
      this.data.columns = [{
        label: '中文名称',
        prop: 'cnName',
        minWidth: 100
      }, {
        label: '英文名称',
        prop: 'enName',
        minWidth: 100
      }, {
        label: '字段类型',
        prop: 'fieldTypeName',
        minWidth: 100,
        align: 'center'
      }, {
        label: '默认值',
        prop: 'defaultValue',
        align: 'center'
      }, {
        label: '是否必填',
        prop: 'isRequired',
        // 格式规则
        format: (row, prop) => {
          return row[prop] === 1 ? '是' : '否'
        },
        align: 'center'
      }, {
        label: '是否唯一',
        prop: 'isUnique',
        format: (row, prop) => {
          return row[prop] === 1 ? '是' : '否'
        },
        align: 'center'
      }]
    },

    /**
     * 处理拖拽排序
     *  @param params 拖拽参数
     */
    handleSortChange(params) {
      this.loading = true
      let url = `/standards/${this.$route.query.standardid}/resource/columns/sort`
      this.$api.moveModelList(url, params).then(() => {
        this.queryList()
      })
    },

    /**
     * 处理选择项
     * @param ids 已选项ID集合
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /**
     * 新增/编辑
     */
    editField (columnId = 0) {
      this.$dialog(editResourceFieldDialog, {columnId: columnId, query: this.$route.query}).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除
     */
    deleteField(id) {
      this.$trsModalConfirm({
        content: '是否删除所选数据表属性字段？',
        title: '删除数据表属性字段',
        danger: true
      }).then(data => {
        let params = {
          standardId: this.$route.query.standardid,
          columnIds: id
        }
        let url = `/standards/${this.$route.query.standardid}/resource/columns/${id}`
        this.$api.deleteField(url, params).then((data) => {
          this.$trsModalSuccess('删除数据表属性字段成功!')
          this.queryList()
        })
      })
    }
  }
}
</script>
