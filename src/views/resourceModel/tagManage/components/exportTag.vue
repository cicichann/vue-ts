<template>
  <!-- 导入弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="导入标签" custom-class="upload-dialog">
    <div v-loading="loading" element-loading-text="正在导入中..." class="modal-wrapper">
      <el-form label-width="9.5em" class="demo-ruleForm">
        <el-form-item label="标签模板：" class="in-input-row">
          <span><a :href="src" class="temp-download">标签模板文件.xls</a><span class="des">(点击下载)</span><span class="des">请下载模板并修改后导入</span></span>
        </el-form-item>
        <el-form-item class="in-input-row" label="选择要导入的文件：">
          <el-upload ref="upload" :file-list="fileList" :before-upload="beforeUpload" :auto-upload="false" :on-change="changeFiles" :on-remove="removeFiles"
                     action="#" accept=".txt,.xls,.xlsx" class="upload-demo">
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
  name: 'exportTagDialog',

  data () {
    return {
      loading: false,
      fileList: [], //导入文件列表
      src: `${window.location.origin}/uirb/labels/template` //导入模板地址
    }
  },

  methods: {
    /**
     * 导入操作
     */
    beforeUpload (file) {
      this.loading = true
      let formData = new FormData()
      formData.append('file', file)

      this.$api.exportTagList(formData).then(data => {
        this.$trsModalSuccess('导入标签成功！')
        this.$close()
      }, data => {
        this.loading = false
      })
    },

    /**
     * 选择文件
     */
    changeFiles (file, fileList) {
      this.fileList = fileList
    },

    /**
     * 删除文件
     */
    removeFiles (file, fileList) {
      this.fileList = fileList
    },

    /**
     * 确认按钮
     */
    confirm () {
      if (this.fileList.length > 0) {
        this.$refs.upload.submit()
      } else {
        this.$trsModalError('导入失败，请先上传文件！')
      }
    }
  }
}
</script>
