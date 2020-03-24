<template>
  <div class="info-list">
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <router-link :to="{path: '/manage/inforepo/home', query: $pick($route.query, ['standardid', 'appid', 'appStandardid', 'categoryid', 'categoryname', 'hasChildren', 'parentid', 'searchText', 'searchType'])}"
                     tag="button" class="edit-btn other-btn back-btn">返回</router-link>
        <button v-if="checkRight(status.selectedIds, 'datamgt.data.withdraw')"
                :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click.prevent="deleteClick(status.selectedIds)">撤稿</button>
        <!-- 调整分类 -->
        <dropdown-btn v-if="checkRight(status.selectedIds, 'datamgt.data.changeCategory,datamgt.data.addCategory')" :disabled="status.selectedIds.length === 0" label="调整分类">
          <ul>
            <li v-if="checkRight(status.selectedIds, 'datamgt.data.changeCategory')" @click="changeCategory('replace')">替换分类</li>
            <li v-if="checkRight(status.selectedIds, 'datamgt.data.addCategory')" @click="changeCategory('add')">追加分类</li>
          </ul>
        </dropdown-btn>
        <!-- 调整标签 -->
        <dropdown-btn v-if="checkRight(status.selectedIds, 'datamgt.data.changeLabel,datamgt.data.addLabel')" :disabled="status.selectedIds.length === 0" label="调整标签">
          <ul>
            <li v-if="checkRight(status.selectedIds, 'datamgt.data.changeLabel')" @click="changeLabel('replace')">替换标签</li>
            <li v-if="checkRight(status.selectedIds, 'datamgt.data.addLabel')" @click="changeLabel('add')">追加标签</li>
          </ul>
        </dropdown-btn>
      </div>

      <div class="fr">
        <el-input v-model="status.searchText" :placeholder="'请输入' + (status.selectedSearchType ? status.selectedSearchType : '检索词')"
                  class="front-condition-type fr" @keyup.enter.native="queryList">
          <el-select slot="prepend" v-model="status.searchType" :title="status.selectedSearchType" popper-class="condition-dropdown" placeholder="类型" @change="searchTypeChange">
            <el-option label="全部" value=""></el-option>
            <el-option
              v-for="item in data.typeList"
              :key="item.id"
              :label="item.cn_name"
              :value="item.en_name"
              :title="item.cn_name"></el-option>
          </el-select>
          <i slot="suffix" style="top: 0" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 头部筛选下拉、面包屑 -->
    <div class="sub-filter">
      <ul class="manage-tag fl">
        <router-link :to="{path: '/manage/inforepo/list', query: $route.query}" title="文档" tag="li" class="tag-list active"></router-link>
        <router-link :to="{path: '/manage/inforepo/pic', query: $route.query}" title="图片" tag="li" class="tag-pic"></router-link>
        <router-link :to="{path: '/manage/inforepo/video', query: $route.query}" title="视频" tag="li" class="tag-video"></router-link>
        <router-link :to="{path: '/manage/inforepo/file', query: $route.query}" title="附件" tag="li" class="tag-file"></router-link>
      </ul>

      <el-button v-if="data.normalFilterList.length + data.timeFilterList.length > 3" :class="{'active-btn': status.showMuliSelects}"
                 class="fl set-btn" @click="status.showMuliSelects = !status.showMuliSelects">高级过滤</el-button>
      <div v-else class="select-filter fl clearfix">
        <!-- 版本稿/正式稿筛选 -->
        <el-select v-model="status.originFilterSelect" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option value="0" label="全部数据"></el-option>
          <el-option value="1" label="正式数据"></el-option>
          <el-option value="2" label="版本数据"></el-option>
        </el-select>
        <!-- 动态单选、多选、下拉筛选 -->
        <el-select v-for="item in data.normalFilterList" :key="item.name" v-model="item.choose" :placeholder="item.desc"
                   :title="item.choose" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="option in item.options"
            :key="option.desc"
            :title="option.desc"
            :label="option.desc"
            :value="option.desc">
          </el-option>
        </el-select>
        <!-- 动态时间筛选 -->
        <trs-time-select v-for="item in data.timeFilterList" :ref="item.name" :key="item.name" :options="item.options"
                         class="fl active-select" @selectTime="handleTimeChange(item.name)"/>
      </div>

      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/manage/inforepo/home', query: $route.query}">全部</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $route.query.resourcename }}</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- <trs-breadcrumb></trs-breadcrumb> -->
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content flex-table">
      <!-- 5个以上筛选 -->
      <el-collapse-transition>
        <div v-if="data.normalFilterList.length + data.timeFilterList.length > 3 && status.showMuliSelects">
          <div class="select-filter clearfix">
            <!-- 版本稿/正式稿筛选 -->
            <el-select v-model="status.originFilterSelect" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
              <el-option value="0" label="全部数据"></el-option>
              <el-option value="1" label="正式数据"></el-option>
              <el-option value="2" label="版本数据"></el-option>
            </el-select>
            <!-- 动态单选、多选、下拉筛选 -->
            <el-select v-for="item in data.normalFilterList" :key="item.name" v-model="item.choose"
                       :placeholder="item.desc" :title="item.choose" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
              <el-option v-for="option in item.options" :key="option.desc" :title="option.desc" :label="option.desc" :value="option.desc">
              </el-option>
            </el-select>
            <!-- 动态时间筛选 -->
            <trs-time-select v-for="item in data.timeFilterList" :ref="item.name" :key="item.name" :options="item.options"
                             class="fl active-select" @selectTime="handleTimeChange(item.name)"/>
          </div>
        </div>
      </el-collapse-transition>

      <!-- 已选标签、分类 -->
      <div class="label-head">
        <span :class="{'fold-tags': !status.showFilter, 'expand-tags': status.showFilter}" class="fl head-tags">
          <el-tag v-for="label in status.selectedLabels" :key="label" closable @close="handleCloseTag(label)">{{ label }}</el-tag>
          <el-tag v-for="category in status.selectedCategories" :key="category.id"
                  :class="{'disabled-tag': category.id===$route.query.categoryid}" closable style="color: #4BD083" @close="handleCloseTag(category, 'category')">
            {{ category.name }}</el-tag>
        </span>
        <input id="filter" v-model="status.showFilter" type="checkbox" style="display: none">
        <label :class="{'active-btn': status.showFilter}" for="filter" class="label-wrap-btn fr">筛选</label>
        <a class="fr" @click="clearSelectedLabels">清空筛选</a>
      </div>

      <!-- 标签筛选 -->
      <el-collapse-transition>
        <div v-if="status.showFilter">
          <div class="filter-wrap">
            <!-- 标签筛选 -->
            <div class="label-filter filter clearfix">
              <div class="filter-head fl">标签</div>
              <div class="filter-body">
                <label-filter ref="label-filter" :labels="data.labels" :selected-item="status.selectedLabels" @filteritem-change="handleLabelChange"></label-filter>
              </div>
            </div>
            <!-- 分类筛选 -->
            <div class="category-filter filter clearfix">
              <div class="filter-head fl">分类</div>
              <div class="filter-body">
                <category-filter :parent-list="data.categoryList" :selected-item="status.selectedCategories"
                                 :get-category="getCategory" @filteritem-change="handleCategoryChange"></category-filter>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>

      <!-- 表格 -->
      <com-table
        v-loading="loading"
        ref="table"
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        :special-selection="true"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange"
        @field-sort-change="handleSortChange">
        <template slot-scope="item">
          <button v-if="checkRight(String(item.row.id), 'datamgt.data.withdraw')" class="list-icon undo-icon" title="撤稿" @click.stop="deleteClick(item.row.id, item.row.isOrigin)"/>
          <el-popover v-if="checkRight(String(item.row.id), 'datamgt.data.preview')" v-model="item.row.isShowAI" popper-class="intelligent-popover" placement="bottom" width="90">
            <ul>
              <li @click="item.row.isShowAI = false; intelligentClick(item.row, 'trace')">使用轨迹</li>
              <li @click="item.row.isShowAI = false; intelligentClick(item.row, 'record')">审阅核查</li>
              <li @click="item.row.isShowAI = false; intelligentClick(item.row, 'proof')">智能校对</li>
              <li @click="item.row.isShowAI = false; intelligentClick(item.row, 'knowledgemap')">知识图谱</li>
            </ul>
            <button slot="reference" class="list-icon intelligent-icon" title="智能处理" style="display:flex"/>
          </el-popover>
          <button v-if="+item.row.isOrigin === 0" class="list-icon origin-icon" title="设为原稿" @click.stop="setOriginClick(item.row.id)"/>
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
import dropdownBtn from '@/views/common/dropdownBtn/index'
import categoryChange from '@/views/resourceManage/components/categoryChange'
import categoryFilter from '@/views/resourceManage/components/categoryFilter'
import labelChange from '@/views/resourceManage/components/labelChange'
import labelFilter from '@/views/resourceManage/components/labelFilter'
import revokeDialog from '@/views/resourceManage/components/revokeDialog'

