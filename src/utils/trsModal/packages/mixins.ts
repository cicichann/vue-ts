/*
 * @Author: chen.qiufan
 * @Date: 2018-11-26 15:30:13
 * @Last Modified by: zhuang.xiqi
 * @Last Modified time: 2018-11-29 10:09:33
 */

// 弹窗共有属性和方法使用混入方法混入合个弹窗

export default {
  data() {
    return {
      flag: true
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  methods: {
    confirm(newVal, data) {
      if(this.flag) {
        this.flag = false
        this.$emit('beforeClose', newVal, this.hide ,data)
        setTimeout(() => {
          this.flag = true
        },2000)
      }
    },
    cancel(newVal) {
      this.$emit('beforeClose', newVal, this.hide)
    },
    hide(cancel) {
      if (cancel !== false) {
        this.$emit('update:visible', false)
      }
    }
  }
}
