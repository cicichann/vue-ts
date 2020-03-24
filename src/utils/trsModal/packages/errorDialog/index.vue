/*
 * @Author: chen.xi
 * @Date: 2018-12-18
 * @Last Modified by: chen.xi
 * @Last Modified time: 2018-12-18
 */

<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" class="error-msg-modal" @update:visible="confirm">
    <div :class="{'modal-text-danger': true}">
      <i class="modal-warning-icon" style="margin-right: 10px"/>
      <span>{{ msg }}</span>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import mixins from '../mixins'
import { Vue, Component } from "vue-property-decorator"

@Component
export default class TrsDialogError extends Vue  {

  mixins = [mixins]

  msg = [] // 错误提示信息

  confirm () {
    this.visible = false
  }
}
</script>