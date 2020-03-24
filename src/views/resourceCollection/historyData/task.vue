<template>
  <div class="history-data">
    <!-- 头部 -->
    <div class="sub-nav">
      <!-- 左侧按钮 -->
      <div class="fl">
        <button v-access="'aggr.historydata.addtask'" :disabled="!$route.query.datasourceid" class="edit-btn other-btn" @click="editTask({})">新增任务</button>
        <button v-access="'aggr.historydata.deletetask'" :disabled="data.selectedTask.length === 0" class="edit-btn delete-btn" @click.prevent="deleteTask">删除</button>
      </div>

      <!-- 面包屑、检索 -->
      <div class="fr">
        <el-breadcrumb class="fl" separator-class="el-icon-arrow-right">
          <span class="fl sign"/>
          <el-breadcrumb-item>全部</el-breadcrumb-item>
        </el-breadcrumb>
        <el-input v-model="status.searchText" placeholder="请输入任务名称" class="normal-input" @keyup.enter.native="searchList">
          <i slot="suffix" style="top: 0" class="input-icon" @click="searchList"/>
        </el-input>
      </div>
    </div>

    <!-- 主体 -->
    <div v-loading="loading" class="table-content" element-loading-text="数据加载中...">
      <div v-if="data.taskList.length === 0 && !loading" class="uirb-no-data"/>
      <ul v-infinite-scroll="queryList" infinite-scroll-disabled="disabled" class="task-list">
        <li v-for="(task, index) in data.taskList" :key="task.taskId" :class="{'cursor': !(task.status === TASK_STATUS.notStarted && task.finishedNum === 0 ||
        task.status === TASK_STATUS.parsing || task.status === TASK_STATUS.parseFailed)}" @click="viewTask(task)">
          <div @click.stop>
            <!-- 迁移中的任务不可删除 -->
            <el-checkbox v-model="data.selectedTask" :label="task.taskId"
                         :disabled="task.status === TASK_STATUS.transfering || !$checkRight('aggr.historydata.deletetask')"/>
            <!-- 仅未开始的任务可编辑 -->
            <button v-access="'aggr.historydata.edittask'" v-if="task.status === TASK_STATUS.notStarted && task.finishedNum === 0" class="list-icon edit-icon fr"
                    title="编辑" @click.stop="editTask(task, index)"/>
            <!-- 有失败数据的任务重迁，解析失败任务重新解析 -->
            <p v-access="'aggr.historydata.restart'" v-if="task.status === TASK_STATUS.finished && task.failedNum > 0 || task.status === TASK_STATUS.parseFailed"
               class="restart-badge fr">
              <i :title="task.status === TASK_STATUS.parseFailed ? '重新解析' : '重新迁移失败数据'" class="restart-icon" @click="changeStatus(task)"></i>
              <span v-if="task.status === TASK_STATUS.finished && task.failedNum > 0">{{ task.failedNum | formatNum }}</span>
            </p>
          </div>
          <h6 :title="task.taskName">{{ task.taskName }}</h6>
          <p class="task-status">
            <span>
              <!-- 迁移状态图标，未开始灰色，解析中、迁移中、删除中为蓝色，完成为绿色，解析失败、删除失败为红色 -->
              <i :class="{'is-ongoing': task.status === TASK_STATUS.parsing || task.status === TASK_STATUS.transfering || task.status === TASK_STATUS.deleting,
                          'is-completed': task.status === TASK_STATUS.finished, 'is-failed': task.status === TASK_STATUS.parseFailed || task.status === TASK_STATUS.deleteFailed }"
                 class="status-icon"></i>
              <span>{{ task| formatStatus }}</span>
            </span>
            <span class="gray">{{ task.createTime | formatDate }}</span>
            <!-- 未开始的任务点击开始迁移 -->
            <i v-if="task.status === TASK_STATUS.notStarted && startTaskRight" class="play-icon control-icon" @click.stop="changeStatus(task)"></i>
            <!-- 迁移中的任务点击暂停迁移 -->
            <i v-if="task.status === TASK_STATUS.transfering && pauseTaskRight" class="pause-icon control-icon" @click.stop="changeStatus(task)"></i>
          </p>
          <!-- 已暂停、非爬虫的解析中、迁移中、迁移完成任务，有进度条 -->
          <div class="task-progress">
            <template v-if="(task.status === TASK_STATUS.notStarted && task.allNum !== 0) || (task.status === TASK_STATUS.parsing && $route.query.datasourcetype !== 'crawler') ||
            task.status === TASK_STATUS.transfering || task.status === TASK_STATUS.finished">
              <!-- 解析中的进度条 -->
              <el-progress v-if="task.status === TASK_STATUS.parsing" :percentage="task.analyzeTotalNum !== 0 ? Math.floor(task.analyzeNum * 100 / task.analyzeTotalNum) : 0"
                           :text-inside="true" :stroke-width="18"/>
              <!-- 迁移完成的进度条 -->
              <el-progress v-else-if="task.status === TASK_STATUS.finished" :percentage="100" :text-inside="true" :stroke-width="18" status="success" />
              <!-- 已暂停、迁移中的进度条 -->
              <el-progress v-else :percentage="(task.finishedNum > task.allNum) ? 100 : (task.allNum > 0 ? Math.floor(task.finishedNum * 100 / task.allNum) : 0)"
                           :text-inside="true" :stroke-width="18" />
            </template>
          </div>
          <!-- 未开始、解析中、解析失败任务，无底部文案 -->
          <p v-if="!((task.status === TASK_STATUS.notStarted && task.allNum === 0) || task.status === TASK_STATUS.parsing || task.status === TASK_STATUS.parseFailed)" class="gray">
            <span v-if="task.status === TASK_STATUS.deleting || task.status === TASK_STATUS.deleteFailed">剩余条数：</span>
            <span v-else>已完成：</span>
            <!-- 完成数量，迁移中为蓝色，已完成为绿色，其余场景为灰色 -->
            <span :class="{'is-ongoing': task.status === TASK_STATUS.transfering, 'is-completed': task.status === TASK_STATUS.finished}">{{ task.finishedNum }}</span>
            <!-- 仅已暂停、迁移中、完成的任务展示数据总数 -->
            <template v-if="!(task.status === TASK_STATUS.deleting || task.status === TASK_STATUS.deleteFailed)"> / <span>{{ task.allNum }}</span></template>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import editCmsTaskDialog from './components/editCmsTask'
