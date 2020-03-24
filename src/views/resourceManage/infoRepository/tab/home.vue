<template>
  <div class="info-home">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <ul :class="{'no-switch': (!$route.query.categoryname || $route.query.hasChildren == 0)}" class="manage-tag fr">
          <router-link :to="{path: '/manage/inforepo/list', query: $route.query}" title="文档" tag="li" class="tag-list active"></router-link>
          <router-link :to="{path: '/manage/inforepo/pic', query: $route.query}" title="图片" tag="li" class="tag-pic"></router-link>
          <router-link :to="{path: '/manage/inforepo/video', query: $route.query}" title="视频" tag="li" class="tag-video"></router-link>
          <router-link :to="{path: '/manage/inforepo/file', query: $route.query}" title="附件" tag="li" class="tag-file"></router-link>
        </ul>
      </div>

      <!-- 右侧面包屑、检索 -->
      <div class="fr clearfix">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item>全部</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- <trs-breadcrumb></trs-breadcrumb> -->
        <el-input
          v-model="status.searchText"
          :placeholder="'请输入' + (status.searchType === 'data' ? '检索词' : '数据表名称')"
          class="condition-input fr"
          @keyup.enter.native="handleTypeClick(status.searchType)">
          <template slot="append"><button :class="{'active-btn': status.searchType === 'resource'}" @keyup.enter="handleTypeClick('resource')"
                                          @click="handleTypeClick('resource')">搜数据表</button><!--
            --><button :class="{'active-btn': status.searchType === 'data'}" @keyup.enter="handleTypeClick('data')" @click="handleTypeClick('data')">搜数据</button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 主体 -->
    <div class="table-content" style="height:calc(100vh - 140px);">
      <div v-loading="loading" :class="{'uirb-no-data': data.list && data.list.length === 0 && !loading}" element-loading-text="数据加载中..." class="card-wrap">
        <ul>
          <li v-for="(item, index) in data.list" :key="index" class="card-item" @click="moveTo(item)">
            <p :title="item.resource_name" class="resource-name">{{ item.resource_name }}</p>
            <p class="resource-id">{{ "ID:" + item.id }}</p>
            <p class="resource-count"><span>{{ item.data_count }}</span>条数据</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import trsBreadcrumb from '@/views/common/breadcrumb/index'

export default {
  name: 'ResourceManageInfoRepoHome',

  components: {
    trsBreadcrumb
  },

  data() {
    return {
      loading: false,
      status: {
        searchType: 'resource', // 检索类型
        searchText: '' // 检索值
      },
      data: {
        list: null // 全部分类
      }
    }
  },

  watch: {
    '$route': function(newValue) {
      this.params = newValue.query
      this.status.searchText = ''
      this.data.list = null
      this.queryList()
    },
    'data.list' (newValue, oldValue) {
      // 初始选择分类进入时，若当前分类只有一个资源，直接进入该资源列表
      if (!oldValue && newValue.length === 1 && this.$route.query.isMounted === 1) {
        this.moveTo(newValue[0], true)
      }
    }
  },

  // tab切换时重置数据
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.params = to.query
      vm.status.searchText = to.query.searchText
      vm.queryList()
    })
  },

  mounted() {
    this.status.searchType = this.$route.query.searchType || 'resource'
    this.status.searchText = this.$route.query.searchText
  },

  methods: {
    /**
     * 列表数据请求
     */
    queryList() {
      this.loading = true
      let url = (this.$route.query.appid ? `/apps/${this.$route.query.appid}` : `/standards/${this.$route.query.standardid}`)+
        (this.$route.query.categoryid ? `/categories/${this.$route.query.categoryid}` : '') + `/resources/data/count`

      let params = {
        searchType: this.status.searchType,
        searchText: this.status.searchText,
        pageIndex: 1,
        pageSize: 1000,
        categoryType: +this.$route.query.parentid === 0 ? 0 : 1,
        rootNodeId: this.$route.query.appStandardid
      }

      this.$api.queryResourceCount(url, params).then((data) => {
        this.data.list = data.data
        this.loading = false
      })
    },

    /**
     * 查看数据列表
     */
    moveTo(item, ifOneRes) {
      let params = {
        appid: this.$route.query.appid,
        standardid: item.standardId || this.$route.query.standardid,
        categoryid: this.$route.query.categoryid ? this.$route.query.categoryid : 0,
        resourceid: item.id,
        categoryname: this.$route.query.categoryname,
        resourcename: item.resource_name,
        hasChildren: this.$route.query.hasChildren,
        parentid: this.$route.query.parentid,
        searchText: this.status.searchText,
        searchType: this.status.searchType
      }
      if (ifOneRes) params.ifOneRes = 1
      if (this.$route.query.appStandardid) params.appStandardid = this.$route.query.appStandardid

      this.$router.push({ path: '/manage/inforepo/list', query: params})
    },

    /**
     * 检索
     */
    handleTypeClick(type) {
      this.status.searchType = type
      this.queryList()
    }
  }
}
</script>
