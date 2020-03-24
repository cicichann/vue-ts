<template>
  <!-- 筛选组件 -->
  <div class="filter-group">
    <div v-if="groupList.length > 0" :class="{'folder-group': !showMore}" class="title-group clearfix">
      <div v-for="(item, index) in groupList" :key="index" :class="{'active-item': curGroup === item && showAppend}" class="filter-item fl" @click="toggleShow(item)">
        <span v-if="labelFilter">{{ item }}</span>
        <span v-else>
          <el-checkbox :value="isExistItem(item)" :disabled="checkDisabled(item)" @change="$emit('filteritem-change', item)" />
          <span style="padding-left: 6px">{{ item.name }}</span>
        </span>
      </div>
      <span v-if="showMore && isMutiRow" class="set-title" @click="showMore = false">
        收起<i class="el-icon--right el-icon-arrow-up"></i>
      </span>
      <span v-if="!showMore && isMutiRow" class="set-title" @click="showMore = true">
        展开<i class="el-icon--right el-icon-arrow-down"></i>
      </span>
    </div>

    <el-collapse-transition>
      <div v-if="showAppend">
        <div class="filter-append">
          <slot name="child-append"></slot>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script>
import eventBus from '@/utils/eventBus'

export default {
  name: 'filter-group',

  components: {eventBus},

  props: {
    groupList: {
      type: Array,
      default: () => {
        return []
      }
    },
    labelFilter: {
      type: Boolean,
      default: false
    },
    selectedItem: {
      type: Array,
      default: () => {
        return []
      }
    },
    type: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      isMutiRow: false,
      showMore: true,
      showAppend: false,
      curGroup: ''
    }
  },

  watch: {
    'groupList' (newVal) {
      this.$nextTick(() => {
        this.calcHeight(this.$el.offsetHeight)
      })
    },
  },

  mounted () {
    // 多行才显示[展开]/[收起]
    this.calcHeight(this.$el.offsetHeight)
  },

  methods: {
    toggleShow (val) {
      if (val === this.curGroup && this.showAppend) {
        this.showAppend = false
        return
      }
      this.curGroup = val
      this.showAppend = true
      this.$emit('title-click', val)
    },

    calcHeight (height) {
      if (height > 51) {
        this.isMutiRow = true
      } else {
        this.isMutiRow = false
      }
    },

    isExistItem (val) {
      let result = false
      this.selectedItem.forEach(item => {
        if (item.id === val.id) result = true
      })
      return result
    },

    checkDisabled (item) {
      return item.id === this.$route.query.categoryid || item.hasRight === 0 || item.disabled
    }
  }
}
</script>

<style lang="scss">
.filter-group {
  .title-group {
    position: relative;
    padding: 5px 30px 5px 10px;
    overflow: hidden;

    .set-title {
      position: absolute;
      right: 10px;
      top: 10px;
      display: block;
      height: 30px;
      line-height: 30px;
      cursor: pointer;
      color: #2A8BED;
    }
  }
  .folder-group {
    height: 50px;
  }

  .filter-append {
    transition: all .3s ease-out;
  }

  .filter-item {
    display: inline-block;
    height: 30px;
    line-height: 30px;
    min-width: 100px;
    padding: 0 10px;
    margin: 5px 10px 5px 0;
  }

  .filter-item:not(.label-item) {
    cursor: pointer;
  }

  .filter-item.active-item {
    background-color: #2A8BED;
    border-radius: 3px;
    color: #ffffff;
  }

  .expand-slow-enter-active {
    transition: all .5s ease-out;
  }

  .expand-slow-enter {
    // height: 50px;
    opacity: 0;
  }

  .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner {
    background-color: #b4ecd0;
    border-color: #b4ecd0;
  }
  .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner::after {
    border-color: #fff;
  }
}
</style>
