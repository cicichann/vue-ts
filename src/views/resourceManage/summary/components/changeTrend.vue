<template>
  <div class="dataTrend">
    <div class="trend-header">
      <div class="fl trend-header-tit">数据调用情况走势</div>
      <div class="fr drop-down">
        <el-button size="small" type="primary" @click="toggleMenu">
          <span v-for="(menu, index) in menus" v-if="index === currentIndex" :key="menu.name">{{ menu.name }}</span>
          <i class="el-icon-caret-bottom el-icon--right"/>
        </el-button>
        <ul :class="{'expanded': isMenuShow}">
          <li v-for="(menu, index) in menus" :key="index" :class="{'is-current': index === currentIndex}">
            <p @click="selecteTime(index, menu)">{{ menu.name }}</p>
          </li>
        </ul>
      </div>
    </div>
    <div id="myChart" class="myChart"></div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      required: true,
      type: Array
    }
  },

  data() {
    return {
      chartDatas: this.data,
      timeArray: [],
      countArray: [],
      menus: [
        { name: '近一周', index: '1' },
        { name: '近一月', index: '2' },
        { name: '近一年', index: '3' }
      ],
      currentIndex: 0,
      isMenuShow: false
    }
  },
  mounted() {
    this.drawLine()
    this.$watch('data', function(){
      this.timeArray = []
      this.countArray = []
      this.drawLine()
    })
  },
  methods: {
    drawLine() {
      const echarts = require('echarts/lib/echarts')
      require('echarts/lib/chart/line')
      require('echarts/lib/component/tooltip')
      require('echarts/lib/component/toolbox')
      require('echarts/lib/component/legend')
      require('echarts/lib/component/markLine')
      for (var i = 0; i < this.data.length; i++) {
        this.timeArray.push(this.data[i].count)
        switch (this.currentIndex) {
          case 0 :
          this.exchangeNum(this.data[i].week)
          break
          case 1 :
          this.countArray.push(this.data[i].day)
          break
          case 2 :
          this.countArray.push(this.data[i].month+'月')
          break
        }
      }
      const myChart = echarts.init(document.getElementById('myChart'))
      var option = {
        tooltip: {
          trigger: 'item',
          formatter: '{c}'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.countArray,
          axisLabel: {
            color: '#415569',
            fontSize: 14
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#415569',
            fontSize: 14
          },
          splitLine: {
            lineStyle: {
                color: ['#edf0f3']
            }
          }
        },
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: '#1dc4dc' // 0% 处的颜色
          }, {
            offset: 0.5, color: '#478dfe' // 50% 处的颜色
          }, {
            offset: 1, color: '#478dfe' // 100% 处的颜色
          }],
          globalCoord: false // 缺省为 false
        },
        series: [{
          data: this.timeArray,
          type: 'line',
          smooth: true,
          areaStyle: {}
        }]
      }
      if(window.innerWidth<1400) {
          option.xAxis.axisLabel.fontSize = 12
          option.yAxis.axisLabel.fontSize = 12
        }else {
          option.xAxis.axisLabel.fontSize = 14
          option.yAxis.axisLabel.fontSize = 14
        }
      myChart.setOption(option)
      window.addEventListener('resize', function() {
        if(window.innerWidth<1400) {
          option.xAxis.axisLabel.fontSize = 12
          option.yAxis.axisLabel.fontSize = 12
        }else {
          option.xAxis.axisLabel.fontSize = 14
          option.yAxis.axisLabel.fontSize = 14
        }
        myChart.setOption(option)
        myChart.resize()
      })
    },
    /**
     * @description 下拉切换
     */
    toggleMenu() {
      this.isMenuShow = !this.isMenuShow
    },

    /**
     *  @description 下拉选中
     */
    selecteTime(index, item) {
      let val = ''
      this.currentIndex = index
      this.isMenuShow = false
      switch (index) {
        case 0 :
        val = 'week'
        break
        case 1 :
        val = 'month'
        break
        case 2 :
        val = 'year'
        break
      }
      this.$emit('requestChaData', val)
    },

    /**
     * @description 周数据数字转换为汉字
     */
    exchangeNum(val) {
        switch (val) {
          case 'MONDAY':
          this.countArray.push('周一')
          break
          case 'TUESDAY':
          this.countArray.push('周二')
          break
          case 'WEDNESDAY':
          this.countArray.push('周三')
          break
          case 'THURSDAY':
          this.countArray.push('周四')
          break
          case 'FRIDAY':
          this.countArray.push('周五')
          break
          case 'SATURDAY':
          this.countArray.push('周六')
          break
          case 'SUNDAY':
          this.countArray.push('周日')
          break
        }
    }

  }

}
</script>

<style lang="scss" scoped>
.dataTrend {
    .trend-header {
        margin: 30px 40px 0 26px;
        height: 30px;

        .trend-header-tit {
            font-size: 20px;
            font-weight: bold;
            color: #415569;
        }
    }
    ul {
        width: 100px;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        box-shadow: 0 3px 6px rgba(53, 59, 66, .1);
        position: absolute;
        z-index: 3;
        left: 0;
        opacity: 0;
        transform: scale(1, 0);
        transform-origin: top;
        transition: all ease-in-out .2s;

        &.expanded {
        opacity: 1;
        transform: scale(1);
        }

        li {
            width: 100px;
            cursor: pointer;
            line-height: 30px;
            text-indent: 20px;
            background: #fff;

            &:hover {
                background: #f0f5fa;
                }

            &.is-current {
                color: #fff;
                background: #3e84f5;
                }
            }

            p {
                font-size: 14px;
                text-align: left;
            }
        }
        .el-button {
            padding: 0 10px !important;
        }
        button {
            width: 100px;
            color: #415569;
            background-color: #fff;
            border: 1px solid #ddd;

            span {
                display: inline-block;
                height: 30px;
                line-height: 30px;
            }
        }
        .drop-down {
            position: relative;
        }
        .myChart {
          width: 109%;
          height: 300px;
          margin-left: -25px;
        }
    }
    @media screen and (max-width: 1400px) {
      .dataTrend .trend-header .trend-header-tit {
        font-size: 16px;
      }
      .myChart {
        width: 103% !important;
        height: 235px !important;
        margin-left: 0 !important;
      }
      .dataTrend button {

            span {
                display: inline-block;
                height: 26px;
                line-height: 26px;
                font-size: 12px;
            }
      }
      .drop-down ul p {
        font-size: 12px;
      }
    }

</style>
