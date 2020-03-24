<template>
  <div class="side-bar data-map-side">
    <h3 class="title">数据源（{{ dataSourcesCount }}）</h3>

    <el-input v-model="dataSourceFilter" class="search-input" placeholder="请输入数据源名称">
      <i slot="suffix" class="input-icon"/>
    </el-input>

    <ul v-loading="loading" element-loading-text="数据加载中...">
      <!-- 数据源列表 -->
      <li v-for="app in filteredDataSources" :key="app.id">
        <div :title="app.appName" class="app-item">{{ app.appName }}
          <el-tooltip class="item" effect="dark" content="新增数据源" placement="top">
            <i v-access="'aggr.mappingmgt.add'" class="icon add-icon" title="新增数据源" @click="editDataSource({}, $event, app)"></i>
          </el-tooltip>
        </div>
        <div v-for="dataSource in app.dataSources" :key="dataSource.id" :class="{'active': dataSource.id === selectedDataSource.id}"
             class="source-item" @click="selectDataSource(dataSource, app)">
          <!-- 警告提示：登录校验错误等 -->
          <el-popover v-if="dataSource.errorType" :content="dataSource.errorType" placement="right" popper-class="data-map-popover" trigger="hover">
            <i slot="reference" class="warning-icon"></i>
          </el-popover>

          <span :title="dataSource.dataSourceName" class="name">{{ dataSource.dataSourceName }}</span>
          <i v-access="'aggr.mappingmgt.edit'" class="icon edit-icon" title="编辑" @click="editDataSource(dataSource, $event)"></i>
          <i v-access="'aggr.mappingmgt.delete'" class="icon delete-icon" title="删除" @click="deleteDataSource(dataSource, $event)"></i>
        </div>
      </li>

      <li v-if="filteredDataSources.length === 0 && !loading" class="source-item">
        <span class="name">暂无数据</span>
      </li>
    </ul>
  </div>
</template>

<script>
import editSourceDialog from './components/editDataSource.vue'
import deleteSourceDialog from './components/deleteDataSource'
import eventBus from '@/utils/eventBus'

export default {

  components: {
    eventBus
  },

  data() {
    return {
      loading: true,
      dataSources: [],  // 数据源列表
      dataSourceFilter: '', // 数据源列表检索关键词
      selectedDataSource: null, // 选中的数据源
      curDataSource: {}, // 当前操作的数据源
      dataSourcesCount: 0 // 数据源数量
    }
  },

  computed: {
    filteredDataSources() {
      if (!this.dataSourceFilter) return this.dataSources

      let results = []
      this.dataSources.map(app => {
        let dataSources = app.dataSources.filter(item => {
          return item.dataSourceName.indexOf(this.dataSourceFilter) >= 0
        })
        if(dataSources.length > 0) results.push(Object.assign({}, {appId: app.appId, appName: app.appName, dataSources: dataSources}))
      })

      return results
    },

    isSpider() {
      return this.selectedDataSource
            && this.selectedDataSource.transferModeType === 'crawler'
    }
  },

  watch: {
    '$route'(value) {
      if (value.fullPath === '/collection/mapping') {
        this.queryDataSources()
      }
    },

    selectedDataSource(newVal) {
      if (newVal) {
        let query = {
          appid: this.selectedDataSource && this.selectedDataSource.appId,
          standardid: this.selectedDataSource && this.selectedDataSource.standardId,
          datasourceid: this.selectedDataSource && this.selectedDataSource.id,
          spider: this.isSpider
        }
        this.$router.push({path: `/collection/mapping`, query})
      }
    },

    'filteredDataSources'(newVal) {
      this.dataSourcesCount = 0
      newVal.map(item => {
        this.dataSourcesCount += item.dataSources.length
      })
    }
  },

  mounted() {
    this.queryDataSources()
  },

  methods: {
    /**
     * 查询数据源列表
     */
    queryDataSources() {
      this.loading = true

      this.$api.queryDatasourceList().then(data => {
        this.loading = false
        this.dataSources = data
        this.selectedDataSource = {}
        let dataSources = this.dataSources.filter(app => { return app.dataSources.length > 0 })

        if (dataSources.length) return

        // 刷新页面，定位到路由datasourceid中的数据源
        if (+this.$route.query.datasourceid && +this.$route.query.appid) {
          const app = this.dataSources.find(app => +app.appId === +this.$route.query.appid)
          if (app && app.dataSources) {
            this.selectedDataSource = app.dataSources
              .filter(dataSource => +dataSource.id === +this.$route.query.datasourceid)
              .map(dataSource => {
                return Object.assign(dataSource, {
                  appId: app.appId,
                  transferModeType: app.appAdapterType
                })
              })[0]
          }
        } else {
          this.selectedDataSource = Object.assign(dataSources[0].dataSources[0], {
            appId: dataSources[0].appId,
            transferModeType: dataSources[0].appAdapterType
          })
        }
      })
    },

    /**
     * 选中数据源
     */
    selectDataSource(dataSource, app) {
      this.selectedDataSource = Object.assign(dataSource, {
        appId: app.appId,
        transferModeType: app.appAdapterType
      })
    },

    /**
     * 新建/编辑数据源
     */
    editDataSource(item, event, app) {
      event.stopPropagation()

      this.$dialog(editSourceDialog, {editItem: Object.assign({}, item), app: Object.assign({}, app)}).then(() => {
        this.queryDataSources()

        if(item.id === parseInt(this.$route.query.datasourceid)) this.$nextTick(() => {
          eventBus.$emit('getMappingList')
        })
      })
    },

    /**
     * 删除数据源
     */
    deleteDataSource(item, event) {
      event.stopPropagation()

      this.$dialog(deleteSourceDialog, {editItem: item}).then(() => {
        this.queryDataSources()
      })
    }
  }
}
</script>

