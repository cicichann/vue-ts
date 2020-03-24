<template>
  <div v-loading="loading" class="trace-container" element-loading-text="数据加载中...">
    <div :title="data.dataTitle" class="trace-title" v-html="data.dataTitle"></div>
    <svg id="trace-map" class="trace-map" style="width: 100%">
      <defs>
        <marker id="arrow" class="green" markerWidth="10" markerHeight="11" refX="10" refY="5" orient="auto">
          <path d="M 0,0 L 10,5 L 0,10 z"/>
        </marker>
      </defs>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import fecha from 'fecha'
import d3SelectionMulti from '@/utils/d3-selection-multi'
import axios from 'axios'

export default {
  data() {
    return {
      loading: false,
      data: {},
      treeData: {},
      transformX: 0,
      transformY: 0,
      scale: 1,
      consumerNum: 0,
      params: {
        standardId: this.$route.query.standardid,
        categoryId: this.$route.query.categoryid,
        resourceId: this.$route.query.resourceid,
        dataId: this.$route.query.dataid
      },
      actionMap: {
        COPY: {
          desc: '复制引用',
          image: './static/editing-table_icon20.png'
        },
        ORIGIN: {
          desc: '源文档',
          image: ''
        },
        LINK: {
          desc: '链接引用',
          image: './static/editing-table_icon07.png'
        },
        MIRROR: {
          desc: '镜像引用',
          image: './static/editing-table_icon08.png'
        },
        PUSH: {
          desc: '上报',
          image: './static/editing-table_icon21.png'
        },
        DISTRIBUTE: {
          desc: '下达',
          image: './static/editing-table_icon22.png'
        }
      },
      optionsLgScreen: {
        nodeLabelWidth: 217,
        nodeLabelHeight: 72,
        nodeFontSize: '18px',
        nodeFontColor: '#415569',
        nodePadding: 20,
        nodeIconRadius: 6,
        nodeIconDx: 27,
        linkWidth: 110,
        linkFontSize: 12,
        linkFontColor: '#415569',
        navFontSize: '14px'
      },
      optionsMiniScreen: {
        nodeLabelWidth: 140,
        nodeLabelHeight: 46,
        nodeFontSize: '14px',
        nodeFontColor: '#415569',
        nodePadding: 8,
        nodeIconRadius: 4,
        nodeIconDx: 18,
        linkWidth: 100,
        linkFontSize: 12,
        linkFontColor: '#415569',
        navFontSize: '12px',
      },
      options: {},
      source: {}
    }
  },

  computed: {
    isIE() {
      return navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1
    }
  },

  mounted() {
    this.loading = true
    d3SelectionMulti(d3, d3)
    let CancelToken = axios.CancelToken
    this.source = CancelToken.source()
    this.$api.queryTrace(this.params, { cancelToken: this.source.token }).then(data => {
      this.data = data
      this.treeData = this.formatTreeData(data)

      this.drawTree(this.data)
      this.loading = false
    }, () => {
      this.loading = false
      document.addEventListener('click', this.closeBtnClick)
    }).catch(function(thrown) {
      this.data = {}
    })

    if (parseFloat(getComputedStyle(document.querySelector('body')).width) < 1400) {
      this.options = Object.assign({}, this.optionsMiniScreen)
    } else {
      this.options = Object.assign({}, this.optionsLgScreen)
    }

    window.addEventListener("resize", () => {
      if (parseFloat(getComputedStyle(document.querySelector('body')).width) < 1400) {
        this.options = Object.assign({}, this.optionsMiniScreen)
      } else {
        this.options = Object.assign({}, this.optionsLgScreen)
      }
      this.drawTree()
    });
  },

  beforeDestroy() {
    this.source.cancel()
  },

  methods: {
    /**
     * 时间戳格式化
     */
    formatDate(time) {
      return fecha.format(fecha.parse(time, 'YYYY-MM-DD HH:mm:ss'), 'YYYY-MM-DD')
    },

    /**
     * 转换后端返回值为d3可使用的树结构
     */
    formatTreeData(data) {
      const consumer = []
      this.consumerNum = data.consumer.length

      data.consumer.forEach((item, i) => {
        // 处理消费者子树
        if (item.data) {
          item.children = [].concat(item.data);
          for (let j = 0; j < item.data.length; j++) {
            this.formatSubTree(item.data[j]);
          }
        }

        consumer.push(Object.assign({}, {
          name: item.standardname,
          id: `consumer-${i}`,
          time: this.formatDate(item.opertime)
        }, item))
      })

      // 使用轨迹可能无数据来源
      if (!data.producer.standardname) {
        return {
          id: `standard-0`,
          name: data.standardName,
          children: consumer,
          activeNode: true
        }

        // 存在数据来源
      } else {
        return {
          id: `producer-0`,
          name: data.producer.standardname,
          children: [{
            id: `standard-0`,
            name: data.standardName,
            activeNode: true,
            time: this.formatDate(data.producer.opertime),
            children: consumer
          }]
        }
      }
    },

    /**
     * 递归转换consumer下的站点栏目子树
     */
    formatSubTree(data) {
      data.id = +data.RECID;
      data.name = data.CHANNELDESC;
      data.location = data.CHANNELNAV;
      data.time = this.formatDate(data.OPERTIME);

      if (data.REF) {
        this.consumerNum += data.REF.length;
        data.children = [].concat(data.REF);

        for (let i = 0; i<data.REF.length; i++) {
          this.formatSubTree(data.REF[i]);
        }
      }
    },

    drawTree() {
      // 重绘时，清除原有内容
      d3.selectAll('svg g.container').remove()
      let data = Object.assign({}, this.treeData)

      // 树结构布局
      let vLayout = d3.tree(data)
      let vRoot = d3.hierarchy(data)
      let vNodes = vRoot.descendants()
      this.setLayoutSize(vLayout, vNodes)
      let vLinks = vLayout(vRoot).links()
      this.transformX = 20
      // this.adjustSubTreeSpace(vNodes, this.options.nodeLabelHeight - 12)

      // 画树
      let svg = d3.select('#trace-map')
        .append('g')
        .classed('container', true)
        .attr('transform', `translate(${this.transformX}, ${this.transformY}) scale(${this.scale})`)

      this.renderEdges(svg, vLinks)
      this.renderNodes(svg, vNodes)
      this.containerDragable()
    },

    /**
     * 设置树结构容器的宽高
     */
    setLayoutSize(layout, nodes) {
      let clientWidth = parseFloat(getComputedStyle(document.querySelector('svg')).width) - 40
      let clientHeight = parseFloat(getComputedStyle(document.querySelector('svg')).height)

      // 树结构深度
      let depth = 0;
      for (let i = 0; i < nodes.length; i++) {
        if (depth < nodes[i].depth) depth = nodes[i].depth;
      }

      let nodeItemWidth = this.options.nodeLabelWidth + this.options.linkWidth
      let nodeItemHeight = this.options.nodeLabelHeight + 20*2 + 20
      let treeWidth = nodeItemWidth * (depth + 1);
      let treeHeight = nodeItemHeight * this.consumerNum
      if (treeHeight < clientHeight) treeHeight = clientHeight

      if (treeWidth < clientWidth - this.options.nodeLabelWidth) {
        treeWidth = clientWidth - this.options.nodeLabelWidth
        layout.size([treeHeight, treeWidth])
      } else {
        layout.nodeSize([nodeItemHeight, nodeItemWidth])
        this.transformY = clientHeight/2

        if (clientWidth < nodeItemWidth*(depth+1) - this.options.linkWidth) {
          this.scale = (clientWidth) / (nodeItemWidth*(depth+1) - this.options.linkWidth)
        }
      }
    },

    /**
     * 修正子树间的垂直间距
     */
    adjustSubTreeSpace(nodes, dy) {
      for(let node of nodes) {
        let nodeItemHeight = this.options.nodeLabelHeight + 20*2 + 20
        node.x = (node.x/nodeItemHeight - node.x/nodeItemHeight%0.5)*nodeItemHeight
      }
    },

    /**
     * 绘制连线
     */
    renderEdges(svg, vLinks) {
      // 连线分组
      let linkGroups = svg.append('g')
        .classed('links', true)
        .selectAll('g.link')
        .data(vLinks)
        .enter()
        .append('g')
        .classed('link', true)

      vLinks.forEach((item) => {
        item.source = Object.assign({}, item.source)
        item.source.linky = item.source.y + this.options.nodeLabelWidth
      })

      linkGroups
        .append("path")
        .attrs({
          'class': 'link',
          'id': d => d.target.data.id,
          'd': d3.linkHorizontal().x(d => d.linky || d.y).y(d => d.x),
          'marker-end': 'url(#arrow)'
        })

      // 时间
      linkGroups
        .append('text')
        .attrs({'dx': -37, 'dy': 4})
        .append('textPath')
        .attr('xlink:href', d => `#${d.target.data.id}`)
        .text(d => d.target.data.time)
        .attrs({
          'startOffset': '50%',
          'stroke': '#fff',
          'stroke-width': '1em',
          'font-size': this.options.linkFontSize
        })

      linkGroups
        .append('text')
        .attrs({'dx': -37, 'dy': 4})
        .append('textPath')
        .attr('xlink:href', d => `#${d.target.data.id}`)
        .text(d => d.target.data.time)
        .attrs({
          'startOffset': '50%',
          'fill': this.options.linkFontColor,
          'font-size': this.options.linkFontSize
        })
    },

    /**
     * 绘制节点
     */
    renderNodes(svg, vNodes) {
      // 节点分组
      let nodeGroups = svg.append('g')
        .classed('nodes', true)
        .selectAll("g.node")
        .data(vNodes)
        .enter()
        .append("g")
        .classed('node', true)
        .classed('active-node', d => d.data.activeNode)
        .attr("transform", d => `translate(${d.y}, ${d.x})`)

      nodeGroups
        .append('title')
        .text(d => {
          if (!d.data.RECID) {
            return d.data.name;
          }
          return `${this.actionMap[d.data.ACTIONDESC].desc}\n操作人：${d.data.OPERUSER}\n操作时间：${d.data.OPERTIME}\n栏目路径：${d.data.CHANNELNAV}`
        })

      // 背景图
      nodeGroups
        .append('path')
        .classed('node-label', true)
        .attr('d', `M0,-${this.options.nodeLabelHeight/2 - 6} A6,6,0,0,1,6,-${this.options.nodeLabelHeight/2}
                    L${this.options.nodeLabelWidth - 17},-${this.options.nodeLabelHeight/2}
                    L${this.options.nodeLabelWidth},0
                    L${this.options.nodeLabelWidth - 17},${this.options.nodeLabelHeight/2}
                    L6,${this.options.nodeLabelHeight/2} A6,6,0,0,1,0,${this.options.nodeLabelHeight/2 - 6} z`)

      nodeGroups
        .append('circle')
        .attrs({'r': this.options.nodeIconRadius, 'cx': this.options.nodeLabelWidth - this.options.nodeIconDx})

      // 节点文字
      if (this.isIE) {
        let labels = nodeGroups
          .append('text')
          .text(d => d.data.name)
          .attrs({'dx': this.options.nodePadding, 'dy': 6})
          .styles({'font-size': this.options.nodeFontSize, 'color': this.options.nodeFontColor})
        this.singleLineTextOverflow(labels, this.options.nodeLabelWidth - this.options.nodePadding - this.options.nodeIconDx - this.options.nodeIconRadius*2)

      } else {
        let labels = nodeGroups
          .append('foreignObject')
          .classed('node-label', true)
          .attrs({
            'width': this.options.nodeLabelWidth - this.options.nodePadding - this.options.nodeIconDx - this.options.nodeIconRadius*2,
            'height': this.options.nodeLabelHeight,
            'x': this.options.nodePadding,
            'y': -this.options.nodeLabelHeight/2
          })
        labels
          .append('xhtml:div')
          .append('p')
          .text(d => d.data.name)
          .styles({'font-size': this.options.nodeFontSize, 'color': this.options.nodeFontColor})
        this.multiLineTextOverflow(labels)
      }

      let specialGroups = nodeGroups.filter(d => {
        return d.data.RECID;
      })
      // 文档状态
      if (this.isIE) {
        specialGroups
          .append('rect')
          .classed('node-status', true)
          .attrs({
            'width': 40,
            'height': 20,
            'x': 0,
            'y': -(this.options.nodeLabelHeight/2 + 24),
            'fill': '#e5e5e5'
          })
        specialGroups
          .append('text')
          .text(d => d.data.DOCSTATUSDESC)
          .attrs({
            'x': 6,
            'y': -(this.options.nodeLabelHeight/2 + 10),
            'fill': '#a3a3a3',
            'font-size': 12
          })
      } else {
        specialGroups
          .append('foreignObject')
          .classed('node-status', true)
          .attrs({
            'width': 40,
            'height': 20,
            'x': 0,
            'y': -(this.options.nodeLabelHeight/2 + 24)
          })
          .append('xhtml:div')
          .append('p')
          .text(d => d.data.DOCSTATUSDESC)
          .attr('title', d => d.data.DOCSTATUSDESC)
      }

      // 引用标示图标
      specialGroups
        .append("svg:image")
        .attrs({
          'xlink:href': d => this.actionMap[d.data.ACTIONDESC].image,
          'x': 50,
          'y': -(this.options.nodeLabelHeight/2 + 24),
          'width': 18,
          'height': 18
        })

      // 站点、栏目信息
      let nav = specialGroups
        .append('text')
        .classed('node-nav', true)
        .text(d => d.data.location)
        .attrs({'x': 0, 'y': this.options.nodeLabelHeight/2 + 18})
        .styles({'font-size': this.options.navFontSize})
      this.singleLineTextOverflow(nav, this.options.nodeLabelWidth - 17)
    },

    /**
     * 节点单行文字溢出处理
     * @param selection
     */
    singleLineTextOverflow(selection, width) {
      selection.each(function (d) {
        let textSelection = d3.select(this),
          text = textSelection.text(),
          textLength = textSelection.node().getComputedTextLength()

        while (textLength > width && textLength > 0) {
          text = text.slice(0, -1)
          textSelection.text(text + '...')
          textLength = textSelection.node().getComputedTextLength()
        }
      })
    },

    /**
     * 节点多行文字溢出处理
     * @param selection
     */
    multiLineTextOverflow: function(selection) {
      selection.each(function (d) {
        let textSelection = d3.select(this).select('p'),
          text = textSelection.text(),
          textHeight = parseFloat(getComputedStyle(textSelection.node())['height']),
          boxHeight = d3.select(this).attr('height')

        while (textHeight > boxHeight && text.length > 0) {
          text = text.slice(0, -1)
          textSelection.text(text + '...')
          textHeight = parseFloat(getComputedStyle(textSelection.node())['height'])
        }
      })
    },

    /**
     * 容器添加拖拽功能
     */
    containerDragable() {
      let zoom = d3.zoom()
        .on('zoom', d => {
          let self = this
          d3.select('g.container').transition().duration(50).attr('transform', () => {
            let scale = d3.event.transform.k + self.scale - 1;
            return `translate(${d3.event.transform.x + scale*self.transformX}, ${d3.event.transform.y + scale*self.transformY}) scale(${scale})`
          })
        })
      zoom.scaleExtent([0.3, 1.4])
      d3.select('svg').call(zoom)
    },

    /**
     * 监听弹窗按钮关闭事件
     */
    closeBtnClick (event) {
      if (!event.target.className) return
      if (event.target.className.indexOf('el-dialog__headerbtn') > -1 || event.target.className.indexOf('el-dialog__close') > -1) {
        document.removeEventListener('click', this.closeBtnClick)
        window.close()
      }
    }
  }
}
</script>

<style lang="scss">
#trace-map {
  path {
    fill: none;
    stroke: #39cb81;
    stroke-width: 1px;
  }

  marker path {
    fill: #39cb81;
  }

  g.node {
    cursor: pointer;

    path {
      fill: #fafafa;
      stroke: #e5e9ef;
    }

    text {
      font-weight: bold;
    }

    circle {
      fill: #fff;
      stroke: #E6EBEF;
    }

    foreignObject.node-label {
      div {
        display: table;
        width: 100%;
        height: 100%;
      }

      p {
        display: table-cell;
        padding: 10px 0;
        font-weight: bold;
        text-align: left;
        vertical-align: middle;
      }
    }

    .node-status {
      color: #a3a3a3;
      background: #e5e5e5;
      text-align: center;
      border-radius: 3px;
      font-size: 12px;
      line-height: 20px;

      + text {
        font-weight: normal;
      }
    }

    .node-nav {
      fill: #ff7950;
    }
  }

  g.node.active-node {
    path {
      fill: #2a8bed;
      stroke: #2a8bed;
    }

    text {
      fill: #fff;
    }

    circle {
      fill: #fff;
      stroke: #fff;
    }

    foreignObject p {
      color: #fff !important;
    }
  }

}
</style>
