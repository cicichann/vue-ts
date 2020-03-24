<template>
  <div class="main-container resource-standard">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <div class="nav-menu">
        <ul v-for="item in standardList" :key="item.id">
          <li :title="item.name + ' ID:' + item.id" class="nav-title">
            <span>{{ item.name }}</span>
            <el-popover v-model="item.showPopover" trigger="click" placement="bottom-end" popper-class="nav-more-popover clearfix">
              <ul>
                <li @click="editStandard(item)">重命名</li>
                <li @click="deleteStandard(item)">删除</li>
              </ul>
              <i slot="reference" :class="{'more-active': item.showPopover}" class="nav-more"></i>
            </el-popover>
          </li>
          <li :class="{'is-active':isSelected==item.id + '1'}" class="nav-item" @click="selected(item.id + '1', item)" >
            <router-link :to="{ path: '/model/standard/category', query: { standardid: item.id, name: item.name } }">
              <i class="standard-classify"/><span>分类属性</span>
            </router-link>
          </li>
          <li :class="{'is-active':isSelected==item.id + '2'}" class="nav-item" @click="selected(item.id + '2', item)">
            <router-link :to="{ path: '/model/standard/resource', query: { standardid: item.id, name: item.name } }">
              <i class="standard-resource"/><span>数据表属性</span>
            </router-link>
          </li>
          <li :class="{'is-active':isSelected==item.id + '3'}" class="nav-item" @click="selected(item.id + '3', item)">
            <router-link :to="{ path: '/model/standard/attribute', query: { standardid: item.id, name: item.name } }">
              <i class="standard-attr"/><span>字段属性</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 新增和导入按钮 -->
      <div class="action-btns">
        <el-button class="fl" size="large" type="success" @click="editStandard({})">新增标准</el-button>
        <!-- <el-button class="fr" size="large" type="success" @click="loadStandard">导入标准</el-button> -->
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
import eventBus from '@/utils/eventBus'
import editionFooter from '@/views/common/footer/footer.vue'
import editStandardDialog from './components/editStandard.vue'
import deleteStandardDialog from './components/deleteStandard.vue'
import { getStandard } from '@/utils/index'

export default {
  name: 'resourceStandard',

  components:{
    editionFooter
  },

  data() {
    return {
      isSelected: '',
      standardList: [] //标准列表
    }
  },

  watch: {
    '$route'(value) {
      if (value.path === '/model/standard') {
        eventBus.$emit('requstParents')
        this.queryList()
      }
    }
  },

  mounted() {
    this.queryList()
  },

  methods: {
    /**
     * 更新左侧导航数据
     */
    queryList() {
      this.$api.queryAuthStandardList().then(data => {
        this.standardList = data
        getStandard(data, this.$route.query.standardid).then(standard => {
          if (standard) {
            this.$router.push({ path: '/model/standard/category', query: { standardid: standard.id, name: standard.name }})
            this.isSelected = standard.id + '1'
          } else {
            this.$router.push({path:'/model/standard',query:{}})
          }
          this.scrollToStandard(standard, data)
        })
      })
    },

    /**
     * 初始化滚动至记忆标准
     */
    scrollToStandard (standard, standards) {
      let stdIndex = 0
      let targetWrap = document.querySelector('.resource-model .nav-menu')
      if (targetWrap) {
        standards.forEach((item, index) => {
          if (item.name === standard.name) {
            stdIndex = index
            return
          }
        })
        targetWrap.scrollTop = 180 * stdIndex
      }
    },

    /**
     * @description 选中左侧二级菜单导航
     */
    selected (id, standard) {
      this.isSelected = id
      localStorage.setItem('standard-' + localStorage.curUser, JSON.stringify(standard))
    },

    /**
     * 新增/重命名标准
     */
    editStandard (item) {
      this.$dialog(editStandardDialog, {standard: item}).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除标准
     */
    deleteStandard (item) {
      this.$dialog(deleteStandardDialog, {standard: item}).then(() => {
        this.queryList()
      })
    }
  }
}
</script>
