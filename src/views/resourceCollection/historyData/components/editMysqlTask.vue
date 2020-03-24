<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" :custom-class="className">
    <!-- 选择表、字段 -->
    <uirb-resizable v-show="step === 1">
      <div v-loading="loading" element-loading-text="数据加载中..." class="clearfix">
        <div class="dialog-panel task-panel">

          <!-- 表名、字段检索 -->
          <div class="panel-head">
            <el-input v-model="status.searchText" placeholder="请输入表名" @keyup.enter.native="filterFieldList">
              <i slot="suffix" class="input-icon" @click="filterFieldList"/>
            </el-input>
          </div>

          <div class="panel-body">
            <el-checkbox-group v-model="data.checkedFieldList">
              <ul>
                <li v-for="(table,index) in data.filterTableList" :key="index" class="table-title">
                  <span :title="table.name" class="item-desc mysql-desc" >{{ table.name }}</span><el-checkbox :label="table.name" @change="handleCheck"/>
                </li>
              </ul>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 已选表、字段列表 -->
        <div class="dialog-panel task-panel checked-list">
          <div class="panel-head">
            <h6>已选</h6>
            <i class="icon add-icon" @click="popoverShow = true"></i>
            <div v-if="popoverShow" class="popover">
              <textarea v-model="data.inputIds" placeholder="请输入表名，如：dbTableNames=tableName1,tableName2"></textarea>
              <i class="icon confirm-icon" @click="handleConfirm"></i>
              <i class="icon cancel-icon" @click="popoverShow = false"></i>
            </div>
          </div>
          <div class="panel-body">
            <ul>
              <li v-for="filed in data.checkedFieldList" :title="filed" :key="filed"><i class="delete-icon" @click="removeFiled(filed)"></i>{{ filed }}</li>
            </ul>
          </div>
        </div>

        <p class="tip">只迁移正确配置映射的数据</p>
      </div>
    </uirb-resizable>

    <!-- 填写任务名称 -->
    <div v-loading="loading" v-show="step === 2" element-loading-text="数据加载中...">
      <el-form ref="taskForm" :model="taskForm" :rules="taskRule" label-width="100px" @submit.native.prevent>
        <el-form-item class="in-input-row" label="任务名称" prop="name">
          <el-input v-model.trim="taskForm.name" placeholder="请输入任务名称"/>
        </el-form-item>

        <template v-if="isTimeStrategy">
          <el-form-item class="in-input-row" label="迁移时间策略" prop="beginTime">
            <el-date-picker v-model="taskForm.beginTime" :picker-options="beginOptions" value-format="timestamp" type="date" placeholder="请选择开始时间(创建时间)"/>
          </el-form-item>
          <el-form-item class="in-input-row" label="" prop="endTime">
            <el-date-picker v-model="taskForm.endTime" :picker-options="endOptions" value-format="timestamp" type="date" placeholder="请选择结束时间(创建时间)"/>
          </el-form-item>
        </template>

        <!-- <el-form-item class="in-input-row" label="迁移数量策略" prop="transferNum">
          <el-radio v-model="status.isNumPolicy" :label="false">不限制</el-radio>
          <el-radio v-model="status.isNumPolicy" :label="true">迁移前若干条</el-radio>
          <el-input v-if="status.isNumPolicy" v-model="taskForm.transferNum" placeholder="请输入迁移条数"/>
        </el-form-item> -->
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <template v-if="step === 1">
        <el-button :disabled="data.checkedFieldList.length === 0" type="primary" @click="next">{{ buttonText }}</el-button>
        <el-button @click="$dismiss">取 消</el-button>
      </template>
      <template v-else>
        <el-button type="primary" @click="prev">{{ buttonText }}</el-button>
        <el-button :disabled="loading" type="primary" @click="confirm">确 认</el-button>
      </template>
    </span>
  </el-dialog>
</template>

<script>
import uirbResizable from '@/views/common/resizable/index'

