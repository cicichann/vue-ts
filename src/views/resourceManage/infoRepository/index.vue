<template>
  <div class="resource-inforepo">
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

        <!-- 已选应用名称 -->
        <p v-if="status.appName" :title="'应用—' + status.appName" class="overflow app-name">{{ '应用—' + status.appName }}</p>

        <!-- 分类列表 -->
        <side-menu v-show="data.classificationList.length > 0" ref="sideMenu" :data="data.classificationList" :type="status.type" :standard-id="status.standard.standardId"
                   :get-category="getCategory" :handle-click="handleNodeClick"/>
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
</template>

<script>
import standardMenu from '@/views/common/standardMenu/standardAndApp.vue'
import sideMenu from '@/views/common/tree/uirbTree.vue'
import editionFooter from '@/views/common/footer/footer.vue'
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'ResourceManageInfoRepo',

  components: {
    standardMenu,
    sideMenu,
    editionFooter
  },

  directives: { Clickoutside },

  data() {
    return {
      status: {
        // appId: '', // 当前第三方应用ID
        // appName: '', // 当前第三方应用name
        // standardId: '', // 当前标准ID
        standard: {},
        searchText: '',
        isResultShow: false,
        initFinish: false,
        type: 'standard' // 查看分类类型
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
    '$route'(value, oldVal) {
      this.status.searchText = ''

      // 标准或分类切换，清空分类和标签筛选条件
      if (value.query.standardid !== oldVal.query.standardid || value.query.categoryid !== oldVal.query.categoryid) {
        sessionStorage.clear()
      }
    },
    '$route.query.standardid'() {
      this.status.searchText = ''
    },
  },

  methods: {
    /**
     * 请求标准下分类列表
     */
    queryList(type = 'standard') {
      let params = {
        parentCategoryId: type === 'standard' ? '0' : '',
        // rootNodeId: type === 'app' ? this.status.standard.standardId : 0
      }

      if (type === 'app' && this.status.appName) params.rootNodeId = this.status.standard.standardId

      this.getCategory(type, params).then(data => {
        data.unshift({ category_name: '全部分类', id: 0, hasChildren: 0 })

        if (type === 'standard') {
          this.$router.push({ path: '/manage/inforepo/home', query: { standardid: this.status.standard.standardId, isMounted: 1 } })
        } else {
          this.$router.push({ path: '/manage/inforepo/home', query: { appid: this.status.standard.appId, appStandardid: this.status.standard.standardId, isMounted: 1 } })
        }

        this.data.classificationList = data
      })
    },

    /**
     * 获取分类，按需加载
     */
    getCategory (type, params) {
      return new Promise((resolve) => {
        if (type === 'standard') {
          this.$api.queryResClassifyListAuth({standardId: this.status.standard.standardId}, params).then((data) => { resolve (data) })
        } else {
          this.$api.queryAppResClassifyList({appId: this.status.standard.appId}, params).then((data) => { resolve (data) })
        }
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
      this.$api.vagueSearchAuth({ standardId: this.status.standard.standardId, appId: this.$route.query.appid }, params).then(data => {
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
    handleStandardClick(item, list, type) {
      if (list) this.data.standardList = list

      this.status.standard = item
      this.status.initFinish = true
      this.status.type = type

      this.status.appName = type === 'app' ? item.appName : ''

      this.data.classificationList = []

      if (item.standardId || item.appId) this.queryList(type)
    },

    /**
     * 选择分类
     */
    handleNodeClick(data, node, component, parentId) {
      // 无权限的节点点击只做展开收起，不可选择
      if (data.hasRight === 0) return

      let path = this.$route.path.split('/').pop()
      let params = {
        hasChildren: data.hasChildren,
        standardid: this.$route.query.standardid,
        appid: this.$route.query.appid,
        appStandardid: this.$route.query.appStandardid,
        isMounted: 1
      }

      if (data.id) {
        params.categoryid = data.id
        params.categoryname = data.category_name || data.categoryName
        params.parentid = parentId !== undefined ? parentId : data.parent_id || data.parentId
      }

      // 列表页切换分类需重选资源
      if (path === 'list') path = 'home'

      this.$router.push({ path: '/manage/inforepo/' + path, query: params })
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
      this.$refs.sideMenu.locateNode(data)
    }
  }
}
</script>

<style lang="scss"></style>
