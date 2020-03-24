<template>
  <div class="main-container resource-structure">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <standard-menu ref="standardMenu" @callback="handleStandardClick"/>
      <div class="nav-menu">
        <ul>
          <li v-for="item in data.groupList" :class="{'is-active': data.currentGroupId === item.id}" :key="item.id" :title="item.groupName"
              class="nav-item">
            <router-link
              :to="{ path: '/model/structure/catalog', query: { standardid: status.standardId, groupid: item.id, groupname: item.groupName } }">
              {{ item.groupName }}
            </router-link>
            <el-popover v-model="item.showPopover" trigger="click" placement="bottom-end" popper-class="nav-more-popover clearfix">
              <ul>
                <li @click.stop="editGroup(item)">重命名</li>
                <li @click.stop="deleteGroup(item)">删除</li>
              </ul>
              <i slot="reference" :class="{'more-active': item.showPopover}" class="nav-more"></i>
            </el-popover>
          </li>
        </ul>
      </div>

      <!-- 新增按钮 -->
      <div class="action-btns">
        <el-button size="large" type="primary" @click="exportTable">导出</el-button>
        <el-button size="large" type="success" @click="editGroup({})">新增库</el-button>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="content-container">
      <router-view/>
      <edition/>
    </div>
  </div>
</template>

<script>
import standardMenu from '@/views/common/standardMenu/index.vue'
import editGroupDialog from './components/editGroup.vue'
import deleteGroupDialog from './components/deleteGroup.vue'
import edition from '@/views/common/footer/footer.vue'

export default {
  name: 'resourceStructure',

  components: {
    standardMenu,
    edition
  },

  data() {
    return {
      data: {
        groupList: [], // 库数据
        currentGroupId: '', // 当前选中库id
      },
      status: {
        standardId: '' // 当前标准ID
      },
      loading: false
    }
  },

  watch: {
    '$route.query' (newVal, oldVal) {
      if (newVal.groupid !== oldVal.groupid) {
        this.data.currentGroupId = newVal.groupid
      }
    }
  },

  methods: {
    /**
     * 获取左侧菜单数据
     */
    queryGroupList() {
      let url = {
        standardId: this.status.standardId
      }
      this.$api.queryStructureGroupList(url).then(data => {
        this.data.groupList = data
        this.data.currentGroupId = (data[0] && data[0].id) || ''
        this.$router.push({
          path: '/model/structure/catalog',
          query: {
            standardid: this.status.standardId,
            groupid: this.data.currentGroupId,
            groupname: (data[0] && data[0].groupName) || ''
          }
        })
      })
    },

    /**
     * 切换标准
     */
    handleStandardClick(item) {
      this.status.standardId = item.id
      this.queryGroupList()
    },

    /**
     * 切换库
     */
    handleGroupClick(data) {
      this.data.currentGroupId = data.id
      this.$router.push({
        path: '/model/structure/catalog',
        query: {
          standardid: this.status.standardId,
          groupid: data.id,
          groupname: data.groupName
        }
      })
    },

    /**
     * 新增/重命名库
     */
    editGroup (item) {
      this.$dialog(editGroupDialog, { standardId: this.$route.query.standardid, group: item}).then(() => {
        this.queryGroupList()
      })
    },

    /**
     * 删除
     */
    deleteGroup (data) {
      this.$dialog(deleteGroupDialog, { standardId: this.$route.query.standardid, group: data }).then(() => {
        this.queryGroupList()
      })
    },

    /**
     * 导出
     */
    exportTable () {
      this.$trsModalConfirm({title: '导出数据表', content: '是否确认导出当前标准下的所有库及数据表？', danger: false}).then(() => {
        this.$api.downloadTable(this.$route.query.standardid)
      })
    }
  }
}
</script>
