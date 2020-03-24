<template>
  <div class="auth-template clearfix">
    <div class="side-bar fl">
      <h4 class="title">权限模板（<span>{{ data.personList.length }}</span>）</h4>

      <el-input v-model="status.searchText" class="search-input" placeholder="请输入模板名称" @keyup.enter.native="queryPersonList">
        <i slot="suffix" class="input-icon" @click="queryPersonList"/>
      </el-input>

      <div class="nav-menu">
        <ul>
          <li v-for="(item, index) in data.personList" :key="index"
              :class="{'is-active': status.curPerson.templateName === item.templateName}"
              :title="item.templateName"
              class="nav-item">
            <span class="nav-item-content" @click="changeTemplate(item)">{{ item.templateName }}</span>
            <el-popover v-access="'sysconf.righttemplate.edit,sysconf.righttemplate.delete'" v-model="item.showPopover"
                        trigger="click" placement="bottom-end" popper-class="nav-more-popover clearfix">
              <ul>
                <li v-access="'sysconf.righttemplate.edit'" @click.stop="editTemplate(item)">编辑</li>
                <li v-access="'sysconf.righttemplate.delete'" @click.stop="deleteTemplate(item)">删除</li>
              </ul>
              <i slot="reference" :class="{'more-active': item.showPopover}" class="nav-more"></i>
            </el-popover>
          </li>
        </ul>
      </div>

      <div class="action-btns">
        <el-button v-access="'sysconf.righttemplate.add'" class="fl" size="large" type="success" @click="addTemplate">新增权限模板</el-button>
      </div>
    </div>

    <div class="template-right">
      <div v-loading="loading" class="template-options" element-loading-text="数据加载中...">
        <div class="template-head">
          <span class="module-title">操作权限</span>
          <el-button v-access="'sysconf.righttemplate.savekeys'" :disabled="!status.isRightChange" type="primary" @click.prevent="saveTemplate">保存</el-button>
        </div>
        <div class="template-list">
          <ul class="first-auth">
            <!-- 一级模块菜单权限位 -->
            <li v-for="(first, index) in data.rightList" :key="index">
              <el-checkbox v-model="first.hasRight" :disabled="!$checkRight('sysconf.righttemplate.savekeys')" @change="rightChange(first, 1)"></el-checkbox>
              <span style="font-weight: bold">{{ first.dispName }}</span>
              <ul v-if="first.children" class="second-auth">
                <!-- 二级子菜单权限位 -->
                <li v-for="(second, index) in first.children" :key="index">
                  <el-checkbox v-model="second.hasRight" :disabled="!$checkRight('sysconf.righttemplate.savekeys')" @change="rightChange(second, 2)"></el-checkbox>
                  <span>{{ second.dispName }}</span>
                  <ul v-if="second.children" class="third-auth clearfix">
                    <!-- 三级操作权限位 -->
                    <li v-for="(third, index) in second.children" :key="index" class="fl">
                      <el-checkbox v-model="third.hasRight" :disabled="!$checkRight('sysconf.righttemplate.savekeys')" @change="rightChange(third, 3)"></el-checkbox>
                      <span>{{ third.dispName }}</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <!-- 版本信息 -->
      <edition/>
    </div>
  </div>
</template>

<script>
import edition from '@/views/common/footer/footer.vue'
import addAuthDialog from './components/addAuth.vue'

