<template>
  <!-- 导入分类弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="导入分类" custom-class="upload-dialog load-category">
    <div v-loading="loading" element-loading-text="正在导入中...">
      <el-form label-width="10em" class="demo-ruleForm">
        <el-form-item label="导入分类到：" class="in-input-row">
          <span class="blue">{{ query.category_name ? query.category_name : '全部分类' }}</span>
        </el-form-item>
        <el-form-item label="分类模板：" class="in-input-row export-item">
          <p><a :href="src" class="temp-download">分类模板.txt</a> <span class="des">(点击下载)</span><span class="des"> 请下载模板并修改后导入</span></p>
        </el-form-item>
        <el-form-item class="in-input-row" label="选择要导入的文件：">
          <el-upload
            ref="upload"
            :limit="1"
            :on-exceed="handleExceed"
            :file-list="fileList"
            :auto-upload="false"
            :before-upload="beforeUpload"
            action=""
            accept=".txt,.xls,.xlsx"
            class="upload-demo"
            multiple>
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
  name: 'loadCategoryDialog',

  props: {
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      fileList: [] //导入文件数组
    }
  },

  computed: {
    src() {
      return `${window.location.origin}/uirb/standards/${this.query.standardid}/categories/template`
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
     * @param file
     */
    beforeUpload(file) {
      this.loading = true
      let formData = new FormData()
      formData.append('file',file) //传文件
      formData.append('parentCategoryId',this.query.categoryid || 0) //传其他参数

      this.$api.classficatinExport({standardId: this.query.standardid}, formData).then(data => {
        this.$trsModalSuccess('导入分类成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    confirm () {
      if (this.$refs.upload.uploadFiles.length === 0) {
        this.$trsModalError('请先选择文件！')
      } else {
        this.$refs.upload.submit()
      }
    }
  }
}
</script>
