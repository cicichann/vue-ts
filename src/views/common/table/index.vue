<template>
  <div :class="{'table-not-init': !initFinish}" class="com-table">
    <el-table
      ref="table"
      :data="tableData"
      :class="{'move-tr': !disdraggable}"
      :max-height="columnsProps.maxHeight"
      :row-class-name="setClass"
      :header-row-class-name="'header'"
      :row-key="keyId"
      :row-style="setRowStyle"
      tooltip-effect="dark"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      @sort-change="handleSortChange">
      <!-- 复选框 -->
      <el-table-column v-if="columnsProps.hasSelection && !specialSelection" :selectable="isSelectable" type="selection" width="65"/>

      <!-- 可选本页/全部的特殊复选框 -->
      <el-table-column v-if="columnsProps.hasSelection && specialSelection" width="80" align="center">
        <template slot="header" slot-scope="scope">
          <el-select v-model="selectType" :class="[{'select-active':selectDropShow&& selectType}, 'table-select-head']" placeholder="选择"
                     popper-class="table-select-dropdown" @visible-change="handleSelectDropdownToggle">
            <el-option label="本页" value="current"><div @click="changeSelectType('current')">本页</div></el-option>
            <el-option label="全部" value="all"><div @click="changeSelectType('all')">全部</div></el-option>
          </el-select>
        </template>
        <template slot-scope="scope">
          <el-checkbox v-model="rowsCheckStatus[scope.$index]" :disabled="selectType === 'all'" @change="handleSingleChange(scope)"></el-checkbox>
        </template>
      </el-table-column>

      <!-- 序号 -->
      <el-table-column v-if="columnsProps.hasIndex" :width="indexCol.width" :align="indexCol.align" class-name="index-col" label="序号">
        <template slot-scope="scope">
          <span v-if="!disdraggable" class="move-icon"></span>
          <span class="cell-index">{{ calcIndex(scope.$index, scope.row) }}</span>
        </template>
      </el-table-column>

      <!-- 数据列 -->
      <el-table-column
        v-for="(column, index) in columns"
        :key="index"
        :align="column.align"
        :prop="column.prop"
        :label="column.label"
        :sortable="column.sort ? 'custom' : false"
        :min-width="column.minWidth"
        :show-overflow-tooltip="column.tooltip !== false">
        <!-- scope不要删，否则title不生效 -->
        <template slot="header" slot-scope="scope">
          <span :title="column.label" class="header-label">{{ column.label }}</span>
        </template>

        <template slot-scope="scope">
          <!-- render -->
          <template v-if="column.render">
            <RenderDom :row="scope.row" :index="index" :prop="column.prop" :render="column.render" />
          </template>
          <!-- 格式化内容 -->
          <template v-else-if="column.format">
            <span v-if="column.format(scope.row, column.prop) == ''">-</span>
            <span v-html="column.format(scope.row, column.prop)"/>
          </template>
          <!-- 普通文本 -->
          <template v-else>
            {{ scope.row[column.prop] || '-' }}
          </template>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column v-if="columnsProps.hasEdit" :label="columnsProps.editColumnName || '操作'" min-width="130" align="center" class-name="edit-column">
        <template slot-scope="scope">
          <slot :row="scope.row"/>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Sortable from 'sortablejs'

