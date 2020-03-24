<template>
  <!-- 标签筛选组件 -->
  <filter-group ref="labelFilter" :group-list="labelGroup" :label-filter="true" @title-click="changeType">
    <template slot="child-append">
      <el-radio-group v-model="selectedLetter">
        <el-radio-button v-for="(letter, index) in letters" :label="letter.name" :key="index" :class="{'no-label-item': letter.labels.length === 0}"
                         :disabled="letter.labels.length === 0"></el-radio-button>
      </el-radio-group>
      <div class="label-group clearfix">
        <div v-for="label in labelsInLetter" :key="label.id" class="filter-item label-item fl">
          <span>
            <el-checkbox :value="selectedItem.indexOf(label.label) !== -1" @change="$emit('filteritem-change', label.label)"></el-checkbox>
            <span style="padding-left: 6px">{{ label.label }}</span>
          </span>
        </div>
        <p v-if="!showAll" class="more-btn fr" @click="loadAllLabels"><i v-if="loading" class="el-icon-loading"/>加载全部</p>
        <p v-if="labelsInLetter.length === 0" class="no-label">暂无数据</p>
      </div>
    </template>
  </filter-group>
</template>

<script>
import filterGroup from './filterGroup.vue'

export default {
  name: 'category-filter',
  components: { filterGroup },

  props: {
    labels: {
      type: Array,
      required: true
    },

    selectedItem: {
      type: Array,
      default: () => {
        return []
      }
    }
  },

  data () {
    return {
      labelGroup: [],
      letters: [],
      selectedLetter: '不限',
      labelsInLetter: [],
      showAll: false,
      loading: false
    }
  },

  watch: {
    'selectedLetter' (newValue) {
      if (!newValue) return

      this.showAll = false
      let labels = this.letters.find(letter => letter.name === newValue).labels
      this.labelsInLetter = this.showAll ? labels : labels.slice(0, 25)
      if (labels.length < 25) this.showAll = true
    },
    'labels' (newValue) {
      this.initLetter()
    }
  },

  mounted () {
    this.initLetter()
    this.initLabelGroup()
  },

  methods: {
    /**
     * 初始化标签分组数据
     */
    initLabelGroup () {
      this.labelGroup = ['全部标签']
      this.$api.queryTagTree().then(data => {
        data.forEach(group => {
           this.labelGroup.push(group.typeName)
        })

        // 默认展开全部标签
        this.$refs.labelFilter.curGroup = this.labelGroup[0]
        this.$refs.labelFilter.toggleShow(this.labelGroup[0])
      })
    },

    /**
     * 初始化筛选字母，字母下labels为空则置灰显示
     */
    initLetter () {
      let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#', '不限']
      this.letters = letters.map(letter => {
        return {name: letter, labels: this.labels.filter(label =>  { return this.checkLabel(label, letter, this.$refs.labelFilter.curGroup)} )}
      })

      // 根据当前选择字母确定展示标签
      let labels = this.letters.find(letter => letter.name === this.selectedLetter).labels
      this.labelsInLetter = this.showAll ? labels : labels.slice(0, 25)
      if (labels.length < 25) this.showAll = true
    },

    /**
     * 加载全部标签
     */
    loadAllLabels () {
      this.loading = true
      let oldHeight = document.querySelector('.label-group').offsetHeight

      setTimeout(() => {
        this.labelsInLetter = this.letters.find(letter => letter.name === this.selectedLetter).labels
        this.showAll = true
      })

      // 未渲染完成loading图标展示
      let interval = setInterval(() => {
        if (document.querySelector('.label-group').offsetHeight !== oldHeight) {
          clearInterval(interval)
          this.loading = false
        }
      }, 1000)
    },

    /**
     * 判断标签是否属于某个首字母
     */
    checkLabel (label, capital, group) {
      if (!group || group === '全部标签') {
        return label.capital === capital || capital === '不限'
      } else {
        return (label.capital === capital || capital === '不限') && label.type === group
      }
    },

    /**
     * 标签分组修改处理事件
     */
    changeType () {
      this.selectedLetter = '不限'
      this.showAll = false
      this.initLetter()
    }
  }
}
</script>

<style lang="scss">
.more-btn {
  width: 100%;
  color: #969ea6;
  font-size: 12px;
  text-align: center;
}
</style>
