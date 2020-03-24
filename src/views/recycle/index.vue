<template>
  <div class="recycle-module resource-manage">
    <com-header module-name="回收站"/>
    
    <div class="recycle-wrap resource-inforepo">
      <div v-if="data.standardList.length > 0 || !status.initFinish">
        <!-- 左侧菜单 -->
        <div class="side-bar">
          <!-- 标准下拉 -->
          <standard-menu ref="standardMenu" @callback="handleStandardClick"/>

          <!-- 分类模糊检索 -->
          <div v-clickoutside="handleClose" style="position: relative;">
            <el-input v-model="status.searchText" class="search-input" placeholder="请输入分类名称" suffix-icon="search"
                      @input="querySearchList" @focus="status.isResultShow = true">
              <i slot="suffix" class="input-icon" />
            </el-input>
            <div v-if="status.isResultShow && status.searchText.length > 0" class="search-result">
              <ul class="uirb-dropdown">
                <li v-for="item in data.resultList" :key="item.path" :title="item.title" @click="locateItem(item)" v-html="item.nav" />
                <div v-loading="loading" v-if="data.resultList.length === 0" class="search-no-data">暂无数据</div>
              </ul>
            </div>
          </div>

          <!-- 分类列表 -->
          <side-menu v-show="data.classificationList.length > 0" ref="sideMenu" :data="data.classificationList" :standard-id="status.standardId"
                     :get-category="getCategory" @categoryChange="handleCategoryChange"/>
        </div>

        <!-- 右侧 -->
        <div class="content-container">
          <router-view/>
          <editionFooter></editionFooter>
        </div>
      </div>

      <!-- 暂无标准情况 -->
      <div v-else class="uirb-no-data-img">
        <p class="no-data-tip">暂无可见标准</p>
        <editionFooter></editionFooter>
      </div>
    </div>
  </div>
</template>

<script>
import comHeader from '@/views/common/header/index'
import standardMenu from '@/views/common/standardMenu/index.vue'
import sideMenu from '@/views/common/tree/index.vue'
import editionFooter from '@/views/common/footer/footer.vue'
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'ResourceManageInfoRepo',

  components: {
    comHeader,
    standardMenu,
    sideMenu,
    editionFooter
  },

  directives: { Clickoutside },

  data() {
    return {
      status: {
        standardId: '',
        searchText: '',
        isResultShow: false,
        initFinish: false
      },
      data: {
        classificationList: [], // 分类列表
        defaultProps: {}, // 树组件传配置
        standardList: [],
        resultList: []
      },
      loading: false
    }
  },

  watch: {
    '$route' (value, oldVal) {
      this.status.searchText = ''
    },
    '$route.query.standardid' () {
      this.status.searchText = ''
    },
  },

  methods: {
    /**
     * 请求标准下分类列表
     */
    queryList() {
      let params = {
        parentCategoryId: 0
      }

      this.$api.queryResClassifyListAuth({standardId: this.status.standardId}, params).then(data => {
        data.unshift({ category_name: '全部分类', id: 0, hasChildren: 0 })
        this.$router.push({ path: '/recycle/home', query: { standardid: this.status.standardId, categoryid: 0, isMounted: 1 } })
        this.data.classificationList = data
      })
    },

    /**
     * 获取分类，按需加载
     */
    getCategory (params) {
      return new Promise((resolve) => {
        this.$api.queryResClassifyListAuth({standardId: this.status.standardId}, params).then((data) => { resolve (data) })
      })
    },

    /**
     * 检索分类
     */
    querySearchList() {
      this.loading = true
      this.data.resultList = []
      let params = {
        rootNodeId: this.$route.query.appStandardid,
        searchText: this.status.searchText,
        pageIndex: 1,
        pageSize: 10
      }
      this.$api.vagueSearchAuth({ standardId: this.status.standardId, appId: this.$route.query.appid }, params).then(data => {
        this.data.resultList = data.slice(0, 10)
        this.loading = false
        this.status.isResultShow = true

        this.data.resultList.forEach((item, index) => {
          item.title = item.nav
          if(this.status.searchText !== '') {
            var arr = item.nav.split('/')
            var key = this.status.searchText
            arr[arr.length - 1] = arr[arr.length - 1].replace(new RegExp(key, 'g'), `<span class="red-word">${this.status.searchText}</span>`)
            item.nav = arr.join('/')
          } else {
            this.status.isResultShow = false
          }
        })
      })
    },

    /**
     * 切换标准
     */
    handleStandardClick(item, list) {
      if (list) this.data.standardList = list

      this.status.standardId = item.id
      this.status.initFinish = true

      if (item.id) this.queryList()
    },

    handleCategoryChange (data) {
      let params = {
        standardid: this.$route.query.standardid,
        categoryid: data.id,
        categoryname: data.category_name.trim(),
        isMounted: 1
      }
      this.$router.push({ path: '/recycle/home', query: params })
    },

    /**
     * 关闭检索结果页
     */
    handleClose () {
      this.status.isResultShow = false
    },

    /**
     * 定位检索节点在分类树中的位置
     */
    locateItem(data) {
      if (data.id) {
        this.status.isResultShow = false
        this.$refs.sideMenu.locateNode(data.id)
      }
    }
  }
}
</script>

<style lang="scss"></style>
