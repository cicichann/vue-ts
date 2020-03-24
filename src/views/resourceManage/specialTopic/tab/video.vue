<template>
  <div>
    <!-- 头部按钮、搜索 -->
    <div class="sub-nav">
      <div class="fl">
        <button :disabled="data.selectedArray.length === 0" class="edit-btn other-btn" @click="downloadVideo()">下载</button>
      </div>
      <div class="fr">
        <el-input v-model="data.searchValue" placeholder="请输入文件名" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="searchVideo"/>
        </el-input>
      </div>
    </div>

    <!-- 头部筛选下拉、面包屑 -->
    <div class="sub-filter">
      <ul class="manage-tag fl">
        <router-link :to="{path: '/manage/topic/list', query: $route.query}" title="文档" tag="li" class="tag-list"></router-link>
        <router-link :to="{path: '/manage/topic/pic', query: $route.query}" title="图片" tag="li" class="tag-pic"></router-link>
        <router-link :to="{path: '/manage/topic/video', query: $route.query}" title="视频" tag="li" class="tag-video active"></router-link>
        <router-link :to="{path: '/manage/topic/file', query: $route.query}" title="附件" tag="li" class="tag-file"></router-link>
      </ul>
      <trs-time-select ref="timeSelect" default-name="全部创建时间" @selectTime="queryList"></trs-time-select>
      <!-- 右侧面包屑、检索框 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item :to="{path: '/manage/topic/home', query: $route.query}">全部</el-breadcrumb-item>
          <el-breadcrumb-item v-if="$route.query.resourcename">{{ $route.query.resourcename }}</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- <trs-breadcrumb></trs-breadcrumb> -->
      </div>
    </div>

    <div class="table-content flex-table">
      <div class="label-head">
        <span :class="{'fold-tags': !status.showFilter, 'expand-tags': status.showFilter}" class="fl head-tags">
          <el-tag v-for="category in status.selectedCategories" :key="category.id" :class="{'disabled-tag': category.id===$route.query.categoryid}"
                  closable style="color: #4BD083" @close="handleCloseTag(category)">{{ category.name }}</el-tag>
        </span>
        <input id="filter" v-model="status.showFilter" type="checkbox" style="visibility: hidden">
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
                <category-filter :parent-list="data.categoryList" :selected-item="status.selectedCategories" :check-disabled="checkCategoryDisabled"
                                 :get-category="getCategory" @filteritem-change="handleCategoryChange"></category-filter>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>

      <!-- 视频列表 -->
      <div v-loading="loading" :class="{'uirb-no-data': data.listSource.length === 0 && !loading}" class="card-wrap" element-loading-text="数据加载中..." style="margin: 10px 15px">
        <ul class="card-list clearfix">
          <li v-for="(item, $index) in data.listSource" :key="$index" class="info-repo-card video" @click="playVideo(item, $event)">
            <el-checkbox v-model="data.selectedArray" :label="item.id" @click="selectedChange(item.id)"></el-checkbox>
            <!-- <p class="video-time">{{ item.time || "02:13" }}</p> -->
            <img :src="item.thumbPic" alt="">
            <p class="desc overflow">
              <span>{{ item.fileName }}</span>
              <button style="display:none" class="list-icon download" title="下载" @click.stop="downloadVideo(item.id)"/>
            </p>
          </li>
        </ul>
      </div>
      <!-- 分页 -->
      <com-pagination :pagination="data.pagination" @callback="queryList"></com-pagination>
    </div>
  </div>
</template>

<script>
import comPagination from '@/views/common/pagination'
import trsBreadcrumb from '@/views/common/breadcrumb/index'
import trsTimeSelect from '@/views/common/timeSelect/index'
import categoryFilter from '@/views/resourceManage/components/categoryFilter'
import { arrayFindIndex } from '@/utils/index'

