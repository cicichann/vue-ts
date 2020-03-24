<template>
  <div class="info-file">
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <!-- <router-link v-if="!$route.query.ifOneRes"
                     :to="{path: '/manage/inforepo/home', query: $pick($route.query, ['standardid', 'appid', 'categoryid', 'categoryname', 'hasChildren'])}"
                     tag="button" class="edit-btn other-btn back-btn">返回</router-link> -->
        <button :disabled="status.selectedIds.length === 0" class="edit-btn other-btn" @click="downloadClick(status.selectedIds)">下载</button>
        <!-- <button :disabled="status.selectedIds.length === 0" class="edit-btn delete-btn" @click.prevent="deleteClick(status.selectedIds)">删除</button> -->
      </div>
      <div class="fr">
        <el-input
          v-model="status.searchText"
          placeholder="请输入文件名"
          @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>
      </div>
    </div>

    <!-- 头部筛选下拉、面包屑 -->
    <div class="sub-filter">
      <ul class="manage-tag fl">
        <router-link :to="{path: '/manage/inforepo/list', query: $route.query}" title="文档" tag="li" class="tag-list"></router-link>
        <router-link :to="{path: '/manage/inforepo/pic', query: $route.query}" title="图片" tag="li" class="tag-pic"></router-link>
        <router-link :to="{path: '/manage/inforepo/video', query: $route.query}" title="视频" tag="li" class="tag-video"></router-link>
        <router-link :to="{path: '/manage/inforepo/file', query: $route.query}" title="附件" tag="li" class="tag-file active"></router-link>
      </ul>
      <trs-time-select ref="timeSelect" default-name="全部创建时间" @selectTime="queryList"></trs-time-select>
      <!-- 右侧面包屑、检索框 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/manage/inforepo/home', query: $route.query}">全部</el-breadcrumb-item>
          <el-breadcrumb-item v-if="$route.query.resourcename">{{ $route.query.resourcename }}</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- <trs-breadcrumb></trs-breadcrumb> -->
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-content flex-table">
      <div class="label-head">
        <span :class="{'fold-tags': !status.showFilter, 'expand-tags': status.showFilter}" class="fl head-tags">
          <el-tag v-for="category in status.selectedCategories" :key="category.id" :class="{'disabled-tag': category.id===$route.query.categoryid}"
                  closable style="color: #4BD083" @close="handleCloseTag(category)">{{ category.name }}</el-tag>
        </span>
        <input id="filter" v-model="status.showFilter" type="checkbox" style="display: none">
        <label :class="{'active-btn': status.showFilter}" for="filter" class="label-wrap-btn fr">筛选</label>
        <a class="fr" @click="clearSelectedLabels">清空筛选</a>
      </div>

      <!-- 标签筛选 -->
      <el-collapse-transition>
        <div v-if="status.showFilter">
          <div class="filter-wrap">
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
        :data="data.listSource"
        :columns="data.columns"
        :columns-props="data.columnsProps"
        :pagination="data.pagination"
        element-loading-text="数据加载中..."
        @selection-change="handleSelectionChange">
        <template slot-scope="item">
          <button class="list-icon download-icon" title="下载" @click="downloadClick(item.row.id)"/>
          <!-- <button class="list-icon delete-icon" title="删除" @click="deleteClick(item.row.id)"/> -->
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
import trsBreadcrumb from '@/views/common/breadcrumb/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import categoryFilter from '@/views/resourceManage/components/categoryFilter'
import { arrayFindIndex } from '@/utils/index'

