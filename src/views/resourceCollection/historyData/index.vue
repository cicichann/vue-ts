<template>
  <div class="main-container">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <standard-menu ref="standardMenu" :auth="false" @callback="handleStandardClick"/>
      <div class="nav-menu">
        <ul>
          <li v-for="app in data.datasourceList" :key="app.transferMode" class="resfer-item">
            <div :title="app.appName" class="appName">{{ app.appName }}</div>
            <div v-for="item in app.dataSources" :class="{'is-active': data.currentMapping.id === item.id}"
                 :key="item.id" :title="item.dataSourceName" class="nav-item" @click="handleMappingClick(item, app)">
              <a>{{ item.dataSourceName }}</a>
              <div v-if="data.operationGroupId === item.id" class="more-oprate" @click.stop>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="content-container">
      <router-view />

      <!-- 版本信息 -->
      <edition/>
    </div>
  </div>
</template>

<script>
import standardMenu from '@/views/common/standardMenu/index.vue'
import edition from '@/views/common/footer/footer.vue'
export default {
  name: 'HistoryData',

  components: {
    standardMenu,
    edition
  },

  data() {
    return {
      data: {
        datasourceList: [], // 数据源列表
        currentMapping: {} // 选中的数据源
      },
      status: {
        standardId: '' // 当前标准ID
      }
    }
  },

  watch: {
    'data.currentMapping' (newVal) {
      if (newVal) {
        let query = {
          standardid: newVal.standardId,
          datasourceid: newVal.id,
          datasourcename: newVal.dataSourceName,
          datasourcetype: newVal.appAdapterType,
          adapterId: newVal.adapterId
        }
        this.$router.push({path: `/collection/history/task`, query})
      }
    }
  },

  methods: {
    /**
     * 请求列表数据
     */
    queryList() {
      let url = {
        standardId: this.status.standardId
      }

      this.$api.queryMappingList(url).then(data => {
        if(data.length > 0) {
          let targetArr = data.filter(app => { return app.dataSources.length > 0 })
          this.data.datasourceList = targetArr
          this.data.currentMapping = targetArr.length > 0 ? Object.assign(targetArr[0].dataSources[0], {
            adapterId: targetArr[0].adapterId,
            appAdapterType: targetArr[0].appAdapterType,
            appId: targetArr[0].appId
          }): {}
        }
      })
    },

    /**
     * 切换标准
     */
    handleStandardClick(item) {
      this.status.standardId = item.id

      if (item.id) {
        this.queryList()
      } else {
        this.$router.push({ path: '/collection/history/task' })
      }
    },

    /**
     * 切换数据源
     */
    handleMappingClick (dataSource, app) {
      this.data.currentMapping = Object.assign(dataSource, {
        adapterId: app.adapterId,
        appAdapterType: app.appAdapterType,
        appId: app.appId,
      })
    }
  }

}
</script>
