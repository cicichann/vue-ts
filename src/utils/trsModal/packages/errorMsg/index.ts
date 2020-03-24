import Vue from 'vue'
import msgVue from './index.vue'

const MsgConstructor = Vue.extend(msgVue)

const errorMsg = function(data) {
  let instance = new MsgConstructor({
    el: document.createElement('div'),
  })

  instance.title = data.title
  instance.type = data.type
  instance.operate = data.operate
  instance.msg = data.msg

  document.body.appendChild(instance.$el)
  Vue.nextTick(() => {
    instance.visible = true
  })
}

export default errorMsg