export default {
  name: 'ResourceManageInfoRepoViedo',

  components: {
    comPagination, trsBreadcrumb, trsTimeSelect, categoryFilter
  },

  props: {
    topicMsg: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      loading: false,
      status: {
        showFilter: false,
        selectedCategories: []
      },
      data: {
        listSource: [], // 表格数据
        selectedArray: [],  // 已选项
        searchValue: '',
        pagination: {
          itemCount: 0,
          currPage: 1,
          pageSize: 35,
          pageSizes: [35, 70, 105, 140, 175],
        },
        categoryList: []
      }
    }
  },

  watch: {
    '$route' (newValue) {
      this.status.showFilter = false
      this.status.selectedCategories = []

      this.initSelected()
      this.queryList()
    },
    'data.pagination' : {
      // 滚动条回滚到顶部
      handler(newVal, oldValue) {
        document.querySelector('.card-wrap').scrollTop = 0
      },
      deep: true
    }
  },

  mounted() {
    this.initSelected()
    this.queryList()
  },

  methods: {
    /**
     * 初始化分类筛选项
     */
    initSelected () {
      if (this.topicMsg) {
        this.status.selectedCategories = this.topicMsg.categories.map(category => ({id: category.id, name: category.categoryName}))

        // 获取筛选中的分类树
        const categoryIds = this.topicMsg.categories.map(category => category.id).join(',')
        this.$api.get(`/standards/${this.$route.query.standardid}/dissertations/categories/authorization`, {categoryIds: categoryIds})
          .then((categories) => {
            this.data.categoryList = categories.map(item => {
              // 禁用除了已选分类及其子分类的其他分类，全部分类下（已选为空）不禁用
              // 不要忘了没有授权的分类也会禁用哦，(〒︿〒)
              const disabled = this.status.selectedCategories.length === 0 ? false : !this.status.selectedCategories.some(selected => selected.id === item.id)
              return {name: item.category_name, id: item.id, hasRight: item.hasRight, parentId: item.parentId, disabled: disabled}
            })
          })
      }
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
     * 请求视频列表
     * @param page 分页信息
     */
    queryList(page) {
      this.loading = true
      let categoryIds = this.status.selectedCategories.map(category => { return category.id })

      let url = `/standards/${this.$route.query.standardid}/dissertations/${this.$route.query.topicid}` +
          (this.$route.query.resourceid ? `/resources/${this.$route.query.resourceid}` : '') + '/videos'

      let params = {
        granularity: this.$refs.timeSelect.selected.value,
        beginDateTime: this.$refs.timeSelect.timeProp.fromTime,
        endDateTime: this.$refs.timeSelect.timeProp.endTime,
        searchText: this.data.searchValue,
        pageIndex: page && page.currPage || 1,
        pageSize: page && page.pageSize || this.data.pagination.pageSize,
        isAllCategories: 0,
        categoryId: Number(categoryIds) === 0 ? '' :categoryIds.join(','),
        searchKeys: this.topicMsg.keyWord,
        resourceIds: this.topicMsg.resources.map(resource => resource.id).join(',')
      }

      this.$api.queryAttachList(url, params).then((data) => {
        this.data.listSource = data.data
        this.data.selectedArray.splice(0)
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.loading = false
      })
    },

    checkCategoryDisabled (item, parent) {
      return this.topicMsg.categories.some(category => category.id === item.id) ? false : parent.disabled
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
      this.queryList()
    },

    /**
     * 清空选择标签
     */
    clearSelectedLabels() {
      this.status.selectedCategories = this.$route.query.categoryname ? [{name: this.$route.query.categoryname, id: this.$route.query.categoryid}] : []
      this.queryList()
    },

    /**
     * 移除标签
     */
    handleCloseTag(category) {
      if (category.id === this.$route.query.categoryid) return

      this.status.selectedCategories.splice(this.status.selectedCategories.indexOf(category), 1)
      this.queryList()
    },

    selectedChange (id) {
      if (this.data.selectedArray.indexOf(id)) {
        this.data.selectedArray.slice(this.data.selectedArray.indexOf(id), 1)
      } else {
        this.data.selectedArray.push(id)
      }
    },

    /**
     * 下载视频文件
     */
    downloadVideo(id) {
      this.$trsModalConfirm({title: '下载视频', content: '是否确认下载所选视频？', danger: false}).then(() => {
        if (id) {
          this.$api.downloadVideo(id).then(data => { window.open(data) })
        } else {
          for (const id of this.data.selectedArray) {
            this.$api.downloadVideo(id).then(data => { window.open(data) })
          }
        }
      })
    },

    /**
     * 删除视频
     */
    deleteVideo() {
      this.$trsModalConfirm({title: '删除视频', content: '是否确认删除所选视频？', danger: true}).then(() => {
        this.$api.deleteAttach({
            standardId: this.$route.query.standardid,
            appendixids: this.data.selectedArray.join(',')
          }, 'videos')
          .then(() => {
            this.data.selectedArray.splice(0)
            this.$trsModalSuccess('删除视频成功!')
            this.queryList()
          }, () => {
            this.data.selectedArray.splice(0)
          })
      })
    },

    /**
     * 检索视频
     */
    searchVideo() {
      this.data.pagination.currPage = 1
      this.queryList()
    },

    /**
     * 播放视频
     */
    playVideo(item, $event) {
      if ($event.target.className.indexOf('el-checkbox') >= 0) return
      window.open(item.accessUrl, '_blank')
    }
  }
}
</script>
