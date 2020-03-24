<template>
  <div class="info-home">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮群 -->
      <div class="fl">
        <!-- <button :disabled="data.list && data.list.length === 0" class="edit-btn other-btn" @click="handleReductionClick">全部还原</button> -->
        <button v-access="'recyclebin.recyclebin.removeall'" :disabled="data.list && data.list.length === 0" class="edit-btn delete-btn" @click="clearRecycle">清空回收站</button>
      </div>
      <!-- 右侧面包屑、检索 -->
      <div class="fr clearfix">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item>全部</el-breadcrumb-item>
        </el-breadcrumb>
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
import deleteDialog from './components/deleteDialog'

export default {
  name: 'ResourceManageInfoRepoHome',

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
      let url = `/recycleBin/standards/${this.$route.query.standardid}/`
       + (+this.$route.query.categoryid ? `categories/${this.$route.query.categoryid}/` : '')
       + `resources/data/count`

      let params = {
        searchType: this.status.searchType,
        searchText: this.status.searchText,
        pageIndex: 1,
        pageSize: 1000
      }

      this.checkOnlyMyConfigStatus().then(data => {
        params.onlyMe = data ? 1 : 0
        this.$api.get(url, params).then((data) => {
          this.data.list = data.data
          this.loading = false
        })
      })
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
     * 查看数据列表
     */
    moveTo(item, ifOneRes) {
      let params = {
        standardid: item.standardId || this.$route.query.standardid,
        categoryid: this.$route.query.categoryid ? this.$route.query.categoryid : 0,
        resourceid: item.id,
        categoryname: this.$route.query.categoryname,
        resourcename: item.resource_name,
        searchText: this.status.searchText,
        searchType: this.status.searchType
      }
      if (ifOneRes) params.ifOneRes = 1

      this.$router.push({ path: '/recycle/list', query: params})
    },

    /**
     * 检索
     */
    handleTypeClick(type) {
      this.status.searchType = type
      this.queryList()
    },

    handleReductionClick () {
      this.$trsModalConfirm({
        content: '是否确认还原全部？',
        title: '全部还原',
        danger: false
      }).then(data => {
        const url = `/recycleBin/standards/${this.$route.query.standardid}/resources/data`
        this.$api.post(url, {categoryId: this.$route.query.categoryid}).then(() => {
          this.$trsModalSuccess('全部还原成功!')
          this.queryList()
        })
      })
    },

    clearRecycle () {
      const url = `/recycleBin/standards/${this.$route.query.standardid}/resources/data`
      this.$dialog(deleteDialog, {
        url: url,
        params: {categoryId: this.$route.query.categoryid},
        tipMsg: '清空回收站将清除标准下所有回收站的数据，<br>清除后无法还原，确定清空？',
        title: '清空回收站'
      }).then(() => {
        this.$trsModalSuccess('清空回收站成功！')
        this.queryList()
      })
    }
  }
}
</script>
