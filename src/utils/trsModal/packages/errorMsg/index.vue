/*
 * @Author: cheng.jing
 * @Date: 2018-12-14
 * @Last Modified by: cheng.jing
 * @Last Modified time: 2018-12-14
 */

<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" class="error-msg-modal" @update:visible="confirm">
    <div :class="{'modal-text-danger': true}">
      <i class="modal-warning-icon" style="margin-right: 10px"/>
      <span class="danger-content">共有 {{ msg.length + (type || '条数据') + (operate || '操作') }}失败</span>
    </div>

    <el-table :data="showItems">
      <el-table-column width="100" label="序号" align="center">
        <template slot-scope="scope">
          {{ scope.$index + 5 * (currPage - 1) + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="msg"/>
    </el-table>

    <com-pagination :pagination="{currPage: currPage, itemCount: msg.length, pageSize: 5}" :right="false" @callback="changePage">
    </com-pagination>
  </el-dialog>
</template>

<script lang="ts">
import mixins from '../mixins'
import comPagination from '@/views/common/pagination/index.vue'
import { Vue, Component, Watch } from "vue-property-decorator"

@Component
export default class TrsModalError extends Vue {
  components = { comPagination }
  mixins = [mixins]

  msg = [] // 返回数据
  type = '' // 类型，比如'个资源'，'条数据'
  operate = '' // 操作类型，比如'删除', '导入'
  showItems = []
  visible
  currPage

  @Watch('msg')
  onMsgChanged(newValue, oldValue) {
    if (oldValue.length === 0) {
      // 只显示错误信息
      this.msg = newValue.filter((item) => {
        return item.type === 2
      })
      this.showItems = this.msg.slice(0, 5)
    }
  }

  confirm() {
    this.visible = false
  }

  /**
   * 页数切换
   */
  changePage(page) {
    this.currPage = page.currPage
    this.showItems = this.msg.slice((page.currPage - 1) * 5, (page.currPage - 1) * 5 + 5)
  }
}
</script>

<style lang="scss">
.error-msg-modal .el-dialog {
  width: 560px;
}
.error-msg-modal .el-dialog__body {
  margin-top: 20px;
  margin-bottom: 70px;
  span {
    font-size: 14px;
  }
}
.error-msg-modal .el-table {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>