export default {
  components: { edition },

  data () {
    return {
      loading: false,
      status: {
        curPerson: {},
        searchText: '',
        isRightChange: false
      },
      data: {
        personList: [],
        rightList: [],
        rightListJSON: ''
      },
      defaultProps: {
        children: 'children',
        label: 'dispName'
      },
    }
  },

  watch: {
    'data.rightList': {
      handler: function (newValue, oldVal) {
        if (JSON.stringify(newValue) !== this.data.rightListJSON) {
          this.status.isRightChange = true
        } else this.status.isRightChange = false
      },
      deep: true
    },
  },

  mounted () {
    this.queryPersonList()
  },

  beforeRouteLeave (to, from, next) {
    this.checkChange().then((data) => {
      if (data) next()
    })
  },

  methods: {
    /**
     * 请求权限模板列表
     */
    queryPersonList () {
      this.$api.queryAuthTemplate({searchText: this.status.searchText}).then((data) => {
        this.data.personList = data.data
        if (data.data.length > 0) {
          this.status.curPerson = this.data.personList[0]
          this.checkChange().then(() => {
            this.queryRightList()
          })
        }
      })
    },

    queryRightList () {
      this.loading = true
      this.$api.queryRightTemplate({rightTemplateId: this.status.curPerson.id}).then((data) => {
        this.data.rightList = data
        this.data.rightListJSON = JSON.stringify(data)
        this.loading = false
     })
    },

    /**
     * 切换当前权限模板角色
     */
    changeTemplate (val) {
      this.checkChange().then(data => {
        if (data) {
          this.status.curPerson = val
          this.queryRightList()
        }
      })
    },

    /**
     * 检查未保存
     */
    checkChange () {
      let _this = this
      return new Promise(function (resolve, reject) {
        if (_this.status.isRightChange && _this.$checkRight('sysconf.righttemplate.savekeys')) {
          _this.$trsModalConfirm({content: '是否保存当前权限模板修改？', title: '确认保存', danger: false, isRejectable: true}).then(confirm => {
            _this.saveTemplate()
            resolve(false)
          }, () => {
            resolve(true)
          })
        }
        else resolve(true)
      })
    },

    /**
     * 新增权限模板
     */
    addTemplate () {
      this.checkChange().then(() => {
        this.$dialog(addAuthDialog, {title: '新增权限模板'}).then(() => {
          this.queryPersonList()
        })
      })
    },

    /**
     * 编辑角色模板
     */
    editTemplate (item) {
      this.checkChange().then(() => {
        this.$dialog(addAuthDialog, {title: '编辑权限模板', template: item}).then(() => {
          this.queryPersonList()
        })
      })
    },

    /**
     * 删除角色模板
     */
    deleteTemplate (item) {
      this.$trsModalConfirm({
        content: '是否删除所选模板？',
        title: '删除权限模板',
        danger: true
      }).then(data => {
        this.$api.deleteAuth({id: item.id}).then((data) => {
          this.$trsModalSuccess('删除权限模板成功!')
          this.queryPersonList()
        })
      })
    },

    /**
     * 保存模板修改
     */
    saveTemplate () {
      if (!this.status.isRightChange) return
      this.loading = true
      this.$api.changeRightTemplate(this.status.curPerson.id, {keys: this.data.rightList}).then((data) => {
        this.$trsModalSuccess('修改权限模板成功!')
        this.queryRightList()
      })
    },

    /**
     * 权限位修改
     */
    rightChange (value, level) {
      if (value.children) {
        this.toggleChild(value)
      }
      if (level !== 1){
        this.toggleParents(value)
      }
    },

    /**
     * 选择父节点，子节点关联
     */
    toggleChild (items) {
      items.children.forEach(item => {
        item.hasRight = items.hasRight
        if (item.children) this.toggleChild(item)
      })
    },

    /**
     * 父子节点联动
     */
    toggleParents (value) {
      let parent = {}
      this.data.rightList.forEach(first => {
        if (first.name === value.name.split('.')[0]) {
          parent = first
        }
      })

      // 二级父节点
      if (!value.children) {
        parent.children.forEach(second => {
          if (second.name === value.type) {
            second.hasRight = this.checkAll(second)
          }
        })
      }
      // 一级父节点
      parent.hasRight = this.checkAll(parent)
    },

    /**
     * 检查当前节点的子节点是否全部选中
     */
    checkAll (value) {
      let result = true
      if (!value.children) return true
      value.children.forEach(item => {
        if (!item.hasRight|| (item.children && !this.checkAll(item))) {
          result = false
          return
        }
      })
      return result
    }
  }
}
</script>
