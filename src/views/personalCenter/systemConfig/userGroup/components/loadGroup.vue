<template>
  <!-- 导入组织 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="导入组织" custom-class="upload-dialog export-group">
    <div v-loading="loading" element-loading-text="正在导入中..." class="modal-wrapper">
      <el-form class="demo-ruleForm">
        <el-form-item label="导入组织到：" class="in-input-row">
          <span class="blue">{{ groupName }}</span>
        </el-form-item>
        <el-form-item label="组织模板：" class="in-input-row">
          <p><a :href="src" class="temp-download">组织模板.txt</a>(点击下载)<span class="des">请先下载模板并按格式调整后上传</span></p>
        </el-form-item>
        <el-form-item class="in-input-row" label="选择导入文件：">
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
  name: 'loadGroupDialog',

  props: {
    groupName: {
      type: String,
      default: ''
    },
    parentGroupId: {
      type: Number,
      default: () => ''
    }
  },

  data () {
    return {
        loading: false,
        fileList: [], //导入文件列表
        src: `${window.location.origin}/uirb/groups/template`, //导入模板地址
        haveFiles: false
    }
  },

  methods: {
    /**
     * 超出文件数量提示
     */
    handleExceed(files, fileList) {
      this.$message.warning(`只能选择一个文件哦！`)
    },

    /**
     * 导入操作
     */
    beforeUpload(file) {
      this.loading = true
      let formData = new FormData()
      formData.append('parentGroupId',this.parentGroupId)
      formData.append('file',file)

      this.$api.loadTemplate(formData).then(data => {
        this.$trsModalSuccess('导入组织成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },


    /**
     * 改变文件状态
     */
    changeFiles(file, fileList) {
      this.haveFiles = fileList.length > 0
    },

    /**
     * 删除文件回调
     */
    removeFiles() {
      this.haveFiles = false
    },

    /**
     * 确认导入
     */
    confirm () {
      if (!this.haveFiles) {
        this.$trsModalError('导入失败，请先上传文件！')
      } else {
        this.$refs.upload.submit()
      }
    }
  }
}
</script>
<style lang="scss">
.export-group {
  .des {
    margin-left: 5px;
    font-size: 12px;
    color: #999;
  }
}
</style>
