<template>
  <div class="monitor-center">
    <!-- 左侧菜单 -->
    <div class="side-bar">
      <div class="nav-menu" style="height:100%">
        <el-tree ref="menu" :data="sideMenu" :props="defaultProps" node-key="id" default-expand-all @node-click="menuClick"></el-tree>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="content-container">
      <router-view/>
      <editionFooter></editionFooter>
    </div>
  </div>
</template>

<script>
import editionFooter from '@/views/common/footer/footer.vue'

export default {
  name: 'MonitorCenter',

  components: {
    editionFooter
  },

  data() {
    return {
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      sideMenu: [
        {
          "label": "资源归集",
          "children": [
            {
              "id": "dataaccess",
              "label": "数据接入",
              "rightKey": 'datamgt.monitorcenter.dataaggr'
            },
            {
              "id": "autocategory",
              "label": "自动分类",
              "rightKey": 'datamgt.monitorcenter.autocat'
            },
            {
              "id": "automark",
              "label": "自动打标",
              "rightKey": 'datamgt.monitorcenter.autotag'
            },
            {
              "id": "autounduplicate",
              "label": "自动排重",
              "rightKey": 'datamgt.monitorcenter.distinct'
            }
          ]
        },
        {
          "label": "资源共享",
          "children": [
            {
              "id": "distribute",
              "label": "资源下发",
              "rightKey": 'datamgt.monitorcenter.datadist'
            },
            {
              "id": "report",
              "label": "资源报送",
              "rightKey": 'datamgt.monitorcenter.datareport'
            }
          ]
        },
        {
          "label": "资源监管",
          "children": [
            {
              "id": "check",
              "label": "智能校对",
              "rightKey": 'datamgt.monitorcenter.corrections'
            },
            {
              "id": "withdrawal",
              "label": "一键撤稿",
              "rightKey": 'datamgt.monitorcenter.withdraw'
            }
          ]
        },
        {
          "label": "系统运维",
          "children": [
            {
              "id": "operation",
              "label": "操作日志",
              "rightKey": 'datamgt.monitorcenter.operationlogs'
            },
            {
              "id": "performance",
              "label": "性能日志",
              "rightKey": 'datamgt.monitorcenter.performlogs'
            }
          ]
        }
      ]
    }
  },

  watch: {
    '$route' (newVal) {
      if (newVal.path === '/manage/monitor') this.initMenu()
    }
  },

  created () {
    this.initMenu()
  },

  /**
   * 路由记忆
   */
  // beforeRouteEnter (to, from, next) {
  //   debugger
  //   next(vm => {
  //     let path = to.fullPath.split('/')
  //     vm.$refs.menu.setCurrentKey(path.pop())
  //   })
  // },

  methods: {
    menuClick (data, node, cur) {
      if (data.id) {
        this.$router.push({path: '/manage/monitor/' + data.id})
      } else {
        let path = this.$route.fullPath.split('/')
        this.$refs.menu.setCurrentKey(path.pop())
      }
    },

    /**
     * 初始化菜单，过滤无权限的菜单项
     */
    initMenu () {
      this.sideMenu = this.sideMenu
        .map(item => {
          item.children = item.children.filter(child => this.$checkRight(child.rightKey))
          return item
        })
        .filter(item => item.children && item.children.length > 0)

      this.$router.push({path: '/manage/monitor/' + this.sideMenu[0].children[0].id})

      this.$nextTick(() => {
        this.$refs.menu.setCurrentKey(this.sideMenu[0].children[0].id)
      })
    }
  }

}
</script>
