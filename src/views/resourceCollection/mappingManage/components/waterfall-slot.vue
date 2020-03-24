<template>
  <div v-show="isShow" class="vue-waterfall-slot">
    <slot></slot>
  </div>
</template>

<style>
.vue-waterfall-slot {
  position: absolute;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<script>
/* eslint-disable */
export default {
  props: {
    width: {
      required: true,
      validator: (val) => val >= 0
    },
    height: {
      required: true,
      validator: (val) => val >= 0
    },
    order: {
      default: 0
    },
    moveClass: {
      default: ''
    }
  },
  data: () => ({
    isShow: false
  }),
  created () {
    this.rect = {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
    this.$watch(() => (
      this.width,
      this.height
    ), this.notify)
  },
  mounted () {
    this.$parent.$once('reflowed', () => {
      this.isShow = true
    })
    this.notify()
  },
  destroyed () {
    this.notify()
  },
  methods: {
    notify () {
      this.$parent.$emit('reflow', this)
    },
    getMeta () {
      return {
        vm: this,
        node: this.$el,
        order: this.order,
        width: this.width,
        height: this.height,
        moveClass: this.moveClass
      }
    }
  },
}

</script>
