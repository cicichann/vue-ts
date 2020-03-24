<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" :custom-class="className">
    <!-- 选择表、字段 -->
    <uirb-resizable v-show="step === 1">
      <div v-loading="loading" element-loading-text="数据加载中..." class="clearfix">
        <div class="dialog-panel task-panel">

          <!-- 表名、字段检索 -->
          <div class="panel-head">
            <el-input v-model="status.searchText" placeholder="请输入表名或字段名" @keyup.enter.native="filterFieldList">
              <i slot="suffix" class="input-icon" @click="filterFieldList"/>
            </el-input>
          </div>

          <div class="panel-body">
            <el-checkbox-group v-model="data.checkedFieldList">
              <ul v-for="table in data.filterTableList" :key="table.tableId">
                <li class="table-title">
                  <i :class="{'expanded': table.isExpand}" class="arrow-icon" @click="toggleFields(table)"></i>
                  <span :title="table.tableDesc" class="item-desc">{{ table.tableDesc }}</span><el-checkbox :label="'4-' + table.tableId + '-' + table.tableDesc" @change="handleCheck"/>
                </li>
                <template v-if="table.isExpand">
                  <li v-for="filed in table.fieldInfos" :key="filed.fieldId" class="table-field-item">
                    <span :title="filed.fieldDesc" class="item-desc">{{ filed.fieldDesc }}</span><el-checkbox :label="'3-' + filed.fieldId + '-' + filed.fieldDesc" @change="handleCheck"/>
                  </li>
                </template>
              </ul>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 已选表、字段列表 -->
        <div class="dialog-panel task-panel checked-list">
          <div class="panel-head">
            <h6>已选表/字段</h6>
          </div>
          <div class="panel-body">
            <ul>
              <li v-for="filed in data.checkedFieldList" :key="filed" :title="filed.split('-')[2]"><i class="delete-icon" @click="removeFiled(filed)"></i>{{ filed.split("-")[2] }}</li>
            </ul>
          </div>
        </div>

        <p class="tip">只迁移正确配置映射的数据</p>
      </div>
    </uirb-resizable>

    <!-- 填写任务名称 -->
    <div v-loading="loading" v-show="step === 2" element-loading-text="数据加载中...">
      <el-form ref="taskForm" :model="taskForm" :rules="taskRule" label-width="105px" label-suffix="：" @submit.native.prevent>
        <el-form-item class="in-input-row" label="任务名称" prop="name">
          <el-input v-model.trim="taskForm.name" placeholder="请输入任务名称"/>
        </el-form-item>

        <!-- <el-form-item class="in-input-row" label="迁移数量策略" prop="transferNum">
          <el-radio v-model="status.isNumPolicy" :label="false">不限制</el-radio>
          <el-radio v-model="status.isNumPolicy" :label="true">迁移前若干条</el-radio>
          <el-input v-if="status.isNumPolicy" v-model="taskForm.transferNum" placeholder="请输入迁移条数" @input="handleNumChange"/>
        </el-form-item> -->

        <el-form-item class="in-input-row" label="增量接入">
          <el-select v-model="taskForm.addMode" placeholder="请选择增量接入" @change="handleModeChange">
            <el-option v-for="item in addModeTypes" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
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
  name: 'editCrawlTaskDialog',

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
        checkedFieldList: [] // 已选表、字段id列表
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
      addModeTypes: [
        {
          label: '不使用',
          value: 'none'
        },
        {
          label: '一天一次',
          value: '1d'
        },
        {
          label: '一周一次',
          value: '1w'
        },
        {
          label: '一月一次',
          value: '1m'
        }
      ]
    }
  },

  computed: {
    title () {
      return this.taskId ? '编辑迁移任务' : '新增迁移任务'
    },

    className () {
      return this.step === 1 ? 'task-dialog crawler-task-dialog resizable-dialog' : 'task-dialog crawler-task-dialog normal-dialog'
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
     * 请求字段列表
     */
    queryFieldList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }

        this.$api.queryTables(url).then((data) => {
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
        transferNum: '',
        addMode: 'none'
      }
      this.queryFieldList()
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
      this.queryFieldList().then(() => {
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
        let choosedInfo = JSON.parse(data.choosedInfo)

        this.taskForm = {
          name: data.taskName,
          tablesAndFields: [],
          sitesAndChannels: [],
          beginTime: '',
          endTime: '',
          transferNum: '',
          addMode: data.addMode
        }

        if (this.taskForm.transferNum) {
          this.status.isNumPolicy = true
        }

        this.data.tableList.map((table) => {
          choosedInfo.map((item) => {
            if (item.type === '4' && item.id === table.tableId.toString()) {
              this.data.checkedFieldList.push(item.type + '-' + item.id + '-' + table.tableDesc)
            }
          })

          table.fieldInfos.map((field) => {
            choosedInfo.map((item) => {
              if (item.type === '3' && item.id === field.fieldId.toString()) {
                this.data.checkedFieldList.push(item.type + '-' + item.id + '-' + field.fieldDesc)
              }
            })
          })
        })

        this.scrollToBottom()
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 筛选表、字段
     */
    filterFieldList () {
      this.loading = true
      let keyWords = this.status.searchText
      let resultList = []

      this.data.tableList.map((table) => {
        if (table.tableDesc.indexOf(keyWords) >= 0) {
          resultList.push(table)
        } else {
          table.fieldInfos.map((field) => {
            if (field.fieldDesc.indexOf(keyWords) >= 0 && resultList.indexOf(table) < 0) {
              resultList.push(table)
            }
          })
        }
      })

      this.data.filterTableList = resultList
      this.loading = false
    },

    /**
     * 展开、收起该表字段
     */
    toggleFields (table) {
      if (!table.isExpand) {
        this.$set(table, 'isExpand', true)
      } else {
        table.isExpand = !table.isExpand
      }
    },

    /**
     * 移除已选表、字段
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
        let fieldIds = []
        this.data.checkedFieldList.map((item) => {
          let itemArr = item.split('-')
          let type = itemArr[0]
          let id = itemArr[1]
          let list = this.taskForm.tablesAndFields
          if (type === '4') {
            this.data.tableList.map((table) => {
              if (table.tableId.toString() === id) {
                table.fieldInfos.map((field) => {
                  fieldIds.push(field.fieldId.toString())
                })
              }
            })
          } else if (fieldIds.indexOf(id) < 0) {
            fieldIds.push(id)
          }

          list.push({
            type: type,
            id: id
          })
        })

        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }

        let formData = new FormData();
        formData.append('taskName', this.taskForm.name)
        formData.append('tablesAndFields', JSON.stringify(this.taskForm.tablesAndFields))
        formData.append('sitesAndChannels', this.taskForm.sitesAndChannels)
        formData.append('beginTime', this.taskForm.beginTime)
        formData.append('endTime', this.taskForm.endTime)
        formData.append('transferNum', this.taskForm.transferNum)
        formData.append('fieldIds', fieldIds.join(','))
        formData.append('addMode', this.taskForm.addMode ? this.taskForm.addMode : '')

        this.taskId ? this.editTask(url, formData) :  this.addTask(url, formData)
      }, () => {
        this.loading = false
      })
    },

    /**
     * 数量策略改变
     */
    handleNumChange (val) {
      if (val && (this.taskForm.addMode && this.taskForm.addMode !== 'none')) {
        this.taskForm.transferNum = ''
        this.$trsModalError('数量策略不支持增量接入！')
      }
    },

    /**
     * 增量接入模式改变
     */
    handleModeChange (val) {
      if (val !== 'none' && (this.taskForm.transferNum && this.taskForm.transferNum !== '0')) {
        this.taskForm.addMode = 'none'
        this.$trsModalError('增量接入不支持数量策略！')
      }
    },

    /**
     * 定位到已选列表底部
     */
    scrollToBottom () {
      let ele = document.querySelector('.crawler-task-dialog .checked-list .panel-body')
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
.crawler-task-dialog {
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

.crawler-task-dialog.normal-dialog {
  width: 520px !important;
  height: auto !important;
}
</style>