import editCrawlTaskDialog from './components/editCrawlTask'
import editXmlTaskDialog from './components/editXmlTask'
import editMysqlTaskDialog from './components/editMysqlTask'
import deleteTaskDialog from './components/deleteTask'
import { TASK_STATUS } from '@/config/index'
import fecha from 'fecha'

export default {
  name: 'HistoryTaskList',

  filters: {
    formatStatus (task) {
      let status = task.status
      let finishedNum = task.finishedNum
      let statusStr = ''
      switch (parseInt(status)) {
        case TASK_STATUS.notStarted:
          statusStr = finishedNum === 0 ? '未开始' : '已暂停'
          break
        case TASK_STATUS.parsing:
          statusStr = '解析中'
          break
        case TASK_STATUS.transfering:
          statusStr = '迁移中'
          break
        case TASK_STATUS.finished:
          statusStr = '迁移完成'
          break
        case TASK_STATUS.parseFailed:
          statusStr = '解析失败'
          break
        case TASK_STATUS.deleting:
          statusStr = '删除中'
          break
        case TASK_STATUS.deleteFailed:
          statusStr = '删除失败'
          break
      }
      return statusStr
    },

    formatNum (num) {
      return num > 99 ? '99+' : num
    },

    formatDate (timeStamp) {
      return fecha.format(+timeStamp, 'YYYY-MM-DD')
    }
  },

  data () {
    return {
      loading: false,
      isPwdShow: false, // 默认密文显示
      data: {
        taskList: [],
        selectedTask: [], // 已选项
        pagination: {
          pageSize: 30,
          currPage: 0
        }
      },
      status: {
        searchText: '', // 检索输入
        taskId: 0, // 默认操作的任务id
        taskIndex: '' // 操作的任务索引值
      },
      startTaskRight: false,
      pauseTaskRight: false,
      isLoading: false, // 是否正在请求数据
      noMore: false, // 是否最后一页
      toUrl: '', // 当前页的url
      fromUrl: '', // 上一页的url
      timer: null,
      TASK_STATUS: TASK_STATUS
    }
  },

  computed: {
    disabled () {
      return this.isLoading || this.noMore
    }
  },

  watch: {
    '$route' (newValue, oldValue) {
      this.noMore = false
      this.data.taskList = []
      this.data.selectedTask = []
      this.data.pagination.currPage = 0
      this.data.pagination.pageSize = 30
      clearTimeout(this.timer)
      this.queryList()
    },

    'data.taskList': {
      deep: true,
      handler(newVal, oldValue) {
        localStorage.setItem('noMore', this.noMore)
        localStorage.setItem('pageIndex', this.data.pagination.currPage)
        if(newVal.length) {
          localStorage.setItem('taskList', JSON.stringify(newVal))

          // 实时刷新列表数据
          let ids = []
          newVal.map(task => {
            let status = task.status,
                STATUS = TASK_STATUS
            if ((status === STATUS.parsing || status === STATUS.transfering || status === STATUS.deleting) && ids.indexOf(task.taskId) < 0) {
              ids.push(task.taskId)
            }
          })
          if (newVal.length && ids.length > 0) {
            clearTimeout(this.timer)
            return this.timer = setTimeout(() => {
              this.queryList(true, 1, ids)
            }, 2000)
          }
        }
      }
    }
  },

  beforeRouteEnter (to, from, next){
    window.toUrl = to
    window.fromUrl = from
    next(vm => { })
  },

  mounted () {
    this.startTaskRight = this.$checkRight('aggr.historydata.starttask')
    this.pauseTaskRight = this.$checkRight('aggr.historydata.pausetask')

    if (window.fromUrl && window.fromUrl.path.indexOf('/collection/history/list') > -1 && window.toUrl.query.datasourceid === window.fromUrl.query.datasourceid) {
      this.noMore = (localStorage.getItem('noMore') === 'true')
      this.data.pagination.currPage = parseInt(localStorage.getItem('pageIndex'))
      this.data.taskList = JSON.parse(localStorage.getItem('taskList'))
      this.queryList(false, 1, [window.fromUrl.query.taskid])
    } else {
      this.queryList()
    }
  },

  beforeDestroy() {
    clearTimeout(this.timer)
  },

  methods: {
    /**
     * 请求列表数据
     * @param {boolean} isTimer 是否定时器触发
     * @param {number} index 编辑的任务索引
     */
    queryList (isTimer, pageIndex, ids) {
      clearTimeout(this.timer)

      if (!this.$route.query.datasourceid) {
        this.isLoading = false
        this.loading = false
        return
      }

      this.isLoading = true
      if (!isTimer) this.loading = true

      let url = {
        standardId: this.$route.query.standardid,
        datasourceId: this.$route.query.datasourceid
      },
      params = {
        taskName: this.status.searchText,
        pageIndex: pageIndex ? pageIndex : this.data.pagination.currPage + 1,
        pageSize: this.data.pagination.pageSize,
        taskIds: ids ? ids.join(',') : ''
      }

      this.$api.queryTaskList(url, params).then(data => {
        data.data = data.data.map(task => {
          return Object.assign(task, {
            status: parseInt(task.status),
            finishedNum: parseInt(task.finishedNum),
            allNum: parseInt(task.allNum),
            analyzeNum: parseInt(task.analyzeNum),
            analyzeTotalNum: parseInt(task.analyzeTotalNum)
          })
        })

        if (isTimer || ids) {
          data.data.map(item => {
            let list = this.data.taskList
            let index = list.findIndex(task => { return task.taskId === item.taskId })
            if (index >= 0) list.splice(index, 1, item)
          })
        } else if (pageIndex) {
          let list = this.data.taskList.concat([])
          data.data.unshift(params.pageSize * (pageIndex - 1), params.pageSize)

          Array.prototype.splice.apply(list, data.data)
          this.data.taskList = []
          this.data.taskList = list
        } else {
          this.data.taskList = params.pageIndex === 1 ? data.data : this.data.taskList.concat(data.data)
          this.noMore = data.data.length < data.pager.pageSize
        }
        this.data.pagination = Object.assign(this.data.pagination, data.pager)
        this.isLoading = false
        this.loading = false
      }, err => {
        if (!err.__proto__.__CANCEL__) {
          this.isLoading = false
          this.loading = false
        }
      })
    },

    /**
     * 检索
     */
    searchList () {
      this.noMore = false
      this.data.pagination.currPage = 0
      this.data.pagination.pageSize = 30
      this.queryList()
    },

    /**
     * 删除任务
     */
    deleteTask () {
      this.$dialog(deleteTaskDialog, {query: this.$route.query, taskId: this.data.selectedTask}).then(() => {
        this.noMore = false
        this.data.selectedTask = []
        this.data.pagination.currPage = 0
        this.data.pagination.pageSize = 30
        this.queryList()
      })
    },

    /**
     * 新增/编辑任务
     */
    editTask (task, index = '') {
      let component,
          type = this.$route.query.datasourcetype
      if (type === 'http') {
        component = editCmsTaskDialog
      } else if (type === 'crawler') {
        component = editCrawlTaskDialog
      } else if (type === 'file') {
        component = editXmlTaskDialog
      } else if (type === 'db') {
        component = editMysqlTaskDialog
      }

      this.$dialog(component, {taskId: task.taskId, taskIndex: index + '', query: this.$route.query}).then(data => {
        if (typeof(data) === 'string') {
          this.queryList(false, Math.floor(parseInt(data) / 30) + 1)
        } else {
          this.noMore = false
          this.data.pagination.currPage = 0
          this.data.pagination.pageSize = 30
          this.queryList()
        }
      })
    },

    /**
     * 开始/暂停任务
     */
    changeStatus (task) {
      this.loading = true
      let url = {
        standardId: this.$route.query.standardid,
        datasourceId: this.$route.query.datasourceid,
        taskId: task.taskId
      }
      let status = parseInt(task.status),
          STATUS = TASK_STATUS,
          type
      if (status === STATUS.finished) {
        type = 2
      } else if (status === STATUS.parseFailed) {
        type = 3
      } else type = status === STATUS.notStarted ? 1 : 0
      let params = {
        type: type
      }

      this.$api.operateTask(url, params).then(data => {
        this.noMore = false
        this.data.pagination.currPage = 0
        this.data.pagination.pageSize = 30
        this.$trsModalSuccess('操作成功！')
        this.queryList()
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 查看任务
     */
    viewTask (task) {
      let status = task.status,
          STATUS = TASK_STATUS
      if (!(status === STATUS.notStarted && task.finishedNum === 0 || status === STATUS.parsing || status === STATUS.parseFailed)) {
        let _query = this.$route.query,
            query = {
          standardid: _query.standardid,
          datasourceid: _query.datasourceid,
          datasourcetype: _query.datasourcetype,
          taskid: task.taskId,
          taskname: task.taskName
        }
        this.$router.push({path: `/collection/history/list`, query})
      }
    }
  }
}
</script>
