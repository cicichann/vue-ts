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
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class TrsDialogError extends Vue  {

  mixins = [mixins]

  data () {
    return {
      msg: [] // 错误提示信息
    }
  }

  methods: {
    confirm () {
      this.visible = false
    }
  }
}
</script>