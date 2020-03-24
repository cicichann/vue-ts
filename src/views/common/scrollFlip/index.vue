<template>
  <!-- 滚动翻页组件 -->
  <div class="scroll-flip">
    <el-button v-if="showPager" :disabled="left >= 0" class="prev-btn fl" @click="prevPage"><i class="el-icon el-icon-arrow-left"></i></el-button>
    <div class="fix-wrap">
      <div class="scroll-wrap">
        <!-- 滚动内容插槽 -->
        <slot></slot>
      </div>
    </div>
    <el-button v-if="showPager" :disabled="left <= -wrapWidth" class="next-btn fr" @click="nextPage"><i class="el-icon el-icon-arrow-right"></i></el-button>
  </div>
</template>

<script>
export default {
  name: 'trsScrollFlip',

  props: {
    items: {
      type: Array,
      required: true
    }
  },

  data () {
    return {
      showPager: false,
      wrapWidth: 0,
      scrollWidth: 0,
      left: 0
    }
  },

  watch: {
    // 动态更新滚动内容宽度
    items (newVal) {
      this.$nextTick(() => {
        this.scrollWidth = document.querySelector('.scroll-wrap').clientWidth
        this.showPager = this.wrapWidth < this.scrollWidth
      })
    }
  },

  mounted () {
    // 初始化容器宽度
    this.wrapWidth = document.querySelector('.fix-wrap').clientWidth
  },

  methods: {
    /**
     * 上一页
     */
    prevPage() {
      let scroll = document.querySelector('.scroll-wrap')
      this.left += this.wrapWidth
      scroll.style.cssText='left:' + this.left + 'px'
    },

    /**
     * 下一页
     */
    nextPage () {
      let scroll = document.querySelector('.scroll-wrap')
      this.left -= this.wrapWidth
      scroll.style.cssText='left:' + this.left + 'px'
    }
  }

}
</script>

<style lang="scss">
.scroll-flip {
  display: inline-block;
  width: 100%;
  height: 100%;

  .el-button{
    width: 28px;
    height: 28px;
    line-height: 28px;
    margin-top: 8px;
    padding: 0;
    border-radius: 3px;

    &.prev-btn {
      margin-right: 6px;
    }

    &.next-btn {
      margin-left: 6px;
    }
  }

  .fix-wrap {
    display: inline-block;
    height: 100%;
    width: calc(100% - 70px);
    white-space: nowrap;
    overflow: hidden;
  }

  .scroll-wrap {
    position: relative;
    display: inline-block;
    height: 100%;
    transition: all 0.1s ease-in;
  }
}
</style>
