<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="导入用户" custom-class="upload-dialog">
    <div v-loading="loading" element-loading-text="正在导入中..." class="modal-wrapper">
      <el-form label-width="10em" class="demo-ruleForm">
        <el-form-item label="用户模板：" class="in-input-row">
          <p><a :href="src" class="temp-download">用户模板.txt</a><span class="des">(点击下载)</span><span class="des">请下载模板并修改后导入</span></p>
        </el-form-item>
        <el-form-item class="in-input-row" label="选择要导入的文件：">
          <el-upload ref="upload" :file-list="fileList" :limit="1" :auto-upload="false" :on-exceed="handleExceed" :before-upload="beforeUpload"
                     :on-change="changeFiles" :on-remove="removeFiles" action="" accept=".txt" multiple class="upload-demo">
            <el-button icon="upload-icon">导入文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'loadUserDialog',

  props: {
    src: {
      type: String,
      required: true
    },
    groupId: {
      type: Number,
      default: 0
    }
  },

  data () {
    return {
      loading: false,
      fileList: [], // 导入文件列表
      haveFiles: false
    }
  },

  methods: {
    /**
     * 超出文件数量提示
     */
    handleExceed (files, fileList) {
      this.$message.warning(`只能选择一个文件哦！`)
    },

    /**
     * 用户管理-导入用户
     */
    importUser (data) {
      this.$api.exportUser(data).then(data => {
        this.$trsModalSuccess('导入用户成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 组织管理-导入用户
     */
    importUserToGroup (data) {
      this.$api.exportUserToGroup(this.groupId, data).then(data => {
        this.$trsModalSuccess('导入用户成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 导入操作
     */
    beforeUpload (file) {
      this.loading = true
      let formData = new FormData()
      formData.append('file', file)

      this.groupId ? this.importUserToGroup(formData) : this.importUser(formData)
    },

    /**
     * 选择文件
     */
    changeFiles (file, fileList) {
      this.haveFiles = fileList.length > 0
    },

    /**
     * 删除文件
     */
    removeFiles () {
      this.haveFiles = false
    },

    /**
     * 确认导入
     */
    confirm () {
      if (this.haveFiles) {
        this.$refs.upload.submit()
      } else {
        this.$trsModalError('导入失败，请先上传文件！')
      }
    }
  }
}
</script>
