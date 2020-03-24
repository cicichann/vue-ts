<template>
  <div class="realtime-wrapper">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 检索 -->
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入数据表名称" @keyup.enter.native="queryList">
          <i slot="suffix" style="top: 0" class="input-icon"/>
        </el-input>
      </div>
      <!-- 右侧面包屑 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item>全部</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 主体 -->
    <div class="table-content">
      <div v-loading="loading" :class="{'uirb-no-data': data.list.length === 0 && !loading}" element-loading-text="数据加载中..." class="card-wrap">
        <ul>
          <li v-for="(item, index) in data.list" :title="item.resourceName + ' (id:' + item.resourceId +')'" :key="index" class="card-item" @click="moveTo(item)">
            <p class="resource-name">{{ item.resourceName }}</p>
            <p class="item-id">ID:{{ item.resourceId }}</p>
            <div class="word-center">
              <div class="good-count">
                <span class="success-icon"></span>
                采集成功
                <p class="count" style="text-align: left;">{{ item.successNum }}</p>
              </div>
              <div class="bad-count">
                <span class="lose-icon"></span>
                采集失败
                <p class="count">{{ item.failNum }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,//loading配置
      status: {
        searchText: "", // 检索值
        pageIndex: 1
      },
      data: {
        list: [] //卡片列表数据
      }
    }
  },

  watch: {
    '$route'(newVal, oldVal) {
      this.data.list = []
      if(newVal.query.adapterid && newVal.query.appid) this.queryList()
    }
  },

  mounted() {
    this.queryList()
  },

  methods: {
    /**
     * 请求数据
     */
    queryList() {
      this.loading = true
      if (this.$route.query.appid) {
        let params = {
          standardId: this.$route.query.standardid,
          appId: this.$route.query.appid,
          dataSourcesId: this.$route.query.adapterid,
          searchText: this.status.searchText
        }
        this.$api.realtimeDateList(params).then(data => {
          this.data.list = data
          this.loading = false
        }, err => {
          this.loading = false
        })
      } else {
        setTimeout(() => {
          this.loading = false
        }, 250)
      }
    },

    /**
     * 进入列表页面
     * @param {item}
     */
    moveTo(item) {
      this.$router.push({
        path: "/collection/realtime/tableList",
        query: {
          standardid: this.$route.query.standardid,
          appid: this.$route.query.appid,
          adapterid: this.$route.query.adapterid,
          groupname: this.$route.query.groupname,
          resourceid: item.resourceId,
          resourceName: item.resourceName
        }
      })
    }
  }
}
</script>