import { TIME_TYPE } from '@/config/index'
import { initDate, arrayFindIndex, treeToArray, filterTags } from '@/utils/index'

export default {
  name: 'ResourceManageInfoRepoList',

  components: {
    comTable, comPagination, trsTimeSelect, dropdownBtn, categoryChange, categoryFilter, labelChange, labelFilter, revokeDialog, TIME_TYPE, initDate, arrayFindIndex
  },

  data() {
    return {
      loading: true,
      status: {
        searchType: '', // 检索类型
        searchText: '', // 检索输入
        showFilter: false, // 是否显示筛选
        selectedLabels: [], // 已选标签
        selectedCategories: [], // 已选分类
        selectedIds: '', // 已选字段id
        rights: {}, // 当前列表数据权限
        selectFilters: {}, // 动态下拉筛选
        showMuliSelects: false, // 高级过滤按钮是否激活
        selectedSearchType: '',
        sortOption: {
          isDesc: 1,
          orderBy: ''
        },
        originFilterSelect: '0',
        popMsg: {}
      },
      data: {
        typeList: [], // 检索字段列表
        listSource: null, // 表格数据
        columns: [], // 表格列初始化数据
        columnsProps: {}, // 表格其他配置
        pagination: {}, // 分页信息
        categoryList: [], // 一级分类列表
        labels: [], // 标签列表
        normalFilterList: [], // 动态下拉筛选列表
        timeFilterList: [] // 时间下拉筛选
      }
    }
  },

  watch: {
    'status.selectedCategories' (newVal) {
      this.queryList()
    }
  },

  mounted() {
    this.initProps()
    this.querySearchType()

    // 动态字段获取并初始化默认排序字段
    Promise.all([
      this.queryTableHead(),
      this.queryDefaultSort()
    ]).then(values => {
      if (values[1] && values[1].length > 0)  {
        this.$nextTick(() => { this.updateDefaultSort(values[1][0]) })
      }
    })

    // 初始化分类筛选选中项
    this.checkOnlyMyConfigStatus().then(status => {
      // 选择某一分类，监听到selectedCategories变化请求数据
      if (this.$route.query.categoryname && !this.status.selectedCategories.length) {
        // 只看当前分类
        if(status) {
          this.getAllSubCategory({category_name: this.$route.query.categoryname, id: this.$route.query.categoryid}, status)
        // 看所有子分类
        } else {
          this.queryCategory(this.$route.query.categoryid, 1).then((categories) => {
            this.getAllSubCategory(categories, status)
          })
        }
      } else {
        this.queryList()
      }
    })

    // 获取筛选中的一级分类
    this.queryCategory().then((categories) => {
      this.data.categoryList = categories.map(item => {
        return {name: item.category_name, id: item.id, hasRight: item.hasRight, parentId: item.parentId}
      })
    })

    this.queryLabels()
  },

  methods: {
    /**
     * 配置初始化
     */
    initProps() {
      if(this.$route.query.searchType === 'data') this.status.searchText = this.$route.query.searchText
      this.data.columnsProps = {
        hasSelection: true, // //是否有复选框
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

      // 获取记忆的筛选条件
      if (sessionStorage.listCategoryFilter) this.status.selectedCategories = JSON.parse(sessionStorage.listCategoryFilter)
      if (sessionStorage.listLabelFilter) this.status.selectedLabels = JSON.parse(sessionStorage.listLabelFilter)
    },

    /**
     * 获取检索字段类型
     */
    querySearchType() {
      let url = {
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid
      }
      let params = {
        isOverview: 1, // 0-全部字段，1-概览属性字段，2-非概览
        isSearchField: 1, // 0-全部，1-检索，2-非检索
        searchText: ''
      }
      this.$api.queryStructureTableList(url, params).then((data) => {
        // 检索字段
        this.data.typeList = treeToArray(data.rows).filter(item => item.is_overview === '是')
          .map(item => {
            if (item.parent) {
              item.cn_name = item.parent.cn_name + '-' + item.cn_name
              item.en_name = item.parent.en_name + '-' + item.en_name
            }
            return item
          })
      })
    },

    /**
     * 请求表头字段类型
     */
    queryTableHead() {
      return new Promise((resolve) => {
        let url = {
          standardId: this.$route.query.standardid,
          resourceId: this.$route.query.resourceid
        }
        let params = {
          isOverview: 1, // 0-全部字段，1-概览属性字段，2-非概览
          isSearchField: 0, // 0-全部，1-检索，2-非检索
          searchText: ''
        }
        this.$api.queryStructureTableList(url, params).then((data) => {
          // 表格字段
          let createTimeColumn = {}, createPersonColumn = {}
          this.data.columns = treeToArray(data.rows)
            .filter(item => item.is_overview === '是')
            .map((item) => {
              this.handleSelectInit(item)

              let column = {
                label: item.cn_name,
                prop: item.en_name,
                minWidth: 100,
                data: item
              }

              // 复合字段表头以 父字段名-子字段名 的形式展示
              if (item.parent) column.label = item.parent.cn_name + '-' + item.cn_name

              // 列宽设置
              if (item.field_type === 'DATE' || item.en_name === 'label' || item.parent) column.minWidth = 150
              if (item.is_title === '是') column.minWidth = 300

              if (item.parent && item.parent.field_type === 'ARRAY') column.tooltip = false
              else {
                if (item.field_type === 'DATE' || item.field_type === 'NUMERICAL') column.sort = true
              }

              column.format = (row, prop) => {
                // 复合字段-数组
                if (item.parent && item.parent.field_type === 'ARRAY') {
                  if (!row[item.parent.en_name]) return ''
                  else {
                    let content = row[item.parent.en_name]
                      .map(child => child[item.en_name])
                      .map(child => {
                        let result = this.formatContent(item, row, child || '').replace(/\s+/g, '')
                        return result.length > 100 ?  result.slice(0, 100) + '...' : result
                      })
                      .filter(child => child.length > 0)

                    return `<span title=${content.join('&#10;')}>${content.length > 0 ? content[0] : '-'}</span>`
                  }
                // 其他字段
                } else {
                  return this.formatContent(item, row, row[prop] || '')
                }
              }

              if (item.is_title === '是' ) {
                column.tooltip = false
                column.render = (row, index, prop) => {
                  const title = this.formatContent(item, row, row[prop] || '')

                  let content = this.checkRight(String(row.id), 'datamgt.data.preview') ? 
                  (<router-link title={ title } class="title-link" to={{path: '/ai/preview/', query: {standardid: this.$route.query.standardid, resourceid: this.$route.query.resourceid, dataid: row.id, isorigin: row.isOrigin}}} target="_blank">{ title }</router-link>)
                  : title

                  return +row.isOrigin === 0 ?
                  (<span>
                    <el-popover placement="bottom-start" trigger="hover" popper-class="version-detail data-prop" >
                      {Object.values(this.status.popMsg).length ? (this.status.popMsg.failMsg ? this.status.popMsg.failMsg
                        : <span>
                          与{this.status.popMsg.appName ? this.status.popMsg.appName + '发布' : ''}《
                          <a class="title-link" href={`#/ai/preview/?standardid=${row.origin.standardId}&resourceid=${row.origin.resourceId}&dataid=${row.origin.dataId}`} target="_blank">{this.status.popMsg.title}</a>
                          》[{row.origin.dataId}]因相似度过高，入版本库
                        </span>)
                        : ''}
                      <div class={Object.values(this.status.popMsg).length ? '' : 'pop-loading'} style="display: none">
                        <i class="el-icon-loading"></i>
                      </div>
                      <span class="version-icon" onMouseenter = {() => {this.handleVersionHover(row)}} slot="reference"></span>
                    </el-popover>
                    {content}
                  </span>)
                  : content
                }
              }

              if (column.prop === 'create_time') createTimeColumn = column
              if (column.prop === 'create_user') createPersonColumn = column
              return column
            })

          // 过滤创建人、创建时间
          this.data.columns = this.data.columns.filter(item => {
            return item.prop !== 'create_time' && item.prop !=='create_user'
          })

          // 创建时间和创建人放至操作列前
          if(Object.keys(createTimeColumn).length > 0) this.data.columns.push(createTimeColumn)
          if(Object.keys(createPersonColumn).length > 0) this.data.columns.push(createPersonColumn)

          resolve()
        })
      })
    },

    /**
     * 格式化字段展示
     */
    formatContent (item, row, result) {
      // 复合字段-对象解析
      if (item.parent && item.parent.field_type === 'OBJECT') {
        result = row[item.parent.en_name] ? row[item.parent.en_name][item.en_name] : ''
      }

      // 日期属性默认值格式化
      if (item.field_type === 'DATE') {
        result = initDate(result)
      }

      // 富文本解析
      if (item.field_type === 'RICH_TEXT' && result) {
        let text = result
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, '')
          .replace(/&nbsp;/g, '')
        result = text.length > 1000 ? text.slice(0, 1000) + '...' : text
      }

      // 标题字段点击跳转预览页面
      // if (item.is_title === '是') {
      //   let hasRight = this.checkRight(String(row.id), 'datamgt.data.preview')
      //   result = filterTags(result)
      //   if (result.length > 500) result = result.slice(0, 500) + '...'

      //   result = hasRight ?
      //   `<a class="title-link" href="#/ai/preview/?standardid=${this.$route.query.standardid}&resourceid=${this.$route.query.resourceid}&dataid=${row.id}" target="_blank">${result}</a>`
      //   : result
      // }
      if (item.is_title === '是') {
        result = filterTags(result)
        if (result.length > 500) result = result.slice(0, 500) + '...'
      }

      // 枚举值解析
      if (item.enum_value && result) {
        let vals = result.split(',') // 返回的字段
        let enums = JSON.parse(item.enum_value); // JSON格式枚举值
        let value = vals.map(val => {
          let enumItem = enums.filter(e => { return String(e.id) === val })
          return enumItem.length === 1 ? enumItem[0].desc : val
        })
        result = value.join(',')
      }

      // 标签字段高亮显示
      if (item.en_name === 'label') {
        var text = ''
        if (!result || result.length === 0) return ''

        result.split(',').forEach((label) => {
          text += (this.status.selectedLabels.indexOf(label) !== -1 ?
            ('<span class="high-light-label">' + label + '</span>') : ('<span>' + label + '</span>')) + ','
        })
        result = text.slice(0, text.length - 1)
      }

      return String(result || '')
    },

    /**
     * 请求默认排序字段
     */
    queryDefaultSort () {
      return new Promise((resolve) => {
        this.$api.get(`/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/sort`, {}).then(data => {
          // resolve([{attrId: 115859, isAsc: 0}])
          resolve(data)
        })
      })
    },

    /**
     * 初始排序图标状态
     */
    updateDefaultSort (data = {}) {
      let defaultSortAttr = this.data.columns.find(column => +column.data.id === data.attrId)
      
      if (defaultSortAttr) {
        let table = this.$refs.table.$refs.table
        table.clearSort()

        let column = table.columns.find(column => column.label === defaultSortAttr.label)
        column.order = +data.isAsc === 0 ? 'descending' : 'ascending'
      }
    },

    /**
     * 查询分类
     */
    queryCategory (parentCategoryId = this.$route.query.appid ? '' : '0', containsChildren = 0) {
      return new Promise(resolve => {
        let params = {
          parentCategoryId: parentCategoryId,
          containsChildren: containsChildren,
          rootNodeId: this.$route.query.appStandardid
        }
        if (+this.$route.query.parentid === 0 && this.$route.query.appid && parentCategoryId !== '') {
          params.rootCategoryId = this.$route.query.categoryid
        }
        this.getCategory(params).then(data => { resolve(data) })
      })
    },

    /**
     * 获取分类，按需加载
     */
    getCategory (params) {
      let type = this.$route.query.appid ? 'app' : 'standard'

      return new Promise((resolve) => {
        if (type === 'standard') {
          this.$api.queryResClassifyListAuth({standardId: this.$route.query.standardid}, params).then((data) => { resolve (data) })
        } else {
          this.$api.queryAppResClassifyList({appId: this.$route.query.appid}, params).then((data) => { resolve (data) })
        }
      })
    },

    /**
     * 分类树遍历获取全部子分类
     */
    getAllSubCategory (categories, ifOnlyMy) {
      this.status.selectedCategories = []

      // 只看当前分类配置项未开启，以当前选中分类及其子分类为筛选条件进行检索
      if (!ifOnlyMy) {
        let categoryStack = []

        categories.forEach(category => { categoryStack.push(category) })

        while (categoryStack.length) {
          let category = categoryStack.shift()

          this.status.selectedCategories.push({name: category.category_name, id: category.id})

          if (category.children && category.children.length) {
            categoryStack = categoryStack.concat(category.children)
          }
        }
      }
      this.status.selectedCategories.unshift({name: this.$route.query.categoryname, id: this.$route.query.categoryid})
    },

    /**
     * 列表数据请求
     */
    queryList(page) {
      this.loading = true
      let categoryIds = this.status.selectedCategories.map(category => { return category.id })
      let url = (this.$route.query.appid ? `/apps/${this.$route.query.appid}` : `/standards/${this.$route.query.standardid}`) +
          `/categories/resources/${this.$route.query.resourceid}/data`

      // 动态筛选参数拼接
      let specialSearch = []
      this.data.normalFilterList.forEach(item => {
        if (item.choose !== item.desc) {
          specialSearch.push({field: item.name, text: item.choose, type: item.type})
        }
      })
      this.data.timeFilterList.forEach(item => {
        if (item.choose === 'ALL') return
        let selectItem = {field: item.name, text: item.choose, type: 'DATE'}
        if (item.choose === 'CUSTOM') {
          selectItem.beginTime = item.beginTime
          selectItem.endTime = item.endTime
        }
        specialSearch.push(selectItem)
      })

      let params = {
        searchField: this.status.searchType,
        searchText: this.status.searchText,
        label: this.status.selectedLabels.join(','),
        specialSearch: specialSearch.length === 0 ? '' : JSON.stringify(specialSearch),
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize,
        isAllCategories: 0,
        isOrigin: this.status.originFilterSelect,
        standardId: this.$route.query.standardid,
        categoryId: Number(categoryIds) === 0 ? '' :categoryIds.join(','),
        rootNodeId: this.$route.query.appStandardid
      }
      if (this.status.sortOption.orderBy) params = Object.assign(params, this.status.sortOption)

      // 异步的接口请求缓慢时切换页面，获取不到resourceid接口会报错
      if (this.$route.query.resourceid) {
        this.$api.queryResource(url, params).then((data) => {
          this.data.listSource = data.data
          this.data.pagination = Object.assign(this.data.pagination, data.pager)

          // 请求每条数据的操作权限
          if ((this.status.selectedCategories.length !== 1 || this.$route.query.appid) && data.data.length > 0) {
            let dataIds = data.data.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
            let categoryIds = this.status.selectedCategories.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
            this.querySourceRight(dataIds, categoryIds).then(data => {
              this.loading = false
            })
          } else this.loading = false
        }, err => {
          this.loading = false
        })
      } else {
        this.loading = false
      }
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
     * 请求标签列表
     */
    queryLabels () {
      let url = ''
      if (this.$route.query.categoryid) {
        url = `/standards/${this.$route.query.standardid}/categories/${this.$route.query.categoryid}/resources/${this.$route.query.resourceid}/labels`
      } else {
        url = `/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/labels`
      }

      this.$api.queryLabelList(url, {pageIndex: 1}).then((data) => this.data.labels = data.data)
    },

    /**
     * 全部分类、有分类筛选条件下初始化单张数据表权限
     */
    checkRight (ids, key) {
      if (this.status.selectedCategories.length !== 1 && !this.loading && this.data.listSource) {
        // 有权限的数据id集合
        let checkIds = ids ? ids : this.data.listSource.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
        let hasRightId = checkIds.split(',').filter((id) => {
          return this.status.rights[id] ? this.status.rights[id].find(right => ~key.indexOf(right.name)) : false
        }).join(',')
        return hasRightId === checkIds || (hasRightId && !ids)
      } else {
        return this.$checkRight(key)
      }
    },

    /**
     * 处理动态筛选下拉初始化
     */
    handleSelectInit (item) {
      let cn_name = item.parent ? (item.parent.cn_name + '-' + item.cn_name) : item.cn_name
      let en_name = item.parent ? (item.parent.en_name + '-' + item.en_name) : item.en_name

      let filterType = ['RADIO', 'CHECK', 'SELECT']
      if (filterType.indexOf(item.field_type) >= 0) {
        let options = JSON.parse(item.enum_value)
        options.unshift({'desc': '全部' + cn_name, 'id': '0'})
        this.data.normalFilterList.push({
          name: en_name,
          desc: '全部' + cn_name,
          choose: '全部' + cn_name,
          type: item.field_type,
          options: options
        })
      }
      if (item.field_type === 'DATE') {
        let options = JSON.parse(JSON.stringify(TIME_TYPE))
        options[0].name = '全部' + cn_name
        this.data.timeFilterList.push({
          name: en_name,
          options: options,
          type: 'DATE',
          choose: 'ALL'
        })
      }
    },

    /**
     * 调整分类
     */
    changeCategory (type) {
      let option = {
        dataIds: this.$refs.table.selectType === 'all' ? '' : this.status.selectedIds,
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid,
        containsAll: this.$refs.table.selectType === 'all' ? 1 : 0,
        type: type,
        params: {}
      }
      if (this.status.selectedCategories.length > 0) {
        option.categoryIds = this.status.selectedCategories.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
      }
      if (this.$route.query.appid) {
        option.params.appId = this.$route.query.appid
      }
      if (this.$route.query.appStandardid) {
        option.params.rootNodeId = this.$route.query.appStandardid
      }

      // 只看当前分类开关开启且全选时，所属分类取当前分类
      this.checkOnlyMyConfigStatus().then(status => {
        if (this.$route.query.categoryid && status) {
          option.curCategory = { id: this.$route.query.categoryid, name: this.$route.query.categoryname }
        }
        this.$dialog(categoryChange, option).then(() => {
          this.queryList()
        })
      })
    },

    /**
     * 调整标签
     */
    changeLabel (type) {
      let option = {
        dataIds: this.$refs.table.selectType === 'all' ? '' : this.status.selectedIds,
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid,
        containsAll: this.$refs.table.selectType === 'all' ? 1 : 0,
        type: type,
        params: {}
      }
      if (this.status.selectedCategories.length > 0) {
        option.categoryIds = this.status.selectedCategories.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
      }
      if (this.$route.query.appid) {
        option.params.appId = this.$route.query.appid
      }
      if (this.$route.query.appStandardid) {
        option.params.rootNodeId = this.$route.query.appStandardid
      }

      this.$dialog(labelChange, option).then(() => {
        this.queryList()
        this.queryLabels()
      })
    },

    /**
     * 时间类型动态下拉值变化
     */
    handleTimeChange (name) {
      let curChange = this.data.timeFilterList.find(item => {return item.name === name})
      curChange.choose = this.$refs[name][0].selected.value
      curChange.beginTime = this.$refs[name][0].timeProp.fromTime
      curChange.endTime = this.$refs[name][0].timeProp.endTime
      this.queryList()
    },

    /**
     * 标签筛选选择回调
     */
    handleLabelChange (label) {
      let index = this.status.selectedLabels.indexOf(label)
      if (index === -1) {
        this.status.selectedLabels.push(label)
      } else {
        this.status.selectedLabels.splice(index, 1)
      }
      sessionStorage.listLabelFilter = JSON.stringify(this.status.selectedLabels)

      this.queryList()
    },

    /**
     * 分类筛选选择回调
     */
    handleCategoryChange (category) {
      let index = arrayFindIndex(this.status.selectedCategories, (item)=>{
        return item.id === category.id
      })
      if (index === -1) {
        this.status.selectedCategories.push(category)
      } else {
        this.status.selectedCategories.splice(index, 1)
      }
      sessionStorage.listCategoryFilter = JSON.stringify(this.status.selectedCategories)
    },

    /**
     * 清空选择标签
     */
    clearSelectedLabels() {
      this.status.selectedLabels = []
      this.status.selectedCategories = this.$route.query.categoryname ? [{name: this.$route.query.categoryname, id: this.$route.query.categoryid}] : []
      sessionStorage.listCategoryFilter = JSON.stringify(this.status.selectedCategories)
      sessionStorage.listLabelFilter = JSON.stringify(this.status.selectedLabels)
      this.queryList()
    },

    /**
     * 移除标签
     */
    handleCloseTag(label, type) {
      if (type === 'category' && label.id === this.$route.query.categoryid) return

      if (type === 'category') {
        this.status.selectedCategories.splice(this.status.selectedCategories.indexOf(label), 1)
      } else {
        this.status.selectedLabels.splice(this.status.selectedLabels.indexOf(label), 1)
        this.queryList()
      }
      sessionStorage.listCategoryFilter = JSON.stringify(this.status.selectedCategories)
      sessionStorage.listLabelFilter = JSON.stringify(this.status.selectedLabels)
    },

    /**
     * 处理选择项
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /**
     * 自定义排序事件处理
     */
    handleSortChange ({column, prop, order}) {
      // 解决手动切换时默认排序未清空的问题
      if (column) {
        let sortColumns = this.$refs.table.$refs.table.columns.filter(item => item.label && item.label !== column.label)
        if(sortColumns.length) sortColumns.forEach(item => { item.order = '' })
      }

      if (!prop) {
        this.status.sortOption = {}
      } else {
        const columnData = this.data.columns.find(item => item.label === column.label)
        if (columnData) this.status.sortOption = { isDesc: order === 'ascending' ? 0 : 1, orderBy: columnData.data.id }
      }

      this.queryList()
    },

    searchTypeChange (value) {
      let selectedItem = this.data.typeList.find(item => { return item.en_name === value })
      this.status.selectedSearchType = selectedItem ? selectedItem.cn_name : ''
    },

    /**
     * 相似的过高文章入版本库的信息hover显示
     */
    handleVersionHover(row) {
      this.status.popMsg = {}
      let params = {
        standardId: row.origin.standardId,
        resourceId: row.origin.resourceId
      }
      this.$api.queryVersionDate({ id: row.origin.dataId }, params).then(data => {
        this.status.popMsg = data
      })
    },

    /**
     * 智能处理
     */
    intelligentClick(row, type) {
      const params = {
        standardid: this.$route.query.standardid,
        categoryid: this.$route.query.categoryid,
        resourceid: this.$route.query.resourceid,
        dataid: row.id,
        isorigin: row.isOrigin
      }
      const { href } = this.$router.resolve({path: `/ai/${type}`, query: params})
      window.open(href, '_blank')
    },

    /**
     * 撤稿
     */
    deleteClick (id, type = null) {
      let url = {
        standardId: this.$route.query.standardid,
        resourceId: this.$route.query.resourceid
      }
      let params = {
        dataIds: this.$refs.table.selectType === 'all' ? '' : id,
        containsAll: this.$refs.table.selectType === 'all' ? 1 : 0
      }
      if (this.status.selectedCategories.length > 0) {
        params.categoryIds = this.status.selectedCategories.reduce((all, item) => { return all + (all ? ',' : '') + item.id }, '')
      }
      if (this.$route.query.appid) {
        params.appId = this.$route.query.appid
      }
      if (this.$route.query.appStandardid) {
        params.rootNodeId = this.$route.query.appStandardid
      }

      this.$dialog(revokeDialog, {url: url, params: params, type: type}).then(() => {
        this.queryList()
      })
    },

    /**
     * 设为原稿
     */
    setOriginClick (id) {
      this.$trsModalConfirm({
        content: '新原稿将替换旧原稿，版本稿会关联到新原稿，<br/>是否确认将所选文档设为原稿？',
        title: '设为原稿',
        danger: true
      }).then(data => {
        this.$api.post(`/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data/${id}/origin`).then(data => {
          this.$trsModalSuccess('设为原稿成功!')
          this.queryList()
        })
      })
    }
  }
}
</script>
