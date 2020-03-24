<template>
  <!-- 查看权限配置弹窗 -->
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="权限模板预览" custom-class="authtemp-dialog">
    <!-- 一级 -->
    <ul v-loading="loading" element-loading-text="数据加载中..." class="first-auth tempauth-list in-input-row">
      <li v-for="item in data.authList" :key="item.id">
        <el-checkbox v-model="item.hasRight" :label="item.id" :disabled="true" @change="chooseItem(item.id)"></el-checkbox>
        <span>{{ item.dispName }}</span>
        <!-- 二级 -->
        <ul v-if="item.children&&item.children.length>0" class="second-auth">
          <li v-for="val in item.children" :key="val.id">
            <el-checkbox v-model="val.hasRight" :label="val.id" :disabled="true" @change="chooseItem(val.id)"></el-checkbox>
            <span>{{ val.dispName }}</span>
            <!-- 三级 -->
            <ul v-if="val.children&&val.children.length>0" class="third-auth clearfix">
              <li v-for="v in val.children" :key="v.id" class="fl">
                <el-checkbox v-model="v.hasRight" :label="v.id" :disabled="true" @change="chooseItem(v.id)"></el-checkbox>
                <span>{{ v.dispName }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </el-dialog>
</template>

<script>
export default {
  props: {
    selectedId: {
      type: Number | String,
      required: true
    }
  },

  data () {
    return {
      data: {
        authList: []
      },
      loading: false
    }
  },

  mounted () {
    this.queryTemplateRightList(this.selectedId)
  },

  methods: {
    /**
     * 查询模板详情
     */
    queryTemplateRightList (id) {
      this.loading = true
      let params = {
        rightTemplateId: id
      }
      this.$api.queryRightTemplate(params).then(data => {
        this.data.authList = data
        this.loading = false
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>
