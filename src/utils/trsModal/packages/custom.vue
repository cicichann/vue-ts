/*
 * @Author: chen.qiufan
 * @Date: 2018-11-22 14:40:47
 * @Last Modified by: zhuang.xiqi
 * @Last Modified time: 2018-11-29 10:09:28
 */

/**
 * 使用示例
 * <trs-modal-custom title="标题" :visible.sync="visible" @beforeClose="beforeClose">自定义内容</trs-modal-custom>
 */

<template>
  <el-dialog :title="title" :visible="visible" :close-on-click-modal="false" :custom-class="'el-dialog--' + size" @update:visible="confirm">
    <!-- 自定义弹窗入口插槽 -->
    <slot/>
    <span slot="footer">
      <el-button :type="danger ? 'danger' : 'primary'" :disabled="disableConfirmBtn" @click="confirm(true)">确认</el-button>
      <el-button v-if="showCancelBtn" @click="cancel(false)">取消</el-button>
    </span>
  </el-dialog>
</template>
<script lang="ts">
import mixins from './mixins'
import { Vue, Component, Prop } from "vue-property-decorator"

@Component
export default class TrsModalCustom extends Vue {
  mixins= [mixins]

  @Prop({ default: true }) showCancelBtn: Boolean // 是否显示取消按钮
  @Prop({ default: false }) danger: Boolean
  @Prop({ default: 'medium' }) size: String // 弹窗尺寸，接收 medium/large
  @Prop({ default: false }) disableConfirmBtn: Boolean // 是否禁用确认按钮
}
</script>
