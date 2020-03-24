<template>
  <!-- 下拉类型按钮组件 -->
  <div v-clickoutside="handleClose" class="uirb-dropdown-btn">
    <button :class="{'active': showDropdown}" :disabled="disabled" class="edit-btn other-btn" @click="toggleDropdown">
      <span>{{ label }}</span>
      <i :class="{'is-reverse': showDropdown}" class="el-select__caret el-input__icon el-icon-arrow-down"/>
    </button>

    <transition name="el-zoom-in-top">
      <div v-if="showDropdown" class="uirb-dropdown-content el-select-dropdown">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside';

export default {
  name: 'trsDropdownBtn',

  directives: { Clickoutside },

  props: {
    label: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      showDropdown: false
    }
  },

  methods: {
    toggleDropdown () {
      if (!this.disabled) {
        this.showDropdown = !this.showDropdown
      }
    },

    handleClose () {
      this.showDropdown = false
    }
  }
}
</script>