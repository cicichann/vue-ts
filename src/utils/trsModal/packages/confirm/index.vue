/*
 * @Author: chen.qiufan
 * @Date: 2018-11-22 14:41:24
 * @Last Modified by: chen.qiufan
 * @Last Modified time: 2018-12-07 18:40:22
 */

<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" class="danger-dialog" @update:visible="confirm">
    <div :class="{'modal-text-danger': danger}">
      <i v-if="danger" class="modal-warning-icon fl" style="margin-right: 10px"/>
      <slot>
        <span class="danger-content" v-html="content">
        </span>
      </slot>
    </div>
    <span slot="footer">
      <el-button :type="danger ? 'danger' : 'primary'" @click="confirm(true, data)">确认</el-button>
      <el-button @click="confirm(false)">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import mixins from '../mixins'
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class TrsModalConfirm extends Vue {

  mixins = [mixins]

  props = {
    content: {
      type: String,
      default: ''
    },
    danger: {
      type: Boolean,
      default: false
    }
  }

  data () {
    return {
      data: ''
    }
  }

  methods = {
    confirm (state) {
      this.visible = false
      if (state) {
        this.callback('confirm')
      } else {
        this.callback('cancel')
      }
    }
  }
}
</script>
