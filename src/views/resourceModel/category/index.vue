<template>
  <div class="main-container resource-category">
    <div class="side-bar">
      <standard-menu ref="standardMenu" @callback="handleStandardClick" />

      <!-- 分类模糊检索 -->
      <div v-clickoutside="handleClose" v-show="standardId && categoryList.length > 0" style="position: relative;">
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

      <!-- 左侧树 -->
      <side-menu v-show="standardId && categoryList.length > 0" ref="sideMenu" :data="categoryList" :standard-id="standardId" :selected-node="$route.query.categoryid" @categoryChange="handleCategoryChange"/>
    </div>

    <div class="content-container">
      <router-view/>
      <editionFooter></editionFooter>
    </div>
  </div>
</template>

<script>
import standardMenu from '@/views/common/standardMenu/index.vue'
import editionFooter from '@/views/common/footer/footer.vue'
import sideMenu from '@/views/common/tree/index.vue'
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'resourceCategory',

  components: {
    standardMenu,
    sideMenu,
    editionFooter
  },

  directives: { Clickoutside },

  data () {
    return {
      categoryList: [],
      loading: false,
      standardId: '',
      currentStandard: {}, // 当前标准
      status: {
        searchText: '',
        isResultShow: false
      },
      data: {
        resultList: []
      }
    }
  },

  watch: {
    '$route.query.standardid' () {
      this.status.searchText = ''
    },
  },

  methods: {
    /**
     * 切换标准
     */
    handleStandardClick (item) {
      this.standardId = item.id
      this.categoryList = []
      this.initCategory().then((data) => {
        this.handleCategoryChange(data[0])
      })
    },

    initCategory () {
      let params = {
        parentCategoryId: 0,
        containsChildren: 0,
        searchText: ''
      }
      return new Promise((resolve) => {
        this.$api.queryResClassifyList({standardId: this.standardId}, params).then(data => {
          data.unshift({category_name: '全部分类', id: 0, hasChildren: 0})
          this.categoryList = data
          resolve(data)
        })
      })
    },

    querySearchList () {
      this.loading = true
      this.data.resultList = []
      let url = {
        standardId: this.standardId
      }

      let params = {
        searchText: this.status.searchText,
        pageIndex: 1,
        pageSize: 10
      }
      this.$api.vagueSearch(url, params).then(data => {
        this.loading = false
        this.data.resultList = data
        this.status.isResultShow = true
        this.data.resultList.forEach((item, index) => {
          item.title = item.nav
          if (this.status.searchText !== '') {
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
     * 关闭检索结果页
     */
    handleClose () {
      this.status.isResultShow = false
    },

    /**
     * 分类点击切换
     */
    handleCategoryChange (data) {
      let params = {
        standardid: this.standardId,
        categoryid: data.id,
        category_name: data.category_name.trim()
      }
      this.$router.push({ path: '/model/category/list', query: params })
    },

    /**
     * 模糊检索滚动定位
     */
    locateItem (data) {
      this.status.searchText = ''
      this.status.isResultShow = false
      this.$refs.sideMenu.locateNode(data.id, true)
    }
  }
}
</script>