export default {
  name: 'editMysqlTaskDialog',

  components: { uirbResizable },

  props: {
    taskId: {
      type: Number,
      default: 0
    },
    taskIndex: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      isShow: false, // 默认隐藏
      step: 1, // 默认为第一步
      data: {
        tableList: [], // 表数据
        filterTableList: [], // 筛选后的表数据
        checkedFieldList: [], // 已选表名列表
        inputIds: '' // 手动填写的id
      },
      timeProp: {
        fromTime: '',
        endTime: ''
      },
      // 限制开始选择时间，今天之前或结束时间之前
      beginOptions: {
        disabledDate: (time) => {
          if (this.timeProp.endTime) {
            return time.getTime() > this.timeProp.endTime
          } else {
            return time.getTime() > Date.now()
          }
        }
      },
      // 限制结束时间为开始时间之后
      endOptions: {
        disabledDate: (time) => {
          return time.getTime() < this.taskForm.beginTime || time.getTime() > Date.now()
        }
      },
      status: {
        searchText: '', // 检索输入
        isNumPolicy: false // 是否采用数量策略
      },
      taskForm: {}, // 初始化表单数据
      taskRule: {
        name: [
          { required: true, message: '请输入任务名称', trigger: ['blur', 'change'] },
          { validator: this.checkTaskName, trigger: ['blur', 'change'] }
        ]
      },
      isTimeStrategy: true, // 默认展示时间策略
      popoverShow: false // 默认隐藏手动添加面板
    }
  },

  computed: {
    title () {
      return this.taskId ? '编辑迁移任务' : '新增迁移任务'
    },

    className () {
      return this.step === 1 ? 'task-dialog db-task-dialog resizable-dialog' : 'task-dialog db-task-dialog normal-dialog'
    },

    buttonText () {
      return this.step === 1 ? '下一步' : '上一步'
    }
  },

  mounted () {
    if (this.taskId) {
      this.findTaskById()
    } else {
      this.initData()
    }
  },

  methods: {
    /**
     * 请求数据表列表
     */
    queryDatabaseList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }
        this.$api.queryDatabase(url).then(data => {
          this.data.tableList = data
          this.data.filterTableList = data
          this.loading = false
          resolve()
        })
      })
    },

    /**
     * 新增初始化数据
     */
    initData () {
      this.taskForm = {
        name: '',
        tablesAndFields: [],
        sitesAndChannels: [],
        beginTime: '',
        endTime: '',
        transferNum: ''
      }
      this.queryDatabaseList().then(() => {
        this.queryTimeStrategy()
      })
    },

    /**
     * 重置表单
     */
    resetForm (formName) {
      if (this.$refs[formName]) {
        this.$refs[formName].resetFields()
      }
    },

    /**
     * 编辑初始化数据
     */
    findTaskById () {
      this.queryDatabaseList().then(() => {
        this.queryTaskInfo()
      })
    },

    /**
     * 请求任务详情
     */
    queryTaskInfo () {
      this.loading = true
      this.data.checkedFieldList = []

      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid,
        taskId: this.taskId
      }
      this.$api.queryTaskInfo(url).then(data => {
        this.taskForm = {
          name: data.taskName,
          beginTime: data.beginTime ? parseInt(data.beginTime) : '',
          endTime: data.endTime ? parseInt(data.endTime) : '',
          transferNum: data.transferNum
        }

        if (this.taskForm.transferNum) {
          this.status.isNumPolicy = true
        }

        data.dbTableNames.forEach(item => {
          this.data.checkedFieldList.push(item.name)
        })

        this.scrollToBottom()
        this.queryTimeStrategy()
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 筛选表、字段
     */
    filterFieldList () {
      let keyWords = this.status.searchText
      let resultList = []

      this.data.tableList.map((table) => {
        if (table.name.indexOf(keyWords) >= 0) {
          resultList.push(table)
        }
      })
      if (keyWords === '') {
        resultList = this.data.tableList
      }
      this.data.filterTableList = resultList
    },

    /**
     * 移除已选
     */
    removeFiled (filed) {
      let fieldList = this.data.checkedFieldList
      fieldList.splice(fieldList.indexOf(filed), 1)
    },

    /**
     * 点击下一步
     */
    next () {
      this.step = 2
    },

    /**
     * 点击上一步
     */
    prev () {
      this.step = 1
    },

    /**
     * 任务名称校验
     */
    checkTaskName (rule, value, callback) {
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }

      let params = {
        taskName: this.taskForm.name,
        checkDuplicatedTaskId: this.taskId
      }

      this.$api.verifyTaskName(url, params).then((data) => {
        if (data.isDuplicate === 'true') {
          callback(new Error(data.msg))
        } else {
          callback()
        }
      })
    },

    /**
     * 新增任务
     */
    addTask (url, params) {
      this.loading = true
      this.$api.addTask(url, params).then(data => {
        this.$trsModalSuccess('新增任务成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 编辑任务
     */
    editTask (url, params) {
      this.loading = true
      url.taskId = this.taskId
      this.$api.editTask(url, params).then(data => {
        this.$trsModalSuccess('编辑任务成功！')
        this.$close(this.taskIndex)
      }, err => {
        this.loading = false
      })
    },

    /**
     * 点击确认按钮
     */
    confirm () {
      this.$refs.taskForm.validate().then(() => {
        this.loading = true
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }

        let formData = new FormData();
        formData.append('taskName', this.taskForm.name)
        formData.append('beginTime', this.taskForm.beginTime ? this.taskForm.beginTime : '')
        formData.append('endTime', this.taskForm.endTime ? this.taskForm.endTime + 86399000 : '')
        formData.append('transferNum', this.taskForm.transferNum)
        formData.append('dbTableNames', this.data.checkedFieldList.join(','))
        this.taskId ? this.editTask(url, formData) : this.addTask(url, formData)
      }, () => {
        this.loading = false
      })
    },

    /**
     * 查询是否需要时间策略
     */
    queryTimeStrategy () {
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }

      this.$api.queryTimeStrategy(url).then(data => {
        this.isTimeStrategy = data
      })
    },

    /**
     * 点击手动填写面板的确认按钮
     */
    handleConfirm () {
      let input = this.data.inputIds
      if (input.trim() && input.indexOf('=') >= 0) {
        let ids = input.split('=')[1].replace(/，/g, ',').split(',')
        ids.map((item) => {
          let table = this.data.tableList.find((table) => {
            return table.name === item.trim()
          })
          if (table) {
            let list = this.data.checkedFieldList
            if (list.indexOf(table.name) < 0) {
              list.push(table.name)
            }
          }
        })
        this.scrollToBottom()
      }
      this.data.inputIds = ''
      this.popoverShow = false
    },

    /**
     * 定位到已选列表底部
     */
    scrollToBottom () {
      let ele = document.querySelector('.db-task-dialog .checked-list .panel-body')
      this.$nextTick(() => {
        ele.scrollTop = ele.scrollHeight
      })
    },

    /**
     * 复选框勾选事件
     */
    handleCheck (val) {
      if (val) this.scrollToBottom()
    }
  }
}
</script>

<style lang="scss">
.db-task-dialog {
  .dialog-panel {
    position: absolute;
    bottom: 30px;
    top: 0;
    height: auto;
    width: calc(50% - 40px);
  }

  .dialog-panel:first-child {
    left: 30px;
  }

  .panel-head .el-input {
    width: 100%;
  }

  .checked-list {
    right: 30px;
  }
}

.db-task-dialog.normal-dialog {
  width: 520px !important;
  height: auto !important;
}
</style>