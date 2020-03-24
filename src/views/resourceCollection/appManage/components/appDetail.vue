<template>
  <!-- 查看应用详情弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="应用详情" custom-class="app-detail">
    <el-form v-loading="loading" label-width="100px" element-loading-text="数据加载中..." class="pwd-input">
      <el-form-item label="应用名称 :"><p>{{ appMsg.appName }}</p></el-form-item>
      <el-form-item label="厂商-产品 :"><p>{{ appMsg.factoryName }}</p></el-form-item>
      <el-form-item label="接入方式 :"><p>{{ appMsg.adapterName }}</p></el-form-item>
      <el-form-item label="APPID :"><p>{{ appMsg.id }}</p></el-form-item>
      <el-form-item label="APIKey :"><p>{{ appMsg.apiKey }}</p></el-form-item>
      <el-form-item label="SecretKey :">
        <el-input v-model="appMsg.apiSecret" :type="inputType" readonly></el-input>
        <i :class="{'pwd-view-icon': !isPwdShow}" class="pwd-view" @click="isPwdShow = !isPwdShow"></i>
      </el-form-item>
      <el-form-item label="创建人 :"><p>{{ appMsg.createUser }}</p></el-form-item>
      <el-form-item label="创建时间 :"><p>{{ appMsg.createTime | formatTime }}</p></el-form-item>
      <el-form-item label="数据源 :">
        <p v-for="(dataSource, index) in appMsg.datasources" :key="index">
          <span>{{ dataSource.name }}</span>
          <span style="color: #c6cacd">{{ dataSource.type }}</span>
        </p>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import fecha from 'fecha'

export default {
  name: 'addAuthDialog',

  filters: {
    formatTime(time) {
      if (!time) return ''
      return fecha.format(+time, 'YYYY-MM-DD HH:mm:ss')
    }
  },

  props: {
    appId: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      appMsg: {},
      isPwdShow: true,
      loading: false
    }
  },

  computed: {
    inputType() {
      return this.isPwdShow ? 'password' : 'text'
    }
  },

  created () {
    this.loading = true
    this.$api.queryAppMsg({id: this.appId}).then(data => {
      this.appMsg = data
      this.appMsg.datasources = this.appMsg.datasources.map(datasource => {
        return {
          name: datasource.replace(/\([^)]+\)$/, ''),
          type: datasource.match(/\([^)]+\)$/) ? datasource.match(/\([^)]+\)$/)[0] : ''
        }
      })
      this.loading = false
    })
  }
}
</script>

<style lang="scss">
.app-detail {
  .el-form-item {
    margin: 0;
  }

  .el-dialog__body {
    max-height: 500px;
    margin-bottom: 25px;
  }

  p {
    margin-left: 10px;
  }

  input {
    border: 0;
  }

  .pwd-view {
    right: 40px;
  }
}
</style>
