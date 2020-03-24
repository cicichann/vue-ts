<template>
  <div class="resource-topic resource-inforepo">
    <div v-if="data.standardList.length > 0 || !status.initFinish">
      <!-- 左侧菜单 -->
      <div class="side-bar">
        <standard-menu ref="standardMenu" @callback="handleStandardClick"/>

        <el-input v-model="status.searchText" class="search-input" placeholder="请输入专题名称搜索" @keyup.enter.native="queryList()">
          <i slot="suffix" class="input-icon" @click="queryList()"/>
        </el-input>

        <ul class="nav-menu">
          <li v-for="(item, index) in data.topicList" :key="index" :title="item.name"
              :class="{'is-active': status.curTopic.id === item.id}" class="nav-item">
            <a class="overflow" @click="handleTopicChange(item)">{{ item.name }}</a>
            <el-popover v-model="item.showPopover" trigger="click" placement="bottom-end" popper-class="nav-more-popover clearfix">
              <ul>
                <li v-access="'datamgt.dissertation.edit'" @click.stop="editTopic(item)">编辑</li>
                <li v-access="'datamgt.dissertation.delete'" @click.stop="deleteTopic(item)">删除</li>
              </ul>
              <i v-access="'datamgt.dissertation.edit,datamgt.dissertation.delete'" slot="reference" :class="{'more-active': item.showPopover}" class="nav-more"></i>
            </el-popover>
          </li>
        </ul>
        <div class="action-btns">
          <el-button v-access="'datamgt.dissertation.add'" class="fl" size="large" type="success" @click="editTopic()">新增专题</el-button>
        </div>
      </div>

      <!-- 右侧 -->
      <div v-if="data.topicList && data.topicList.length > 0" class="content-container">
        <router-view ref="child" :topic-msg="status.curTopic"/>
        <editionFooter></editionFooter>
      </div>

      <div v-if="data.topicList && data.topicList.length === 0" class="uirb-no-topic uirb-no-data"></div>
    </div>

    <!-- 暂无标准情况 -->
    <div v-else class="uirb-no-data-img">
      <p class="no-data-tip">暂无可见标准</p>
      <editionFooter></editionFooter>
    </div>
  </div>
</template>

<script>
import standardMenu from '@/views/common/standardMenu/index.vue'
import sideMenu from '@/views/common/tree/uirbTree.vue'
import editionFooter from '@/views/common/footer/footer.vue'
import editTopic from './components/editTopic.vue'

export default {
  name: 'ResourceManageInfoRepo',

  components: {
    standardMenu,
    sideMenu,
    editionFooter,
    editTopic
  },

  data() {
    return {
      status: {
        standardId: '', // 当前标准ID
        searchText: '',
        initFinish: false,
        curTopic: null
      },
      data: {
        topicList: null, // 专题列表
        standardList: []
      },
      loading: false
    }
  },

  methods: {
    /**
     * 切换标准
     */
    handleStandardClick(item, list) {
      if (list) this.data.standardList = list

      this.status.standardId = item.id
      this.status.initFinish = true
      this.data.topicList = null

      if (item.id) this.queryList()
    },

    /**
     * 请求标准下专题列表
     * @param {int} topicId 请求结束后跳转的专题id，未传此参数默认跳转列表第一个
     */
    queryList(topicId = null) {
      this.$api.queryTopics(this.status.standardId, { searchText: this.status.searchText, containDetail: 1 }).then(data => {
        this.data.topicList = data
        if (data.length > 0) {
          const topic = topicId ? this.data.topicList.find(item => item.id === topicId) : null
          this.handleTopicChange(topic || data[0])
        }
      })
    },

    /**
     * 切换专题
     */
    handleTopicChange(topic) {
      this.status.curTopic = JSON.parse(JSON.stringify(topic))

      let path = this.$route.path.split('/')[3]
        let params = {
        standardid: this.status.standardId,
        topicid: this.status.curTopic.id,
        isMounted: 1
      }

      // 列表页切换分类需重选资源
      if (!path || path === 'list') path = 'home'

      this.$router.push({ path: '/manage/topic/' + path, query: params })
    },

    editTopic (topic) {
      this.$dialog(editTopic, { title: topic ? '编辑专题' : '新增专题', standardId: this.status.standardId, topic: topic }).then((data) => {
        this.queryList(data !== true ? data : this.status.curTopic.id)

        // 如果修改的是当前专题，刷新右侧数据表
        if (topic.id === this.status.curTopic.id) {
          this.$refs.child.queryList()
        }
      })
    },

    deleteTopic (topic) {
      this.$trsModalConfirm({content: '是否删除此专题？', title: '删除专题', danger: true}).then(data => {
        this.$api.delete(`/standards/${this.status.standardId}/dissertations/${topic.id}`).then(data => {
          this.$trsModalSuccess('删除专题成功!')
          this.queryList(topic.id === this.status.curTopic.id ? null : this.status.curTopic.id)
        })
      })
    }
  }
}
</script>

<style lang="scss">
.uirb-no-topic {
  margin-left: 200px;
  height: calc(100vh - 50px);
}
</style>
