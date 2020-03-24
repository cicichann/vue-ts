<template>
  <div class="distribution">
    <div class="trend-header">
      <div class="fl trend-header-tit">数据类型分布</div>
    </div>
    <div id="myChart2" class="myChart2">
    </div>
    <div class="center-counts">
      <p class="counts-tit">总数</p>
      <p class="counts-cont">{{ allCounts }}</p>
    </div>
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
      allCounts: 0,
      nameArray: [],
      typeNum: []
    }
  },
  mounted() {
    this.drawLine()
    this.$watch('data', function(){
      this.drawLine()
    })
  },
  methods: {
    drawLine() {
      const echarts = require('echarts/lib/echarts')
      require('echarts/lib/chart/pie')
      require('echarts/lib/component/tooltip')
      require('echarts/lib/component/toolbox')
      require('echarts/lib/component/legend')
      require('echarts/lib/component/markLine')
      const datas = this.data
      this.allCounts = 0
      this.data.map((item) => {
        switch (item.type) {
          case 'data':
            item.name = '文本'
            break
          case 'pics':
            item.name = '图片'
            break
          case 'videos':
            item.name = '音视频'
            break
          case 'files':
            item.name = '其他附件'
            break
          default:
            this.nameArray.push(item.name + item.value)
        }
        this.allCounts = this.allCounts + item.count
        item.value = item.count
      })

      const myChart = echarts.init(document.getElementById('myChart2'))
      var _zr = myChart.getZr()
      var option = {
        tooltip: {
          trigger: 'item',
          formatter: function(data){
            if(data.dataIndex === 0) {
              let count = 0
              datas.map((item) => {
                count += parseInt(item.value)
              })
              let percentArr = datas.map((item) => {
                return ((item.value / count) * 100).toFixed(0)
              })
              let total = percentArr.reduce((a, b) => {
                return parseInt(a) + parseInt(b)
              })
              switch (total) {
                case 101:
                  data.percent = +data.percent.toFixed(0) - 1
                  break
                case 99:
                  data.percent = +data.percent.toFixed(0) + 1
                  break
              }
            }

            return data.seriesName + '<br/>' + data.name + ' : ' + data.value + ' (' + data.percent.toFixed(0) + '%)';
          }
        },
        legend: {
          orient: '',
          x: '50%',
          y: '25%',
          itemWidth: 10,
          itemHeight: 10,
          icon: 'circle',
          itemGap: 20,
          formatter: function(name) {
            var arr = []
            let count = 0
            let index = 0
            let text = ''
            datas.map((item) => {
              count += parseInt(item.value)
            })

            let percentArr = datas.map((item, i) =>{
              let percent = count > 0 ? ((item.value / count) * 100).toFixed(0) : '0'
              if(item.name === name) {
                text = percent
                index = i
              }
              return percent
            })

            let total = percentArr.reduce((a, b) => {
              return parseInt(a) + parseInt(b)
            })

            switch (total) {
              case 101:
                if(index === 0) text = Number(percentArr[0]) - 1
                break
              case 99:
                if(index === 0) text = Number(percentArr[0]) + 1
                break
            }

            arr = total === 0 ? [ '{a|' + name + '}', '{a|' + 0 + '%}' ] : [ '{a|' + name + '}', '{a|' + text + '%}' ]
            return arr.join('')
          },
          textStyle: {
            rich: {
              a: {
                width: _zr.getWidth() / 3,
                fontSize: 14,
                align: 'left'
              },
              b: {
                fontSize: 14,
                align: 'right'
              }
            }
          }
        },
        series: [
          {
            name: '数据类型',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            center: ['20%', '50%'],
            label: {
              normal: {
                show: false,
                position: 'center'
              },
              emphasis: {
                show: false,
                textStyle: {
                  fontSize: '30',
                  fontWeight: 'bold'
                }
              }
            },
            itemStyle: {
              color: function(params) {
                switch(params.dataIndex) {
                  case 0:
                    return '#f9bc07'
                  case 1:
                    return '#f56ea2'
                  case 2:
                    return '#2ade7f'
                  default:
                    return '#30cfe9'
                }
              }
            },
            data: this.data
          }
        ]
      }

      let resizeFunc = function() {
        if(window.innerWidth<1400) {
          option.legend.textStyle.rich.a.fontSize = 12
          option.legend.textStyle.rich.a.fontSize = 12
        }else {
          option.legend.textStyle.rich.a.fontSize = 14
          option.legend.textStyle.rich.a.fontSize = 14
        }
        myChart.setOption(option)
      }

      resizeFunc()

      window.addEventListener('resize', function() {
        resizeFunc()
        myChart.resize()
      })
    },
    /**
     * @description 下拉切换
     */
    toggleMenu() {
      this.isMenuShow = !this.isMenuShow
    },

    selecteTime(index, item) {
      // let selected.id = item.id
      this.currentIndex = index
      this.isMenuShow = false
    }
  }

}
</script>

<style lang="scss" scoped>
.distribution {
  position: relative;

  .trend-header {
    margin: 30px 26px;

    .trend-header-tit {
      font-size: 20px;
      font-weight: bold;
      color: #415569;
    }
  }

  .center-counts {
    position: absolute;
    top: 50%;
    left: 20%;
    width: 200px;
    margin-left: -100px;
    text-align: center;

    .counts-tit {
      font-size: 16px;
      color: #989898;
    }

    .counts-cont {
      font-size: 26px;
      font-weight: bold;
      color: #1964e1;
    }
  }

  ul {
    overflow: hidden;
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
  .myChart2 {
    width: 100%;
    height: 300px;
  }
}

@media screen and (max-width: 1400px){
  .myChart2 {
    width: 100% !important;
    height: 235px !important;
  }

  .distribution .trend-header .trend-header-tit {
    font-size: 16px;
  }

  .center-counts {
    .counts-tit {
      font-size: 14px !important;
    }

    .counts-cont {
      font-size: 22px !important;
    }
  }
}
</style>
