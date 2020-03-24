<template>
  <div v-clickoutside="handleClose" :class="{'custom-time': selected.value === 'CUSTOM'}" class="uirb-time-select">
    <div class="el-select" @click.stop="toggleShow">
      <div :class="{'is-focus': showSelect || timepickerShow}" class="el-input el-input--suffix">
        <input v-model="selected.name" :title="selected.name" type="text" readonly="readonly" autocomplete="off" placeholder="请选择" class="el-input__inner">
        <span class="el-input__suffix">
          <span class="el-input__suffix-inner">
            <i :class="{'is-reverse': showSelect || timepickerShow}" class="el-select__caret el-input__icon el-icon-arrow-up"></i>
          </span>
        </span>
      </div>
    </div>

    <transition name="el-zoom-in-top">
      <div v-if="showSelect" class="el-select-dropdown">
        <ul>
          <li
            v-for="item in options"
            :key="item.value"
            :class="{'selected': item.value === selected.value}"
            :title="item.name"
            class="el-select-dropdown__item"
            @click="handleComfirm(item)">
            {{ item.name }}</li>
        </ul>
      </div>
    </transition>

    <el-popover ref="timepicker" v-model="timepickerShow" trigger="manual" placement="bottom" popper-class="time-picker-popover">
      <!-- popover内容 -->
      <div class="time-picker">
        <p>开始时间</p>
        <el-date-picker :clearable="false" :picker-options="startOption" v-model="timeProp.fromTime" value-format="timestamp" type="date" placeholder="请选择开始时间"> </el-date-picker>
        <p style="margin-top:10px;">结束时间</p>
        <el-date-picker :clearable="false" :picker-options="endOption" v-model="timeProp.endTime" value-format="timestamp" type="date" placeholder="请选择结束时间"> </el-date-picker>
        <div class="time-picker-btn">
          <el-button :disabled="timeProp.fromTime === '' || timeProp.endTime ===''" type="primary" @click="handleSetComfirm">确认</el-button>
          <el-button class="fr" @click="timepickerShow = false">取消</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { TIME_TYPE } from '@/config/index'
import Clickoutside from '@/utils/clickoutside';

export default {
  name: 'TrsTimeSelect',

  directives: { Clickoutside },

  props: {
    // 时间选项
    options: {
      type: Array,
      default: () => TIME_TYPE
    },

    defaultName: {
      type: String,
      default: () => '全部时间'
    }
  },

  data () {
    return {
      showSelect: false,
      timepickerShow: false,
      timeProp: {
        fromTime: '',
        endTime: ''
      },
      selected: this.options[0],
      // 限制开始选择时间，今天之前或结束时间之前
      startOption: {
        disabledDate: (time) => {
          if (this.timeProp.endTime) {
            return time.getTime() > this.timeProp.endTime
          } else {
            return time.getTime() > Date.now()
          }
        }
      },
      // 限制结束时间为开始时间之后
      endOption: {
        disabledDate: (time) => {
          return time.getTime() < this.timeProp.fromTime
        }
      }
    }
  },

  mounted () {
    /**
     * 兼容IE，表单不可聚焦
     */
    document.querySelector('.el-select input').setAttribute('unselectable', 'on')

    if (this.options === TIME_TYPE) this.options[0].name = this.defaultName
  },

  methods: {
    handleClose() {
      this.showSelect = false
    },

    /**
     * 控制popover显隐
     */
    toggleShow () {
      this.showSelect = !this.showSelect
      if (this.showSelect) this.timepickerShow = false
    },

    /**
     * 确认选择
     */
    handleComfirm (item) {
      this.showSelect = false
      if (item.value !== 'CUSTOM') {
        this.selected = item
        this.timeProp.fromTime = ''
        this.timeProp.endTime = ''
        this.$emit('selectTime')
      } else {
        this.timepickerShow = true
      }
    },

    /**
     * 确认自定义设置
     */
    handleSetComfirm () {
      if (!this.timeProp.fromTime || !this.timeProp.endTime) return
      this.timepickerShow = false
      this.selected = {
        value: 'CUSTOM',
        name: this.formatTime(this.timeProp.fromTime)  + ' 至 ' + this.formatTime(this.timeProp.endTime)
      }
      this.timeProp.endTime = this.timeProp.endTime + 86399000

      this.$emit('selectTime')
    },

    /**
     * 格式化时间
     */
    formatTime (timestamp) {
      let time = new Date(timestamp)
      return time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()
    }
  }
}
</script>

<style lang="scss">
.uirb-time-select {
  display: inline-block;

  .el-select {
    width: 150px;
  }

  .el-select input {
    text-overflow: ellipsis;
  }

  .el-input__inner {
    height: 30px;
    line-height: 28px;
  }

  .el-select-dropdown {
    width: 150px;
    z-index: 9999;
  }

  .el-select-dropdown ul {
    padding: 6px 0;
    transition: all 1s;
  }

  .time-picker {
    p {
      line-height: 22px;
    }

    .el-input__inner {
      border-color: #e6ebef;
    }

    .el-date-editor,
    .el-date-editor input {
      width: 160px !important;
    }

    .time-picker-btn {
      margin-top: 12px;
    }

    .el-button {
      width: 70px;
      height: 30px;
      line-height: 30px;
      padding: 0;
    }
  }
}

.custom-time,
.custom-time .el-select,
.custom-time .el-select input,
.custom-time .el-select-dropdown {
  width: 220px !important;
}

</style>
