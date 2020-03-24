<template>
  <div class="resource-model">

    <com-header :navs="navs" :reload="reload"></com-header>
    <!-- <router-view v-if="hasStandard"></router-view> -->
    <router-view v-if="hasStandard && isRouterAlive"></router-view>

    <!-- 暂无标准 -->
    <div v-else class="main-container no-standard">
      <div class="model-bg"> <img :src="noStandImg" alt=""> </div>
      <div class="no-stand-title">系统当前暂无标准</div>
      <div class="no-stand-btn">
        <el-button v-access="'model'" size="large" type="success" @click="newStandard">新增标准</el-button>
        <!-- <el-button size="large" type="success" @click="loadStandard">导入标准</el-button> -->
      </div>

      <!-- 新增标准弹窗 -->
      <trs-modal-custom :visible.sync="showAddDialog" title="新增标准" @beforeClose="addStandard">
        <div class="standard-rename" >
          <el-form ref="addRuleForm" :model="addRuleForm" :rules="addStandRule" label-width="100px" class="demo-ruleForm">
            <el-form-item prop="newStandardName" label="标准名称：">
              <el-input v-model="addRuleForm.newStandardName" placeholder="请输入标准名称"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </trs-modal-custom>

    </div>
  </div>
</template>

<script>
import comHeader from '@/views/common/header/index'
import noStandImg from 'img/model-bg.png'
import eventBus from '@/utils/eventBus'
/**
 * 资源模型
 */
export default {
  name: 'resourceModel',

  components: {
    comHeader
  },

  data() {
    return {
      navs: [
        {
          path: `/model/standard`,
          title: '资源标准',
          rightKey: 'model.all'
        },
        {
          path: `/model/category`,
          title: '资源目录',
          rightKey: 'model.all'
        },
        {
          path: `/model/structure`,
          title: '数据结构',
          rightKey: 'model.all'
        },
        {
          path: `/model/tag`,
          title: '标签管理',
          rightKey: 'model.all'
        }
      ],
      addRuleForm: {
        newStandardName: ''
      },
      importRuleForm: {
        importStandardName: ''
      },
      params: {},
      standardList: [], // 资源标准数组
      hasStandard: true, // 是否有标准
      newIsChecked: false, // 新增标准弹窗表单是否校验通过
      loadIsChecked: false, // 导入标准弹窗表单是否校验通过
      fileList: [], // 导入文档列表
      showAddDialog: false, // 新增标准弹窗是否显示
      showImportDialog: false, // 导入标准弹窗是否显示
      addStandRule: {
        newStandardName: [
          { required: true, message: '请输入标准名称', trigger: 'blur' },
          { min: 1, max: 20, message: '最大长度不能超过20个字符', trigger: 'blur' }
        ]
      },
      importStandardRule: {
        importStandardName: [
          { required: true, message: '请输入标准名称', trigger: 'blur' }
        ]
      },
      noStandImg: noStandImg,
      src: `${window.location.origin}/uirb/standards/template`,
      isRouterAlive: true
    }
  },

  mounted() {
    this.getEvent()
    this.queryStandardList()
  },

  methods: {
    /**
     * 监听是否所有标准都被删除
     */
    getEvent() {
      eventBus.$on('requstParents', () => {
        this.queryStandardList()
      })
    },

    /**
    * 表单验证
    */
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if(formName === 'addRuleForm') {
          this.newIsChecked = valid
        } else {
          this.loadIsChecked = valid
        }
      })
    },

    /**
     * 重置表单
     */
    resetForm(formName) {
      this.$refs[formName].resetFields()
    },

    /**
     * 请求标准数据
     */
    queryStandardList() {
      this.$api.queryAuthStandardList().then(data => {
        this.standardList = data
        if(this.standardList.length === 0) {
          this.hasStandard = false
        } else {
          this.hasStandard = true
        }
      })
    },

    /**
     * 打开新增标准弹窗
     */
    newStandard() {
      this.addRuleForm.newStandardName = ''
      this.showAddDialog = true
    },

    /**
     * 新增标准弹窗确认/取消交互
     */
    addStandard(state, done) {
      if (state) {
        this.submitForm('addRuleForm')
        if (this.newIsChecked) {
          let params = {
            name: this.addRuleForm.newStandardName
          }
          this.$api.addNewStandard(params).then(data => {
            this.showAddDialog = false
            this.$trsModalSuccess('新增标准成功！')
            this.queryStandardList()
          })
        }
      } else {
        this.resetForm('addRuleForm')
        this.showAddDialog = false
      }
    },
    /**
     * 导入标准弹窗确认/取消交互
     */
    importStandard(state, done) {
      if (state) {
        this.submitForm('importRuleForm')
        if (this.loadIsChecked) {
          this.loadStand = false
          this.$refs.upload.submit()
        } else {
          this.loadStand = true
        }
      } else {
        this.resetForm('importRuleForm')
        this.loadStand = false
      }
    },


    reload () {
      this.isRouterAlive = false
      this.$nextTick(() => (this.isRouterAlive = true))
    }
  }
}
</script>
