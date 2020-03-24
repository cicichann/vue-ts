<template>
  <div>
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <router-link :to="{ path: '/model/structure/catalog', query: params }" tag="button" class="edit-btn other-btn back-btn">返回</router-link>
        <button class="edit-btn add-btn" @click.prevent="editClick({})">新增</button>
        <button :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click.prevent="deleteClick(status.selectedIds)">删除</button>
      </div>

      <!-- 右侧面包屑、检索 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{ path: '/model/structure/catalog', query: params }">全部</el-breadcrumb-item>
          <el-breadcrumb-item v-if="$route.query.resourcename">{{ $route.query.resourcename }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-input v-model="status.searchText" placeholder="请输入字段中文名或字段英文名" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content no-selected" style="padding:0">
      <com-table
        v-loading="loading"
        ref="trsTable"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :disdraggable="false"
        element-loading-text="数据加载中..."
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        @row-click="handleRowExpand">
        <template slot-scope="item">
          <span class="edit-col-left">
            <button v-if="!item.row.isSysDefault" :class="{'origin-icon': item.row.is_sys_default == '1'}"
                    class="list-icon edit-icon" title="编辑" @click.stop="editClick(item.row)"/>
            <button v-if="item.row.is_sys_default == '0'" class="list-icon delete-icon" title="删除" @click.stop="deleteClick(item.row.id)"/>
          </span>
        </template>
      </com-table>
    </div>
  </div>
</template>

<script>
import comTable from '@/views/common/table/index'
import { initDate } from '@/utils/index'
import editFieldDialog from './components/editField.vue'

export default {
  name: 'attributeList',

  components: {
    comTable,
    initDate
  },

  data() {
    return {
      loading: false,
      status: {
        searchText: '', // 检索输入
        selectedIds: '' // 已选字段id
      },
      data: {
        listSource: null, // 表格数据
        columns: [], // 表格列初始化数据
        columnsProps: {
          hasSelection: true, // //是否有复选框
          hasIndex: true, // 是否有序号
          hasEdit: true,
          listenRow: true,

          // 标题和系统配置字段不可拖拽
          checkDisDraggable: (row) => {
            return row.is_title === '是' || row.is_sys_default === 1 || row._childDragging ? true : false
          },

          // 系统默认字段、复合字段子字段复选框禁用
          checkSelectable: (row) => {
            return row.is_sys_default !== 1
          },

          setSpecialRowClass: (row) => {
            let className = ''
            if (row.is_sys_default === 1) className += 'sys-default-row'

            // 复合字段展开/收起交互添加类名
            if (row.fields) className += 'parent-row'
            if (row._expanded) className += ' complex-row'
            if (row.parent) className += 'child-row' + ' child-row-' + row.parent.id

            return className
          }
        }
      },
      params: {
        standardid: this.$route.query.standardid,
        groupid: this.$route.query.groupid,
        resourceid: this.$route.query.resourceid,
        groupname: this.$route.query.groupname,
        searchText: this.$route.query.searchText
      },
      isAddShow: false, //编辑弹窗默认不可见
      action: '', //操作：add|edit
      columnId: 0 //当前字段id
    }
  },

  mounted() {
    this.queryList()
  },

  methods: {
    /**
     * 列表数据请求
     */
    queryList() {
      this.loading = true
      let url = {
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid
      }
      let params = {
        isOverview: 0, // 0-全部 1-概览 2-非概览
        isSearchField: 0, // 0-全部 1-可检索 2-非可检索
        searchText: this.status.searchText
      }

      this.data.listSource = null

      this.$api.queryStructureTableList(url, params).then((data) => {
        // 动态表头设置
        this.data.columns = data.columns.filter(item => {
          return item.isOverview
        }).map((item, index) => {

          let column = {
            label: item.cnName,
            prop: item.enName,
            minWidth: 100
          }

          switch(column.prop) {
            // 标题字段中文名称显示标识标签
            case 'cn_name':
              column.minWidth = 200
              column.render = (row, index) => {
                // 标题字段
                if (row.is_title === '是') {
                  return (<span><span class="title-text overflow" title={ row.cn_name }>{ row.cn_name }</span>
                          <span class="title-icon">标 题</span></span>)
                // 复合字段
                } else if (row.field_type === 'ARRAY' || row.field_type === 'OBJECT') {
                  return (<span><span>{ row.cn_name }</span>
                          <i class={(row._expanded && 'el-icon-caret-top' || 'el-icon-caret-bottom') + ' dropdown-btn'}></i></span>)
                // 普通字段
                }

                return (<span>{ row.cn_name }</span>)
              }
              break
            case 'field_type':
              column.format = (row, prop) => {
                return row.field_type_name
              }
              break
          }

          // 系统默认字段的用户自定义属性不显示默认值
          if (item.isSysDefault === 0) {
            column.format = (row, prop) => {
              return row.is_sys_default === 1 || !row[prop] ? '-' : row[prop]
            }
          }
          return column
        })

        this.data.columns = this.data.columns.filter((item) => item)
        this.data.listSource = this.treeToArray(data.rows)
        this.loading = false
      })
    },

    /**
     * 复合字段点击展开/收起
     */
    handleRowExpand ({row, column, event}) {
      if (row.fields) row._expanded = !row._expanded
    },

    /**
     * 树形数据转换为数组
     */
    treeToArray (data, parent = null) {
      let tmp = []
      Array.from(data).forEach((row, index) => {
        row._index = index + 1

        if (parent) {
          this.$set(row, 'parent', parent)
          row.index = parent._index
        }
        tmp.push(row)

        if (row.fields && row.fields.length > 0) {
          this.$set(row, '_expanded', true)
          const children = this.treeToArray(row.fields, row)
          tmp = tmp.concat(children)
        }
      })
      return tmp
    },

    /**
     * 处理拖拽排序
     *  @param params 拖拽参数
     */
    handleSortChange(params) {
      this.loading = true
      let url = `/standards/${this.$route.query.standardid}` +
              `/resources/${this.$route.query.resourceid}` +
              `/columns/sort`
      this.$api.moveModelList(url, params).then(() => {
        this.loading = false
        this.queryList()
      }, (err) => {
        this.queryList()
        this.loading = false
      })
    },

    /**
     * 处理选择项
     * @param ids 已选项ID集合
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /*
    ** 新增/编辑
    **/
    editClick(row) {
      let props = {
        query: this.$route.query,
        columnId: row.id
      }
      this.$dialog(editFieldDialog, props).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除
     */
    deleteClick(id) {
       this.$trsModalConfirm({
        content: '是否删除所选字段?',
        title: '删除字段',
        danger: true
      }).then(data => {
        this.$api.queryStructureListTableDel(this.params, { columnId: id }).then((data) => {
          this.$trsModalSuccess('删除字段成功!')
          this.queryList()
        })
      })
    }
  }
}
</script>

<style lang="scss">
.title-text {
  float: left;
  max-width: 60%;
}
.resource-model .table-content {
  .title-icon {
    float: left;
    margin-top: 10px;
    width: 55px;
    height: 25px;
    line-height: 25px;
    margin-left: 10px;
    padding: 0 12px;
    font-size: 11px;
    color: #76aaff;
    border-radius: 3px;
    background-color: #e0ebfc;
  }

  .el-table__body-wrapper td {
    border-bottom: 0;
    border-top: 1px solid #ebeef5;
  }

  .el-table__body-wrapper tr:first-of-type td {
    border-top: 0;
  }

  .el-table__body-wrapper tr:last-of-type td {
    border-bottom: 1px solid #ebeef5;
  }

  .dropdown-btn {
    margin-left: 10px;
    color: #bcd5f2;
    cursor: pointer;
  }

  .complex-row,
  .child-row {
    td {
      background-color: #F1F6FB;
    }

    &:hover td {
      background-color: #DBEBFA !important;
    }
  }

  .parent-row {
    cursor: pointer;
  }

  .child-row {
    td {
      border-color: transparent;
      color: #666666;
    }

    td:nth-of-type(3) {
      padding-left: 10px;
    }

    .el-checkbox {
      visibility: hidden;
    }

    &:last-of-type td {
      border-color: #EBEEF5;
    }

    td .cell {
      height: 30px;
      line-height: 30px;
      font-size: 13px;
    }

    &.draggable .cell .move-icon {
      height: 30px;
      line-height: 30px;
    }

    .cell .cell-index {
      display: none;
    }
  }

  .child-row-hidden {
    display: none;
  }
}
</style>