export default {
  name: 'TrsTable',

  components: {
    Sortable,
    RenderDom: {
        functional: true, // 函数式组件 - 无 data 和 this 上下文 => better render
        props: {
          row: Object,
          index: Number,
          render: Function,
          prop: String
        },
        /**
         * @param {Function} createElement - 原生创建dom元素的方法， 弃用，推荐使用 jsx
         * @param {Object} ctx - 渲染的节点的this对象
         * @argument 传递参数 row index
         */
        render(createElement, ctx){
          const { row, index, prop } = ctx.props
          return ctx.props.render(row, index, prop)
        }
      }
  },

  props: {
    // 列配置，标题、对应字段、是否排序等
    columns: {
      type: Array,
      required: true
    },
    // 表格数据
    data: {
      required: true,
      validator: v => typeof v === 'object'
    },
    // 其他配置
    columnsProps: {
      type: Object,
      default: () => {
        return {
          hasSelection: true, // //是否有复选框
          hasIndex: true, // 是否有序号
          hasEdit: true // 是否有操作列
        }
      }
    },
    disdraggable: {
      type: Boolean,
      default: true
    },
    indexCol: {
      type: Object,
      default: () => {
        return {
          align: 'center',
          width: 80
        }
      }
    },
    // 分页信息，用于计算显示序号
    pagination: {
      type: Object,
      default: () => {
        return {
          pageSize: 10,
          currPage: 1
        }
      }
    },
    keyId: {
      type: String,
      default: 'id'
    },

    setRowStyle: {
      type: Function,
      default: () => {}
    },

    specialSelection: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      selections: [], // 选中数据项
      sortable: Object, // 拖拽对象
      selectionRow: [],
      pager: this.pagination,
      initFinish: false,
      selectType: '', // 本页/全选当前选中项
      selectDropShow: false, // 本页/全选下拉是否展开
      rowsCheckStatus: []
    }
  },

  computed: {
    tableData () {
      return this.data ? this.data.filter(item => {
        let parent = this.data.find(row => row[this.keyId] && row[this.keyId] === item.parent_id)
        return parent && !parent._expanded ? false : true
      }) : []
    }
  },

  watch: {
    'pagination' : {
      handler(newVal, oldValue) {
        this.pager = Object.assign(this.pager, this.pagination)
        document.querySelector('.el-table__body-wrapper').scrollTop = 0
      },
      deep: true
    },
    data: {
      handler(newVal) {
        this.initFinish = newVal ? true : false

        // 本页/全部的复选框特殊处理
        if (this.specialSelection) {
          if (this.selectType === 'all') {
            this.$nextTick(() => { this.$refs.table.toggleAllSelection() })
          }
          if (this.selectType === 'current') {
            this.$nextTick(() => { this.selectType = '' })
          }
        }
      },
      immediate: true
    }
  },

  mounted() {
    this.rowDrop()
  },

  methods: {
    /**
     * 设置不可拖拽行类名
     * columnsProps.checkDisDraggable()用来自定义禁用拖拽逻辑
     * columnsProps.setSpecialRowClass()用来自定义拼接特殊行类名
     */
    setClass(row, rowIndex) {
      let className = ''
      className += this.selections.includes(row.row) ? 'high-light-row ' : ''
      if (this.columnsProps.checkDisDraggable) {
        className += this.columnsProps.checkDisDraggable(row.row) ? 'dis-draggable' : 'draggable'
      } else {
        className += row.row.isSysDefault === 1 ? 'dis-draggable' : 'draggable'
      }

      // 如需对特殊行设置类名，请配置columnsProps.setSpecialRowClass()方法，返回类名（用空格分隔）
      if (this.columnsProps.setSpecialRowClass) {
        className += ' ' + this.columnsProps.setSpecialRowClass(row.row)
      }
      return className
    },

    /**
     * 多选框是否可选，columnsProps.checkSelectable()用来自定义是否禁用复选框逻辑
     */
    isSelectable(row) {
      return this.columnsProps.checkSelectable ? this.columnsProps.checkSelectable (row) : row.isSysDefault !== 1
    },

    /**
     * 序号计算
     */
    calcIndex (index, row) {
      return row._index ||  index + this.pager.pageSize * (this.pager.currPage - 1) + 1
    },

    /**
     * 行拖拽
     */
    rowDrop() {
      const tbody = document.querySelector('.el-table__body-wrapper tbody')
      let _this = this
      // 实例化，定义初始配置
      this.sortable = Sortable.create(tbody, {
        group: 'id',
        sort: true,
        delay: 0,
        disabled: this.disdraggable,
        store: null,
        handle: '.move-icon',
        draggable: '.draggable',
        forceFallback: true,
        fallbackClass: 'dragging',
        onChoose: (evt) => {
          _this.tableData[evt.oldIndex]._expanded = false

          // 复合字段的子字段拖拽时禁用非内部字段
          if (_this.tableData[evt.oldIndex].parent) {
            let trNodes = document.querySelectorAll('.draggable')
            trNodes.forEach(node => {
              if (node.className.indexOf('child-row-' + _this.tableData[evt.oldIndex].parent.id) === -1) {
                node.className = node.className.replace('draggable', 'dis-draggable __temp')
              }
            })
          }
          else {
            let childRow = document.querySelectorAll('.child-row')
            let expandedRow = document.querySelectorAll('.complex-row')

            childRow.forEach(node => {
              node.className = node.className.replace('draggable', 'dis-draggable __temp')
            })
            expandedRow.forEach(node => {
              node.className = node.className.replace('draggable', 'dis-draggable __temp')
            })
          }
        },
        onEnd: (evt) => {
          // 类名重置
          let trNodes = document.querySelectorAll('.dis-draggable.__temp')
          if (trNodes.length > 0) {
            trNodes.forEach(node => {
              node.className = node.className.replace('dis-draggable __temp', 'draggable')
            })
          }

          if (evt.newIndex !== evt.oldIndex) {
            // 被拖拽字段ID
            const fromId = _this.tableData[evt.oldIndex].id
            // 目标字段ID
            const toId = _this.tableData[evt.newIndex].id
            // 移动方向
            const moveDirection = evt.oldIndex > evt.newIndex ? 1 : -1

            this.$emit('sort-change', {fromId, toId, moveDirection})
          }
        }
      })
    },

    /**
     * 本页/全部全选切换事件回调
     */
    changeSelectType (type) {
      if (type === this.selectType) {
        this.$nextTick(() => {
          this.selectType = ''
        })
        this.$refs.table.clearSelection()
      } else {
        this.selectType = type
        this.data.forEach(row => {
          this.$refs.table.toggleRowSelection(row, true)
        })
      }
    },

    handleSelectDropdownToggle (status) {
      this.selectDropShow = status
    },

    handleSingleChange (row) {
      this.$refs.table.toggleRowSelection(row.row, this.rowsCheckStatus[row.$index])
    },

    /**
     * 复选框改变
     */
    handleSelectionChange(selection, row) {
      this.selections = selection
      let selectedIds = ''
      selection.forEach(element => {
        selectedIds += element[this.keyId] + ','
      });
      selectedIds = selectedIds.slice(0, selectedIds.length - 1)

      // 本页/全部的复选框特殊处理
      if (this.specialSelection) {
        this.rowsCheckStatus = this.data.map(row => selectedIds.indexOf(row[this.keyId]) > -1)

        if (this.selections.length !== this.data.length && this.selectType === 'current') {
          this.selectType = ''
        }
      }

      this.$emit('selection-change', selectedIds, selection)
    },

    /**
     * 点击某一行
     */
    handleRowClick(row, column, event) {
      event.stopPropagation()
      if (this.columnsProps.listenRow) {
        this.$emit('row-click', {row, column, event})
      }
    },

    /**
     * 点击排序
     */
    handleSortChange (option) {
      this.$emit('field-sort-change', option)
    }
  }
}
</script>

<style lang="scss">
.table-not-init .el-table__empty-block {
  display: none;
}
.com-table .el-table table tr .index-col {
  width: 70px;
}
</style>