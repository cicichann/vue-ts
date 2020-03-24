<template>
  <!-- 尺寸拖拽容器组件 -->
  <div class="uirb-resizable-wrap">
    <div class="drag-handle handle-lm" @mousedown="handleModelDrag($event, 'lm')"></div>
    <div class="drag-handle handle-rm" @mousedown="handleModelDrag($event, 'rm')"></div>
    <div class="drag-handle handle-tm" @mousedown="handleModelDrag($event, 'tm')"></div>
    <div class="drag-handle handle-bm" @mousedown="handleModelDrag($event, 'bm')"></div>
    <div class="drag-handle handle-tl" @mousedown="handleModelDrag($event, 'tl')"></div>
    <div class="drag-handle handle-tr" @mousedown="handleModelDrag($event, 'tr')"></div>
    <div class="drag-handle handle-bl" @mousedown="handleModelDrag($event, 'bl')"></div>
    <div class="drag-handle handle-br" @mousedown="handleModelDrag($event, 'br')"></div>

    <div class="resizable-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'trsResizableWrap',

  data () {
    return {
      draggingDirective: ''
    }
  },

  methods: {
    handleModelDrag (event, directive) {
      this.draggingDirective = directive
      document.addEventListener('mousemove', this.updateModalPosition)
      document.addEventListener('mouseup', this.stopListenMove)
    },

    updateModalPosition (event) {
      let width = 0
      let height = 0
      const maxWidth = document.querySelector('.el-dialog__wrapper').getBoundingClientRect().width
      const maxHeight = document.querySelector('.el-dialog__wrapper').getBoundingClientRect().height
      switch (this.draggingDirective) {
        case 'lm': width = maxWidth - 2 * event.clientX; break
        case 'rm': width = 2 * event.clientX - maxWidth; break
        case 'tm': height = maxHeight - 2 * event.clientY; break
        case 'bm': height = 2 * event.clientY - maxHeight; break
        case 'bl': height = 2 * event.clientY - maxHeight; width = maxWidth - 2 * event.clientX; break
        case 'br': height = 2 * event.clientY - maxHeight; width = 2 * event.clientX - maxWidth; break
        case 'tl': height = maxHeight - 2 * event.clientY; width = maxWidth - 2 * event.clientX; break
        case 'tr': height = maxHeight - 2 * event.clientY; width = 2 * event.clientX - maxWidth; break
        default: break
      }
      if (width) {
        document.querySelector('.el-dialog').style.width = width + 'px'
      } 
      if (height) {
        document.querySelector('.el-dialog').style.height = height + 'px'
      }
    },

    stopListenMove (event) {
      document.removeEventListener('mousemove', this.updateModalPosition)
      document.removeEventListener('mouseup', this.stopListenMove)
    }
  }
}
</script>

<style lang="scss">
.uirb-resizable-wrap {
  .drag-handle {
    display: block;
    position: absolute;
    width: 10px;
    height: 10px;
    border: 0;
    z-index: 2001;
  }
  
  .handle-bm,
  .handle-tm {
    left: 10px;
    width: calc(100% - 20px);
    cursor: n-resize;
  }
  .handle-lm,
  .handle-rm {
    top: 10px;
    height: calc(100% - 20px);
    cursor: e-resize;
  }

  .handle-br,
  .handle-tl {
    cursor: nw-resize;
  }

  .handle-bl,
  .handle-tr {
    cursor: ne-resize;
  }

  .handle-tl,
  .handle-tm,
  .handle-tr {
    top: 0;
  }

  .handle-tl,
  .handle-bl,
  .handle-lm {
    left: 0;
  }

  .handle-bl,
  .handle-bm,
  .handle-br {
    bottom: 0;
  }

  .handle-tr,
  .handle-br,
  .handle-rm {
    right: 0;
  }
}
</style>
