<template>
  <el-breadcrumb class="fl overflow clearfix" separator-class="el-icon-arrow-right">
    <span class="fl sign"/>
    <el-breadcrumb-item v-for="(item, index) in breadList" :title="item.name" :key="index" :to="{path: item.path, query: $route.query}">
      {{ item.name }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script>
export default {
  name: 'trsBreadcrumb',

  data () {
    return {
      breadList: []
    }
  },

  watch: {
    $route: {
      handler (newVal, oldVal) {
        this.initBreadcrumb()
      },
      deep: true,
      immdiate: true
    }
  },

  created () {
    this.initBreadcrumb()
  },

  methods: {
    /**
     * 初始化面包屑
     */
    initBreadcrumb() {
      this.breadList = this.$route.matched.map((item) => {
        return {
          type: item.meta.formatType,
          name: item.meta.title,
          path: item.path
        }
      })

      // 特殊格式自定义
      this.breadList.forEach(item => {
        switch (item.type) {
          // 资源标准
          case 'standard':
            this.breadList.push({name: item.name.split('-')[1]})
            item.name = this.$route.query.name
            break

          // 资源目录
          case 'category':
            item.name = this.$route.query.category_name || '全部分类'
            break

          // 数据管理-信息资源库
          case 'inforepo':
            if (this.$route.query.resourcename) {
              this.breadList.push({name: this.$route.query.resourcename})
            }
            item.name = this.$route.query.categoryname || '全部分类'
            item.path = '/manage/inforepo/home'
            break
        }
      })
    }
  }
}
</script>

<style lang="scss">
.el-breadcrumb .el-breadcrumb__item .el-breadcrumb__inner {
  display: block;
  float: left;
  // max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
