<template>
  <!-- 接口文档 -->
  <div class="main-container interface-doc">
    <div v-loading="loading" element-loading-text="数据加载中..." class="doc-main">

      <!-- 文档主体 -->
      <div class="doc-content">
        <el-button icon="download-icon" @click="downloadDoc">导出文档</el-button>
        <node :data="data.docContent"></node>
      </div>

      <!-- 右侧导航 -->
      <div class="doc-nav">

        <!-- 筛选-->
        <div class="doc-filter">
          <el-select v-model="status.standardId" :popper-append-to-body="false" placeholder="请选择标准">
            <el-option v-for="standard in data.standardList" :key="standard.id" :value="standard.id" :label="standard.name" :title="standard.name" />
          </el-select>
          <el-select v-model="status.tableId" :popper-append-to-body="false" placeholder="请选择数据表">
            <el-option v-for="table in data.tableList" :key="table.id" :value="table.id" :label="table.resource_name" :title="table.resource_name" />
          </el-select>
        </div>

        <!-- 菜单 -->
        <div class="doc-menu">
          <el-scrollbar tag="ul" wrap-class="doc-menu-wrap">
            <li v-for="item in data.menuList" :key="item.id" :class="toggleClass(item)" :title="item.value" @click="selectedNode(item)" v-html="item.value"/>
          </el-scrollbar>
        </div>
      </div>
    </div>
    <edition />
  </div>
</template>

<script>
import node from './node'
import edition from '@/views/common/footer/footer.vue'

export default {
  name: 'interfaceDoc',

  components:{
    node,
    edition
  },

  data() {
    return {
      loading: false,
      data: {
        docContent:  [],  // 接口文档左侧数据
        menuList: [], // 右侧导航列表数组
        standardList: [], // 标准列表
        tableList: [] // 数据表列表
      },
      status: {
        selectedMenu: '', // 选中菜单id
        standardId: '', // 选择的标准id
        tableId: '' // 选择的数据表id
      }
    }
  },

  watch: {
    'status.standardId'(val) {
      this.status.tableId = ''
      this.queryTableList()
    },

    'status.tableId'(val) {
      this.queryDocList()
    }
  },

  mounted() {
    this.queryStandardList()
    this.queryDocList()
    document.querySelector('.interface-doc').addEventListener('scroll', this.handleScroll)
  },

  methods: {
    /**
     * 请求标准数据
     */
    queryStandardList() {
      this.loading = true
      this.$api.queryStandardList().then(data => {
        this.data.standardList = data
        this.status.standardId = data.length > 0 ? data[0].id : ''
        this.loading = false
      })
    },

    /**
     * 请求数据表数据
     */
    queryTableList() {
      this.loading = true
      let url = {
        standardId: this.status.standardId
      }
      this.$api.queryStructureListTable(url).then(data => {
        this.data.tableList = data
        this.status.tableId = data.length > 0 ? data[0].id : ''
        this.loading = false
      })
    },

    /**
     * 查询接口文档
     */
    queryDocList() {
      this.loading = true
      let params = {
        standardId: this.status.standardId,
        resourceId: this.status.tableId
      }
      this.$api.queryDocList(params).then(data => {
        this.data.docContent = this.assignId(data)
        this.setMenuList()
        this.loading = false
      })
    },

    /**
     * 组织菜单数据
     */
    setMenuList() {
      let resultArr = this.data.menuList = []
      let loopFunc = function(data) {
        data.map((item) => {
          if(item.type.indexOf('heading') >= 0) {
            resultArr.push(item)
          }
          if(item.children && item.children.length) {
            loopFunc(item.children)
          }
        })
      }

      loopFunc(this.data.docContent)
      this.data.menuList = this.assignId(resultArr)
      this.status.selectedMenu = this.data.menuList.length > 0 ? this.data.menuList[0].id : ''
    },

    /**
     * 选中菜单项
     */
    selectedNode(node) {
      this.status.selectedMenu = node.id
      this.anchorLocation(node)
    },

    /**
     * 定位锚点
     */
    anchorLocation(node) {
      let id = node.value.split(' ')[0].split('.').join('')
      let targetNode = document.querySelector('.node' + id)
      let frameNode = document.querySelector('.interface-doc')
      let targetScroll = targetNode.offsetTop - 50
      let curScroll = frameNode.scrollTop
      let step = Math.abs(targetScroll - curScroll) / 50  //每次滚动的步进值

      if (targetScroll > curScroll) {
        smoothDown()
      } else {
        smoothUp()
      }

      function smoothDown () {
        let interval = setInterval(() => {
          if (curScroll >= targetScroll) {
            clearInterval(interval)
            frameNode.scrollTop = targetScroll
          } else {
            curScroll += step
            frameNode.scrollTop = curScroll
          }
        }, 10)
      }

      function smoothUp () {
        let interval = setInterval(() => {
          if (curScroll <= targetScroll) {
            clearInterval(interval)
            frameNode.scrollTop = targetScroll
          } else {
            curScroll -= step
            frameNode.scrollTop = curScroll
          }
        }, 10)
      }
    },

    /**
     * 为数据写入id字段
     */
    assignId(list) {
      for(var i=0;i<list.length;i++) {
        if(list[i].type.indexOf('heading') >= 0) {
          list[i].id = list[i].value.split(' ')[0].split('.').join('')
        }
      }
      return list
    },

    /**
     * 右侧导航高亮样式
     */
    toggleClass(item) {
      let type = item.type,
          className = type.substr(0, 4) + type.substr(-1, 1)
      if(item.id === this.status.selectedMenu) {
        className += ' active'
      }
      return className
    },

    /**
     * 文档滚动
     */
    handleScroll() {
      let scrollTop = document.querySelector('.interface-doc').scrollTop
      let windowHeight = document.body.clientHeight
      let criticalDis = 60 + windowHeight / 2
      let contentList = this.data.docContent
      let titleList = this.data.menuList
      let loopFunc = (arr) => {
        arr.map((item) => {
          let currentItem = document.querySelector('.node' + (item.id ? item.id : ''))
          if(item.type.indexOf('heading') >= 0 && (currentItem.offsetTop - scrollTop <= Math.max(criticalDis, windowHeight - currentItem.offsetHeight))) {
            this.status.selectedMenu = item.id
          }

          this.$nextTick(() => {
            let menu = document.querySelector('.doc-menu-wrap')
            let currentMenu = menu.querySelector('.active')
            let menuHeight = menu.offsetHeight
            let menuScrollTop = menu.scrollTop

            if(scrollTop + menuHeight <= currentMenu.offsetTop + currentMenu.offsetHeight <= menuScrollTop) {
              menu.scrollTop = currentMenu.offsetTop - menuHeight * 0.5
            }
          })

          if(item.children.length) {
            loopFunc(item.children)
          }
        })
      }

      loopFunc(contentList)

      if(scrollTop < 65) {
        this.status.selectedMenu = titleList[0].id
      }
    },

    /**
     * 导出文档
     */
    downloadDoc () {
      this.$api.get(`/interfaces/export`, { standardId: this.status.standardId, resourceId: this.status.tableId })
    }
  }
}
</script>
