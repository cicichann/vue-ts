<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" class="upload-dialog task-dialog">
    <el-form v-loading="loading" ref="taskForm" :model="taskForm" :rules="taskRule" label-width="8em" element-loading-text="数据加载中..." label-suffix="：">
      <el-form-item class="in-input-row" label="任务名称" prop="name">
        <el-input v-model.trim="taskForm.name" placeholder="请输入任务名称"/>
      </el-form-item>
      <el-form-item class="in-input-row" label="待迁移数据" prop="task">
        <el-upload ref="upload" :file-list="fileList" :on-change="changeFiles" :on-remove="removeFiles" :auto-upload="false"
                   action="" class="upload-demo" accept=".xml" multiple>
          <el-button icon="upload-icon">选择文件</el-button>
          <div slot="tip" class="el-upload__tip">请选择xml文件上传</div>
        </el-upload>
      </el-form-item>

      <!-- <el-form-item class="in-input-row" label="迁移数量策略" prop="transferNum">
        <el-radio v-model="status.isNumPolicy" :label="false">不限制</el-radio>
        <el-radio v-model="status.isNumPolicy" :label="true">迁移前若干条</el-radio>
        <el-input v-if="status.isNumPolicy" v-model="taskForm.transferNum" placeholder="请输入迁移条数"/>
      </el-form-item> -->
      <p class="tip xml-tip">只迁移正确配置映射的数据</p>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <template>
        <el-button :disabled="loading" type="primary" @click="exportXml">确认</el-button>
        <el-button @click="$dismiss">取 消</el-button>
      </template>
    </span>
  </el-dialog>
</template>

<script>
export default {
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
      fileList: [], //导入文件列表
      files: [],
      src: '', //导入模板地址
      haveFiles: false,
      status: {
        isNumPolicy: false // 是否采用数量策略
      },
      taskForm: {
        name: ''
      },
      taskRule: {
        name: [
          { required: true, message: '请输入任务名称', trigger: ['blur', 'change'] },
          {validator: this.checkTaskName, trigger: ['blur', 'change'] }
        ]
      },
    }
  },

  computed: {
    title () {
      return this.taskId ? '编辑迁移任务' :  '新增迁移任务'
    }
  },

  mounted () {
    if (this.taskId) {
      this.findTaskById()
    }
  },

  methods: {
    findTaskById () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid,
        taskId: this.taskId
      }
      this.$api.queryTaskInfo(url).then(data => {
        this.taskForm.name = data.taskName
        this.taskForm.transferNum = data.transferNum
        let xmlList = data.fileNames.split(',')
        xmlList.forEach(item => {
          let obj = {}
          obj.name = item
          this.fileList.push(obj)
        })

        if (this.taskForm.transferNum) {
          this.status.isNumPolicy = true
        }
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 改变文件状态
     */
    changeFiles (file, fileList) {
      if (fileList.length > 0) {
        this.haveFiles = true
      }
    },

    /**
     * 删除文件回调
     */
    removeFiles (file, fileList) {
      if (fileList.length === 0) {
        this.haveFiles = false
      }
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
     * 确认按钮
     */
    exportXml () {
      if (this.haveFiles) {
        this.$refs.taskForm.validate().then(() => {
          this.taskId ? this.editXmlTask() : this.addXmlTask()
        })
      } else {
        this.$trsModalError('导入失败，请先上传文件！')
      }
    },

    /**
     * 新增xml
     */
    addXmlTask () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }
      let formData = new FormData();
      let arrList = this.$refs.upload.uploadFiles
      arrList.forEach((item, index) => {
        formData.append('file', item.raw)
      })
      formData.append('taskName', this.taskForm.name)
      // formData.append('transferNum', this.taskForm.transferNum)
      this.$api.addXmlTask(url, formData).then(data => {
        this.$refs.upload.submit()
        this.$trsModalSuccess('新增任务成功！')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 编辑xml
     */
    editXmlTask () {
      this.loading = true
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid,
        taskId: this.taskId
      }
      let formData = new FormData();
      let arrList = this.$refs.upload.uploadFiles
      let fileNames = []
      arrList.forEach((item, index) => {
        if (item.status === 'success') {
          fileNames.push(item.name)
        } else {
          formData.append('file', item.raw)
        }
      })
      formData.append('fileNames', fileNames.join(','))
      formData.append('taskName', this.taskForm.name)
      // formData.append('transferNum', this.taskForm.transferNum)
      this.$api.editXmlTask(url, formData).then(data => {
        this.$refs.upload.submit()
        this.$trsModalSuccess('编辑任务成功！')
        this.$close(this.taskIndex)
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>
