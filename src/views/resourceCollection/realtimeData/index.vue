<template>
  <div class="main-container">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <standard-menu ref="standardMenu" @callback="handleStandardClick"/>
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
import edition from '@/views/common/footer/footer.vue'
import standardMenu from '@/views/common/standardMenu/index.vue'
export default {
    name: 'RealtimeData',

    components: {
        edition,
        standardMenu
    },

    data() {
      return {
        data: {
          groupList: [], //应用列表
          currentGroupId: '', //当前选中应用
          datasourceList: [],
          currentMapping: {},
          index: 0
        },
        status: {
          standardId: '' // 当前标准ID
        },
      }
    },

    watch: {
      '$route'(val) {
        if(val.path === '/collection/realtime') {
          this.queryList()
        }
      },

      'data.currentMapping' (newVal) {
        if (newVal) {
          let query = {
            standardid: this.status.standardId,
            adapterid: this.data.currentMapping.id || '',
            appid: this.data.currentMapping.appId || '',
            groupname: this.data.currentMapping.appName || ''
          }
          this.$router.push({ path: '/collection/realtime/cardList', query })
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

      this.$api.realtimeDateTree(url).then(data => {
        this.data.datasourceList = []
        if(data.length > 0) {
          let targetList = data.filter(item => {return item.dataSources.length > 0})
          this.data.datasourceList = targetList
          this.data.currentMapping = targetList.length > 0 ? Object.assign(targetList[0].dataSources[0], {
            appName: targetList[0].appName,
            appId: targetList[0].appId
          }) : {}
        } else {
            let query = {
              standardid: this.status.standardId,
              adapterid: this.data.currentMapping.id || '',
              appid: this.data.currentMapping.appId || '',
              groupname: this.data.currentMapping.appName || ''
            }
            this.$router.push({ path: '/collection/realtime/cardList', query })
        }
      })
    },

    /**
     * 切换标准
     */
    handleStandardClick(item, list) {
      this.status.standardId = item.id

      if (item.id) {
        this.queryList()
      } else {
        this.$router.push({ path: '/collection/realtime/cardList' })
      }
    },

    /**
     * 切换数据源
     */
    handleMappingClick (dataSource, app) {
      this.data.currentMapping = Object.assign(dataSource, {
        appId: app.appId,
        appName: app.appName
      })
    }
  }
}
</script>