<style lang="scss">
@import "~@/styles/variables";

.data-map-side {
  ul {
    height: calc(100% - 100px);
    overflow: auto;
  }

  /* 应用列表项 */
  .app-item {
    height: 50px;
    padding: 0 30px 0 20px;
    font-weight: bold;
    line-height: 50px;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .app-item .add-icon {
    position: absolute;
    top: 16px;
    right: 5px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
    background: url("~@/assets/images/add-icon2.png") no-repeat center;

    &:hover {
      background: $blue url("~@/assets/images/add-icon2-hover.png") no-repeat center;
    }
  }

  /* 数据源列表项 */
  .source-item {
    position: relative;
    height: 40px;
    line-height: 40px;
    cursor: pointer;

    .name {
      display: inline-block;
      width: 100%;
      padding: 0 40px;
      color: $font-dark;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      background-color: $gray-active;
    }
  }
  .source-item.active {
    position: relative;
    background-color: $gray-active;
    span {
      font-weight: bold;
      color: $blue;
    }
    span:before {
      content: '';
      position: absolute;
      width: 4px;
      height: 100%;
      background-color: #4BD083;
      left: 0;
      top: 0;
    }
  }

  .source-item .warning-icon {
    position: absolute;
    top: 14px;
    left: 8px;
  }

  .source-item .icon {
    display: none;
    position: absolute;
    top: 11px;
    right: 5px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: pointer;
  }
  .source-item .edit-icon {
    right: 25px;
    background: url("~@/assets/images/edit-icon2.png") no-repeat center;

    &:hover {
      background: $blue url("~@/assets/images/edit-icon.png") no-repeat center;
    }
  }
  .source-item .delete-icon {
    background: url("~@/assets/images/delete-icon2.png") no-repeat center;

    &:hover {
      background: $red url("~@/assets/images/delete-icon.png") no-repeat center;
    }
  }
  .source-item:hover {
    .delete-icon, .edit-icon {
      display: block;
    }
  }
}

/* 错误警告popover */
.el-popover.data-map-popover {
  min-width: auto;
  height: 30px;
  line-height: 28px;
  margin-left: 5px;
  padding: 0 10px;
  font-size: 12px;
  color: #fff;
  background-color: #47484b;

  .popper__arrow {
    display: block;
    border-right-color: #47484b;
  }
}
</style>
