<template>
  <!-- 新建、编辑应用弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" custom-class="edit-app">
    <el-form v-loading="loading" ref="form" :model="appMsg" :rules="rules" element-loading-text="数据加载中..." label-width="110px" label-suffix="：" class="in-dialog pwd-input">
      <el-form-item label="应用名称" prop="appName" class="in-input-row">
        <el-input v-model.trim="appMsg.appName" type="text" placeholder="请输入应用名称"></el-input>
      </el-form-item>
      <el-form-item label="厂商-产品" prop="factoryName" class="in-input-row">
        <el-select v-model="appMsg.factoryName" :disabled="!!app.appId" class="select-item" placeholder="请选择厂商-产品" @change="selectFactory()">
          <el-option v-for="(item, index) in factories" :key="index" :label="item.factoryName" :value="item.factoryName"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="对接方式" prop="adapterName" class="in-input-row">
        <el-select v-model="appMsg.adapterName" :disabled="!!app.appId" class="select-item" placeholder="请选择对接方式" @change="selectAdapter()">
          <el-option v-for="adapter in adapters" :key="adapter.id" :label="adapter.adapterName" :value="adapter.adapterName" />
        </el-select>
      </el-form-item>
      <template v-if="appMsg.adapterType !== 'crawler'">
        <el-form-item :label="(appMsg.adapterType === 'db' ? '连接' : '应用') + '地址'" prop="path" class="in-input-row">
          <el-input v-model="appMsg.path" :placeholder="'请输入' + (appMsg.adapterType === 'db' ? '连接' : '应用') + '地址'" type="text"></el-input>
        </el-form-item>
      </template>
      <template v-if="appMsg.adapterType === 'crawler'">
        <el-form-item label="网站地址" prop="path" class="in-input-row">
          <el-input v-model="appMsg.path" type="text" placeholder="请输入网站地址"></el-input>
        </el-form-item>
        <el-form-item label="网站名称" prop="webName" class="in-input-row">
          <el-input v-model="appMsg.webName" placeholder="请输入网站名称"/>
        </el-form-item>
      </template>
      <template v-if="appMsg.adapterType === 'http' || appMsg.adapterType === 'db' || appMsg.adapterType === 'consumer'">
        <el-form-item label="用户名" prop="userName" class="in-input-row">
          <el-input v-model="appMsg.userName" autocomplete="off" type="text" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="passWord" class="in-input-row">
          <el-input v-model="appMsg.passWord" :type="inputType" autocomplete="new-password" placeholder="请输入密码"></el-input>
          <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
        </el-form-item>
      </template>
      <el-form-item v-if="appMsg.factoryId === 'trs' && appMsg.adapterType === 'http'" label="个性分类参数" class="in-input-row">
        <el-input v-model="appMsg.extraParams" :rows="3" :placeholder="placeholderMsg" type="textarea"></el-input>
        <el-tooltip effect="dark" popper-class="type-tooltip" placement="top-end">
          <div slot="content">支持参数：<br/>includeSiteIds（信息资源库导航可见站点）<br />excludeSiteIds（信息资源库导航不可见站点）<br />参数与站点ID用等号相连<br />如：includeSiteIds=12,14,28</div>
          <i class="tip-icon"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item v-if="appMsg.factoryId === 'trs-uirb'" label="实时接入数据" class="in-input-row">
        <el-switch v-model="isAccessSwitchOn" active-color="#13ce66" inactive-color="#ccc"></el-switch>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>
