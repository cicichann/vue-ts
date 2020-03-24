<template>
  <!-- 分页 -->
  <div class="list-pagination">
    <!-- 左侧 -->
    <el-pagination
      :current-page="pagination.currPage"
      :pager-count="5"
      :total="pagination.itemCount"
      :page-size="pagination.pageSize"
      class="fl"
      layout="prev, pager, next, slot"
      @current-change="handleIndexChange">
      <span class="left-jump">到第<div class="el-input el-pagination__editor is-in-pagination"><input
        v-model="jumpValue"
        type="number"
        autocomplete="off"
        min="1"
        class="el-input__inner"></div>页
        <button :disabled="validator" class="jump-btn" @click="jumpTo">GO</button>
      </span>
    </el-pagination>
    <!-- 右侧 -->
    <div v-if="right" class="fr">
      <span class="count-num">共 <span>{{ pagination.itemCount }}</span> 条数据</span>
      <span style="margin-right: 5px">单页显示</span>
      <el-select v-model="pagination.pageSize">
        <el-option v-for="item in pagination.pageSizes" :key="item" :label="item" :value="item"></el-option>
      </el-select>
      <span style="margin-left: 5px">条</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrsPagination',

  props: {
    // 分页信息
    pagination: {
      type: Object,
      default: () => {
        return {
          itemCount: 0,
          pageSize: 10,
          pageSizes: [10, 20, 30, 50, 100],
          currPage: 1
        }
      }
    },
    // 是否有右侧条数切换
    right: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      jumpValue: '' // 跳转输入
    }
  },

  computed: {
    /**
     * 输入校验
     */
    validator() {
      const exec = /^[1-9]\d*$/
      return !(this.jumpValue < (this.pagination.itemCount / this.pagination.pageSize) + 1 && exec.test(this.jumpValue))
    }
  },

  watch: {
    'pagination.pageSize': function(newIndex, oldValue) {
      this.pagination.currPage = 1
      if (oldValue) this.$emit('callback', this.pagination)
    }
  },

  methods: {
    /**
     * 输入跳转
     */
    jumpTo() {
      this.pagination.currPage = parseInt(this.jumpValue)
      this.$emit('callback', this.pagination)
    },

    /**
     * 点击跳转
     */
    handleIndexChange(index) {
      this.pagination.currPage = index
      this.$emit('callback', this.pagination)
    }
  }
}
</script>

<style lang="scss">
.list-pagination {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;

  .el-input input {
    height: 30px;
    line-height: 30px;
    padding: 0 10px;
    box-shadow: 0 0 0 0;
  }

  .el-select,
  .el-input {
    width: 60px;
  }

  .el-pagination .el-input input {
    width: 50px;
    height: 30px;
    line-height: 30px;
    color: #3e84f5;
    border-radius: 3px;
  }

  .number {
    display: inline-block;
    min-width: 30px;
    padding: 0 10px;
    margin: 0 5px;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    font-weight: normal;
  }

  .el-pager li {
    height: 30px;
    line-height: 30px;
  }

  .el-pager li.active {
    padding: 0 11px;
    border: 0;
    color: #ffffff;
    background-color: #3e84f5;
  }

  .el-pager li.active+li {
    border: 1px solid #e0e0e0;
  }

  .count-num {
    margin-right: 10px;

    span {
      color: #39cb81;
      font-weight: 800;
    }
  }

  .el-pagination button {
    margin: 0 5px;
    padding: 0;
    min-width: 30px;
    height: 30px;
    line-height: 30px;
    border-radius: 3px;
    text-align: center;

    &:disabled {
      border: 1px solid #e0e0e0;
      background-color: #fafafa;
    }
  }

  .btn-prev,
  .btn-next {
    border: 1px solid #e0e0e0;
  }

  .left-jump {
    margin-left: 10px;
    font-weight:normal;
    font-size:14px
  }

  .jump-btn {
      display: inline-block;
      margin-left: 10px;
      background-color: #4a8efd;
      color: #fff;
      cursor: pointer;
      &:hover:not(:disabled) {
        border: 0;
        color: #fff;
        background-color: #3e84f5;
      }
  }
}
</style>