export default {
  name: 'ResourceManageInfoRepoFile',

  components: {
    comTable, comPagination, trsBreadcrumb, trsTimeSelect, categoryFilter
  },

  data() {
    return {
      loading: false,
      status: {
        selectedIds: '', // 已选附件id
        searchText: '',
        showFilter: false,
        selectedCategories: []
      },
      data: {
        listSource: null, // 表格数据
        columns: [], // 表格列初始化数据
        columnsProps: {}, // 表格其他配置
        pagination: {}, //分页
        categoryList: []
      },
      ifOnlyMy: null
    }
  },

  watch: {
    '$route' (newValue) {
      this.status.showFilter = false
      this.status.selectedCategories = []

      // 选中某一分类，初始化分类筛选
      if (newValue.query.categoryname) {
        this.initCategorySelect(this.ifOnlyMy)
      } else {
        this.queryList()
      }
    },
  },

  mounted() {
    this.initProps()

    // 初始化分类筛选选中项
    this.checkOnlyMyConfigStatus().then(status => {
      if (this.$route.query.categoryname && !this.status.selectedCategories.length) {
        this.initCategorySelect(status)
      } else {
        this.queryList()
      }
    })

    // 获取完整的分类树
    this.queryCategory().then((categories) => {
      this.data.categoryList = categories.map(item => {
        return {name: item.category_name, id: item.id, hasRight: item.hasRight, parentId: item.parentId}
      })
    })
  },

  methods: {
    initProps() {
      this.data.columns = [{
        label: '文件名',
        prop: 'fileName',
        minWidth: 200,
        format: (row, prop) => {
          return '<span style="padding:5px 25px" class="file-normal file-' + row.fileName.split('.')[1] + '">' + row[prop] + '</span>'
        }
      }, {
        label: '大小',
        prop: 'fileSize',
        format: (row, prop) => {
          return this.formatSize(row[prop])
        }
      }]

      this.data.columnsProps = {
        hasSelection: true, // 是否有复选框
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
      if (sessionStorage.fileFilter) this.status.selectedCategories = JSON.parse(sessionStorage.fileFilter)
    },

    /**
     * 根据只看当前分类配置项初始化分类筛选选择项
     */
    initCategorySelect (ifOnlyMy) {
      // 只看当前分类
      if(ifOnlyMy) {
        this.getAllSubCategory({category_name: this.$route.query.categoryname, id: this.$route.query.categoryid}, ifOnlyMy)
        this.queryList()
      // 看所有子分类
      } else {
        this.loading = true
        this.queryCategory(this.$route.query.categoryid, 1).then((categories) => {
          // 节流，在切换分类时避免上次请求较慢时覆盖本次请求结果
          let curCategoryId = categories.length !== 0 ? (categories[0].parentId ? categories[0].parentId : categories[0].parent_id) : ''
          if ((!curCategoryId || this.$route.query.categoryid === curCategoryId) && this.$route.query.categoryid) {
            this.getAllSubCategory(categories, ifOnlyMy)
            this.queryList()
          }
          this.loading = false
        })
      }
    },

    /**
     * 查询一级分类
     */
    queryCategory (parentCategoryId = this.$route.query.appid ? '' : '0', containsChildren = 0) {
      let _this = this
      let params = {
        parentCategoryId: parentCategoryId,
        containsChildren: containsChildren,
        rootNodeId: this.$route.query.appStandardid
      }
      if (this.$route.query.appid && parentCategoryId === '0') params.parentCategoryId = ''

      if (+this.$route.query.parentid === 0 && this.$route.query.appid && parentCategoryId !== '') {
        params.rootCategoryId = this.$route.query.categoryid
      }

      return new Promise(resolve => {
        _this.getCategory(params).then((data) => { resolve(data) })
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

      let url = (this.$route.query.appid ? `/apps/${this.$route.query.appid}` : `/standards/${this.$route.query.standardid}/categories`) +
          (this.$route.query.resourceid ? `/resources/${this.$route.query.resourceid}` : '') + '/files'

      let params = {
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.status.searchText,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize,
        isAllCategories: 0,
        categoryId: Number(categoryIds) === 0 ? '' :categoryIds.join(','),
        rootNodeId: this.$route.query.appStandardid
      }

      this.$api.queryAttachList(url, params).then((data) => {
        this.data.listSource = data.data
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    /**
     * 检查只看当前分类配置项是否开启
     */
    checkOnlyMyConfigStatus () {
      return new Promise(resolve => {
        this.$api.checkOnlyMy().then(data => {
          this.ifOnlyMy = data === 'true'
          resolve(data === 'true')
        })
      })
    },

    /**
     * 附件大小格式化
     */
    formatSize(size) {
      let unit = parseInt(size)
      let result = ''
      if (unit < Math.pow(2, 10)) result = size + 'B'
      else if (unit > Math.pow(2, 10) && unit < Math.pow(2, 20)) result = (unit / Math.pow(2, 10)).toFixed(1) + 'KB'
      else if (unit > Math.pow(2, 20) && unit < Math.pow(2, 30)) result = (unit / Math.pow(2, 20)).toFixed(1) + 'MB'
      else if (unit > Math.pow(2, 30)) result = (unit / Math.pow(2, 30)).toFixed(1) + 'GB'
      else result = unit
      return result
    },

    handleCategoryChange (category) {
      let index = arrayFindIndex(this.status.selectedCategories, (item)=>{
        return item.id === category.id
      })
      if (index === -1) {
        this.status.selectedCategories.push(category)
      } else {
        this.status.selectedCategories.splice(index, 1)
      }
      sessionStorage.fileFilter = JSON.stringify(this.status.selectedCategories)
      this.queryList()
    },

    /**
     * 清空选择标签
     */
    clearSelectedLabels() {
      this.status.selectedCategories = this.$route.query.categoryname ? [{name: this.$route.query.categoryname, id: this.$route.query.categoryid}] : []
      sessionStorage.fileFilter = JSON.stringify(this.status.selectedCategories)
      this.queryList()
    },

    /**
     * 移除标签
     */
    handleCloseTag(category) {
      if (category.id === this.$route.query.categoryid) return

      this.status.selectedCategories.splice(this.status.selectedCategories.indexOf(category), 1)
      sessionStorage.fileFilter = JSON.stringify(this.status.selectedCategories)
      this.queryList()
    },

    /**
     * 处理选择项
     */
    handleSelectionChange(ids) {
      this.status.selectedIds = ids
    },

    /**
     * 下载
     */
    downloadClick(ids) {
      this.$trsModalConfirm({title: "下载附件", content: "是否确认下载所选附件？", danger: false}).then(() => {
        for (const id of String(ids).split(',')) {
          this.$api.downloadAttach(id)
        }
      })
    },

    /**
     * 删除
     */
    deleteClick(id) {
      this.$trsModalConfirm({content: '是否删除所选文件？', title: '确认删除', danger: true}).then(data => {
        this.$api.deleteAttach({standardId: this.$route.query.standardid, appendixids: id}, 'files').then(data => {
          this.$trsModalSuccess('删除文件成功!')
          this.queryList()
        })
      })
    }
  }
}
</script>
