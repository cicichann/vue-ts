<template>
  <div
    :class="[{ 'is-multiple': $parent.multiple }, popperClass]"
    :style="{ minWidth: minWidth }"
    class="el-select-dropdown el-popper uirb-popover">
    <slot></slot>
  </div>
</template>

<script type="text/babel">
  import Popper from '@/utils/popover/vue-popper';

  export default {
    name: 'ElSelectDropdown',

    componentName: 'ElSelectDropdown',

    mixins: [Popper],

    props: {
      placement: {
        type: String,
        default: 'bottom-start'
      },

      boundariesPadding: {
        type: Number,
        default: 0
      },

      popperOptions: {
        type: Object,
        default() {
          return {
            gpuAcceleration: false
          };
        }
      },

      visibleArrow: {
        type: Boolean,
        default: true
      },

      appendToBody: {
        type: Boolean,
        default: true
      },

      popperClass: {
        type: String,
        default: ''
      }
    },

    data() {
      return {
        minWidth: '320px'
      };
    },

    mounted() {
      // 根据ref="reference"的元素来定位
      this.referenceElm = this.$parent.$refs.reference;
      this.$parent.popperElm = this.popperElm = this.$el;
      // this.$on('updatePopper', () => {
        this.updatePopper();
      // });
      this.$on('destroyPopper', this.destroyPopper);
    }
  };
</script>

<style lang="scss">
.uirb-popover {
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999 !important;
}
</style>

