import Vue from 'vue'
import confirmVue from './index.vue'

const ConfirmConstructor = Vue.extend(confirmVue)
let instance
let currentConfirm

const initInstance = () => {
  instance = new ConfirmConstructor({
    el: document.createElement('div')
  })
}

const defaultCallback = function(action) {
  if (action === 'confirm') {
    currentConfirm.resolve(action)
  } else {
    if(currentConfirm.options.isRejectable) {
      currentConfirm.reject(action)
    }
  }
}

const showNextConfirm = function() {
  if (!instance) {
    initInstance()
  }
  let options = currentConfirm.options
  for (let prop in options) {
    instance[prop] = options[prop]
  }
  instance.callback = defaultCallback
  document.body.appendChild(instance.$el)
  Vue.nextTick(() => {
    instance.visible = true
  })
}

const confirm = function(options) {
  return new Promise((resolve, reject) => {
    currentConfirm = {
      options: options,
      resolve: resolve,
      reject: reject
    }
    showNextConfirm()
  })
}

export default confirm
