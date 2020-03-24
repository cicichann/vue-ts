<template>
  <div class="uirb-preview">
    <!-- 头部 -->
    <div class="header-nav">
      <el-tabs v-model="activeTab" class="fl" @tab-click="handleTabClick">
        <el-tab-pane label="数据预览" name="preview"></el-tab-pane>
        <el-tab-pane label="使用轨迹" name="trace"></el-tab-pane>
        <el-tab-pane label="审阅核查" name="record"></el-tab-pane>
        <el-tab-pane label="智能校对" name="proof"></el-tab-pane>
        <el-tab-pane label="知识图谱" name="knowledgemap"></el-tab-pane>
      </el-tabs>

      <div class="fr">
        <el-button size="small" class="close-btn" @click="close">关闭</el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="main-container">
      <router-view></router-view>

      <!-- 页脚 -->
      <version></version>
    </div>
  </div>
</template>

<script>
import version from '@/views/common/footer/footer'

export default {
  name: 'index',

  components: {
    version
  },

  data() {
    return {
      activeTab: ''
    }
  },

  mounted() {
    this.activeTab = this.$route.path.split('/')[2]
  },

  methods: {
    /**
     * 切换处理模式
     */
    handleTabClick(tab) {
      this.$router.push({path: `/ai/${tab.name}`, query: this.$route.query})
    },

    /**
     * 关闭
     */
    close() {
      window.close()
    }
  }
}
</script>

<style lang="scss">

</style>
