<template>
  <div class="tag-manage">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <!-- <button :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="starOrStop('stop')">停用</button>
        <button :disabled="status.selectedIds.length === 0" class="edit-btn other-btn" @click="starOrStop('star')">启用</button> -->
        <button class="edit-btn add-btn" @click="TagChange({})">新增</button>
        <button class="edit-btn other-btn" @click="exportTag">导入</button>
        <button :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click="deleteTag()">删除</button>
      </div>

      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入标签名称" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content table-has-pagination-no-select no-selected" style="padding:0">
      <com-table
        v-loading="loading"
        :data="data.listSource"
        :columns="data.columns"
        :index-col="{'width': 160, 'align': 'left'}"
        :columns-props="columnsProps"
        :pagination="data.pagination"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button title="编辑" class="list-icon edit-icon" @click="TagChange(item)" />
          <button title="删除" class="list-icon delete-icon" @click="deleteTag(item)" />
        </template>
      </com-table>
      <com-pagination ref="pagination" :pagination="data.pagination" @callback="queryList">
      </com-pagination>
    </div>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import comPagination from '@/views/common/pagination/index'
import TagDialog from './components/TagDialog'
import exportTagDialog from './components/exportTag'

export default {
  name: 'tagList',

  components: {
    comTable,
    comPagination
  },

  data () {
    return {
      data: {
        listSource: null,
        columns: [],
        pagination: {}
      },
      status: {
        selectedIds: '',
        searchText: '',
        enable: '',
        pageSize: 15,
        pageIndex: 1
      },
      loading: false,
      columnsProps: {
        hasSelection: true, // //是否有复选框
        hasIndex: true, // 是否有序号
        disdraggable: true, // 是否禁用拖拽
        hasEdit: true
      }
    }
  },

  watch: {
    '$route' () {
      this.status.searchText = ''
      this.queryList()
    }
  },

  mounted () {
    this.initProp()
    this.queryList()
  },

  methods: {
    /**
     * 请求数据
     */
    queryList (page) {
      this.loading = true
      let params = {
        labelType: this.$route.query.tagType,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize
      }
      this.$api.queryTagList(params).then(data => {
        this.data.pagination = data.pager
        this.data.listSource = data.data
        this.data.pagination.pageSizes = [10, 20, 30, 50, 100]
        this.$refs.pagination.jumpValue = ''
        this.loading = false
      })
    },

    /**
     * 启用和停用功能
     * @param {val, row}
     * val=='star' 启用按钮
     * val=='stop' 停用按钮
     */
    starOrStop(val, row) {
      if(val === 'star') {
        this.$trsModalConfirm({
        content: '是否确认启用所选标签?',
        title: '启用标签',
        danger: true
        }).then(() => {
          let url = {
            ids: this.status.selectedIds || row.id
          }
          this.$api.tagStar(url).then(data => {
            this.$trsModalSuccess('启用标签成功！')
            this.queryList()
          })
        })
      } else {
        this.$trsModalConfirm({
        content: '是否确认停用所选标签?',
        title: '停用标签',
        danger: true
        }).then(() => {
          let url = {
            ids: this.status.selectedIds || row.id
          }
          this.$api.tagStop(url).then(data => {
            this.$trsModalSuccess('停用标签成功！')
            this.queryList()
          })
        })
      }
    },
    /**
     * 初始化数据
     */
    initProp () {
      this.data.columns = [{
        label: '标签',
        prop: 'label',
        minWidth: 100
      }]

      this.data.pagination = {
        itemCount: 0,
        pageSize: 20,
        pageSizes: [10, 20, 30, 50, 100],
        currPage: 1
      }
    },

    /**
    * 处理选择项
    * @param ids 已选项ID集合
    */
    handleSelectionChange (ids, row) {
      this.status.selectedIds = ids
    },

    /**
     * 新增/编辑标签
     */
    TagChange (label) {
      this.$dialog(TagDialog, { datas: label, tagType: this.$route.query.tagType }).then(() => {
        this.queryList(this.data.pagination)
      })
    },

    /**
     * 导入标签
     */
    exportTag () {
      this.$dialog(exportTagDialog).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除标签
     */
    deleteTag (item) {
      this.$trsModalConfirm({
        content: "是否删除所选标签?",
        title: "删除标签",
        danger: true
      }).then(data => {
        this.loading = true
        let params = {
          ids: item ? item.row.id : this.status.selectedIds
        }

        this.$api.deleteTagList(params).then(data => {
          this.$trsModalSuccess('删除标签成功！')
          this.queryList()
        }, () => {
          this.loading = false
        })
      })
    }
  }
}
</script>
