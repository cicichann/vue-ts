/**
 * 弹窗打开/关闭封装
 * created by huang.jusheng on 2019/2/11
 */
import Vue from 'vue'

const dialogMixin = {
  data() {
    return {
      resolve: true
    }
  },

  computed: {
    visible: {
      get() {
        return Boolean(this.resolve)
      },

      set(val) {
        if (!val) this.$dismiss()
      }
    }
  },

  methods: {
    open() {
      return new Promise(r => this.resolve = r)
    },
    $close(value) {
      if (this.resolve) {
        this.resolve(value || true)
        this.resolve = null
      }
    },
    $dismiss() {
      if (this.resolve) {
        this.resolve(false)
        this.resolve = null
      }
    }
  }
}

const dialog = function (component, opts) {
  component = Object.assign({}, component)
  component.mixins = [dialogMixin]

  let Constructor = Vue.extend(component)
  let vm = new Constructor({propsData: opts})
  vm.$nextTick(() => {
    vm.$mount(document.body.appendChild(document.createElement('div')))
  })

  return new Promise((resolve, reject) => {
    vm.open().then((val) => {
      if (navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1) {
        vm.$destroy()
        document.body.removeChild(vm.$el)

      } else {
        // destroy after dialog faded out
        setTimeout(() => {
          vm.$destroy()
          document.body.removeChild(vm.$el)
        }, 500)
      }

      val && resolve(val)
    })
  })
}

export default dialog
