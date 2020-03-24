<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="导入数据表" custom-class="upload-dialog">
    <el-form v-loading="loading" element-loading-text="正在导入中..." label-width="9.5em" class="demo-ruleForm">
      <el-form-item label="数据表模板：" class="in-input-row">
        <p>
          <a :href="src" class="temp-download">数据表结构模板.xls</a><span class="des">(点击下载)请下载模板并修改后导入</span>
        </p>
      </el-form-item>
      <el-form-item class="in-input-row" label="选择要导入的文件：">
        <el-upload
          ref="upload"
          :limit="1"
          :on-exceed="handleExceed"
          :file-list="fileList"
          :before-upload="beforeUpload"
          :auto-upload="false"
          action
          accept=".xls,.xlsx"
          class="upload-demo"
          multiple
        >
          <el-button icon="upload-icon">导入文件</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "loadResourceDialog",

  props: {
    query: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      fileList: [] //导入文件数组
    }
  },

  computed: {
    src() {
      return `${window.location.origin}/uirb/standards/${this.query.standardid}/resources/template`
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
     * 导入操作
     */
    beforeUpload (file) {
      this.loading = true
      let formData = new FormData()
      formData.append("file", file) //传文件

      let url = {
        standardId: this.query.standardid
      }
      this.$api.categoryExport(url, formData).then(
        data => {
          this.$trsModalSuccess("导入数据表成功！")
          this.$close()
        }, err => {
          this.loading = false
        }
      )
    },

    /**
     * 确认提交
     */
    confirm () {
      if (this.$refs.upload.uploadFiles.length === 0) {
        this.$trsModalError('请先选择文件！')
      } else {
        this.$refs.upload.submit()
      }
    }
  }
};
</script>
