import Vue from 'vue'
import dialogVue from './index.vue'

const DialogConstructor = Vue.extend(dialogVue)

const errorDialog = function(data) {
  let instance = new DialogConstructor({
    el: document.createElement('div')
  })

  instance.title = data.title
  instance.msg = data.msg

  document.body.appendChild(instance.$el)
  Vue.nextTick(() => {
    instance.visible = true
  })
}

export default errorDialog