<script>
import { Base64 } from 'js-base64'
import qs from 'qs'
export default {
  name: 'addAuthDialog',
  props: {
    title: {
      type: String,
      required: true
    },
    app: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    return {
      appMsg: {},
      factories: [], // 厂商-产品
      adapters: [], // 对接方式
      rules: {
        appName: [
          {required: true, trigger: ['change', 'blur'], message:'请输入应用名称'},
          {max: 20, trigger: 'blur', message:'最大长度不能超过20个字符'},
          {trigger: 'blur', validator: this.isAppNameExist}
        ],
        factoryName: [{required: true, trigger: 'blur', message: '请选择厂商-产品'}],
        adapterName: [{required: true, trigger: 'blur', message: '请选择对接方式'}],
        path: [
          {required: true, trigger: ['change', 'blur'], validator: this.checkPath},
          {trigger: 'blur', validator: this.checkAvailability}
        ],
        webName: [{required: true, trigger: 'blur', message: '请输入网站名称'}],
        userName: [{required: true, trigger: 'blur', message: '请输入用户名'}],
        passWord: [{required: true, trigger: 'blur', message: '请输入密码'}]
      },
      isPwdShow: true,
      loading: false,
      // placeholderMsg: '请输入站点、栏目或视图相关参数\n如：includeSiteIds=1&includeChannelIds=11,12&includeViewIds=111,112',
      placeholderMsg: '请输入站点相关参数\n如：includeSiteIds=12,14,28',
      isAccessSwitchOn: false
    }
  },

  computed: {
    inputType () {
      return this.isPwdShow ? 'password' : 'text'
    }
  },

  watch: {
    'appMsg.factoryName' (newVal, oldVal) {
      if (oldVal && newVal !== oldVal) {
        this.$set(this.appMsg, 'adapterName', '')
        this.$set(this.appMsg, 'adapterType', '')
      }
    }
  },

  created () {
    if (this.app.appId) {
      this.queryAppMsg()
    } else this.queryFactories()
  },

  mounted() {
    document.onkeydown = function(e) {
      var key = window.event.keyCode

      return (key !== 13)
    }
  },

  methods: {
    queryAppMsg () {
      this.loading = true
      this.$api.queryAppMsg({id: this.app.appId}).then(data => {
        this.appMsg = data
        this.isAccessSwitchOn = this.appMsg.isAccess === 1 ? true : false

        this.queryFactories()
        this.loading = false
      })
    },

    /**
     * 请求厂商-产品列表
     */
    queryFactories () {
      this.$api.queryFactories().then(data => {
        this.factories = data
        if (this.appMsg.factoryName) {
          this.appMsg.factoryId = this.factories.find(factory => factory.factoryName === this.appMsg.factoryName).id
        }
      })
    },

    /**
     * 请求对接方式列表
     */
    queryAdapters () {
      this.$api.queryAdapters({factoryId: this.appMsg.factoryId}).then(data => {
        this.adapters = data
        if (this.appMsg.adapterName) {
          this.appMsg.adapterId = this.adapters.find(adapter => adapter.adapterName === this.appMsg.adapterName).id
        }
      })
    },

    /**
     * 选择厂商-产品
     */
    selectFactory(name) {
      this.appMsg.factoryId = this.factories.find(factory => { return factory.factoryName === this.appMsg.factoryName}).id
      if (this.appMsg.adapterId) this.appMsg.adapterId = ''
      this.queryAdapters()
    },

    /**
     * 选择对接方式
     */
    selectAdapter(name) {
      let selectedAdapter = this.adapters.find(adapter => { return adapter.adapterName === this.appMsg.adapterName})
      this.appMsg.adapterId = selectedAdapter.id
      this.appMsg.adapterType = selectedAdapter.appAdapterType
    },

    /**
     * 用户名、密码与应用地址做校验
     */
    checkUserAccess() {
      let url = `apps/products/validation`
      let params = this.$pick(this.appMsg, ['userName', 'passWord', 'path', 'adapterId'])
      params.passWord = Base64.encode(params.passWord)
      return new Promise((resolve) => {
        if (this.appMsg.adapterType !== 'db' && this.appMsg.adapterType !== 'http' && this.appMsg.adapterType !== 'consumer') {
          return resolve()
        }
        return this.$ajax.post(url, qs.stringify(params)).then(data => {
          if (data) {
            resolve()
          } else {
            this.$trsModalError('与应用地址校验失败！')
          }
        })
      })
    },

    confirm () {
      this.loading = true
      this.$refs.form.validate()
        .then(() => {
          return this.checkUserAccess()
        })
        .then(() => {
          if (this.app.appId) {
            this.editApp()
          } else {
            this.addApp()
          }
        })
        .catch(() => {
          this.loading = false
        })
    },

    editApp () {
      let params = this.$pick(this.appMsg, ['userName', 'passWord', 'path', 'appName', 'extraParams'])
      params.passWord = Base64.encode(params.passWord)
      this.loading = true

      if (this.appMsg.factoryId === 'trs-uirb') {
        params.isAccess = this.isAccessSwitchOn ? 1 : 0
      }

      this.$api.editApp({ id: this.app.appId }, params).then(data => {
        this.$trsModalSuccess('编辑应用成功!')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    addApp () {
      let params = this.appMsg
      params.passWord = Base64.encode(params.passWord)
      this.loading = true

      if (this.appMsg.factoryId === 'trs-uirb') {
        params.isAccess = this.isAccessSwitchOn ? 1 : 0
      }

      this.$api.addApp(params).then(data => {
        this.$trsModalSuccess('新建应用成功!')
        this.$close()
      }, () => {
        this.loading = false
      })
    },

    /**
     * 应用地址格式校验
     */
    checkPath(rule, value, callback) {
      if(!value) {
        let tip
        switch(this.appMsg.adapterType) {
          case 'crawler':
            tip = '网站'
            break
          case 'db':
            tip = '连接'
            break
          default:
            tip = '应用'
            break
        }
        return callback(new Error(`请输入${tip}地址`))
      } else {
        let type = this.appMsg.adapterType
        if(type === 'db' && !/^jdbc:/i.test(value)) {
          return callback(new Error('请输入正确的jdbcUrl格式（以jdbc:开头）'))
        } else if(type !== 'db' && !/^https?:\/\//i.test(value)) {
          return callback(new Error('请输入正确的url格式（以http://或者https://开头）'))
        }
        return callback()
      }
    },

    /**
     * 地址可用性校验
     */
    checkAvailability(rule, value, callback) {
      if(this.appMsg.adapterType === 'crawler') {
        let params = this.$pick(this.appMsg, ['path', 'adapterId'])
        this.$api.checkAvailability(params).then(data => {
          if(!data) {
            return callback(new Error('应用地址不可用'))
          }
          return callback()
        })
      }
      return callback()
    },

    /**
     * 应用重名校验
     */
    isAppNameExist(rule, value, callback) {
      return this.$api.verifyAppName({ appName: value, id: this.app.appId || 0 }).then(data => {
        if(data.isExists){
          return callback(new Error('应用名称已存在'))
        }
        return callback()
      })
    }
  }
}
</script>
<style lang="scss">
.edit-app {
  .el-textarea {
    width: 320px;
  }
  textarea {
    resize: none;
    font-family: "Microsoft Yahei", "Arial", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif;
  }
}

.type-tooltip {
  max-width: 320px;
}
</style>
