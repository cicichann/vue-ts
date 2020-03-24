<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="移动到">
    <div v-loading="loading" element-loading-text="数据加载中..." class="move-resource-wrapper">
      <ul v-if="groupList.length > 0">
        <li v-for="item in groupList" :key="item.id" :class="{'active-item': item.id == selectGroup.id, 'disable-item': item.id == query.groupid}"
            @click="handleSelect(item)">
          {{ item.groupName }}
        </li>
      </ul>
    </div>

    <span slot="footer">
      <el-button :disabled="!selectGroup.id || loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'moveResourceDialog',

  props: {
    selectedList: {
      type: Array,
      required: true
    },
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      groupList: [], // 库列表
      selectGroup: {} // 选中库
    }
  },

  mounted () {
    this.queryList()
  },

  methods: {
    /**
     * 请求库列表
     */
    queryList () {
      this.loading = true
      let url = {
        standardId: this.query.standardid
      }
      this.$api.queryStructureGroupList(url).then(data => {
        this.groupList = data
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 选择库
     */
    handleSelect (item) {
      if (item.id !== parseInt(this.query.groupid)) this.selectGroup = item
    },

    /**
     * 确认提交
     */
    confirm () {
      this.loading = true
      let url = {
        standardId: this.query.standardid
      }
      let params = {
        targetGroupId: this.selectGroup.id,
        resourceIds: this.selectedList.join(",")
      }

      this.$api.structureListMove(url, params).then(data => {
        this.$trsModalSuccess("移动数据表成功！")
        this.$close(this.selectGroup)
      }, () => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss">
.move-resource-wrapper {
  min-height: 34px;

  ul {
    border-radius: 3px;
    border: 1px solid #E2EBF1;
  }

  li {
    cursor: pointer;
    padding: 0 20px;
    height: 34px;
    line-height: 34px;

    &:nth-of-type(odd) {
      background: #F0F5FA;
    }

    &.active-item {
      background: #4BD083;
      color: #fff;
    }

    &.disable-item {
      color: #C5C8CD;
    }
  }
}
</style>
