<template>
  <div class="knowledge-map">
    <!-- tag -->
    <ul class="tag-list fl">
      <li v-for="(item, index) in nodeTypes" :key="index" :type="item.desc" class="tag">{{ item.name }}</li>
    </ul>

    <!-- 图谱容器 -->
    <svg v-show="nodes.length > 0">
      <defs>
        <marker id="arrow-end" class="green" markerWidth="10" markerHeight="10" refX="45" refY="5" orient="auto">
          <path d="M 0,0 L 10,5 L 0,10 z"/>
        </marker>

        <marker id="arrow-start" class="green" markerWidth="10" markerHeight="10" refX="-35" refY="5" orient="auto">
          <path d="M 10,0 L 10,10 L 0,5 z"/>
        </marker>
      </defs>
    </svg>

    <!-- 暂无数据 -->
    <div v-loading="loading" v-show="nodes.length === 0" class="container uirb-no-data" element-loading-text="数据加载中..."></div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import axios from 'axios'

export default {
  name: 'knowledgeMap',

  data() {
    return {
      loading: false,
      nodes: [], // 数据节点
      nodeTypes: [], // 节点类型
      nodeGroups: [],
      links: [], // 连线
      linkLayers: [], // 连线遮罩
      linkLabels: [], // 连线上文字
      config: {
        radius: d => d.label === 'document' ? 55 : 35, // 节点半径
        nodeFontSize: d => d.label === 'document' ? 16 : 14, // 节点label字体大小
      },
      source: {}
    }
  },

  computed: {
    isIE() {
      return navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1
    }
  },

  mounted() {
    this.queryData()
  },

  beforeDestroy() {
    this.source.cancel()
  },

  methods: {
    queryData() {
      this.loading = true
      let url = `/standards/${this.$route.query.standardid}/resources/${this.$route.query.resourceid}/data/${this.$route.query.dataid}/atlas`

      let CancelToken = axios.CancelToken
      this.source = CancelToken.source()
      this.$ajax.get(url, { cancelToken: this.source.token }).then(data => {
        this.loading = false

        if (!data.nodes || data.nodes.length === 0) return

        this.nodes = data.nodes
        this.nodeTypes = data.nodeLabels;

        this.$nextTick(() => {
          this.renderGraph(data)
        })
      }).catch(function(thrown) {
        this.nodes = []
      })
    },

    /**
     * 绘制整个图谱
     */
    renderGraph(data) {
      let clientWidth = parseFloat(getComputedStyle(document.querySelector('svg')).width)
      let clientHeight = parseFloat(getComputedStyle(document.querySelector('svg')).height)

      // 创建容器
      let svg = d3.select('svg').append('g').classed('container', true)

      // 力导向布局
      let simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.arcs).id(d => d.id).distance(d => {
          let singleWordWidth = 10
          let padding = 25
          d.target.distance = d.source.distance = d.name.length * singleWordWidth
            + this.config.radius(d.source)
            + this.config.radius(d.target)
            + padding * 2
          return d.source.distance
        }))
        .force('collide', d3.forceCollide().strength(0).radius(d => {
          return d.distance / 2
        }))
        .force("charge", d3.forceManyBody().strength(-700))
        .force("center", d3.forceCenter(clientWidth / 2, clientHeight / 2))

      this.renderEdges(data, svg)

      this.renderNodes(data, svg)

      this.ticked(simulation)

      this.containerDragable()
    },

    /**
     * 绘制节点间连线
     */
    renderEdges(data, svg) {
      let linkGroups = svg.append('g').classed('edges', true)
        .selectAll('g.edge')
        .data(data.arcs)
        .enter()
        .append('g').classed('edge', true)

      // 添加连线
      this.links = linkGroups
        .append('path')
        .attr('id', d => `edge-${d.id}`)

      // 连线上文字
      this.linkLabelsFake = linkGroups
        .append('text')
        .attr('dy', 3)
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.6em')

      this.linkLabelsFake
        .append('textPath')
        .attr('xlink:href', d => `#edge-${d.id}`)
        .attr('startOffset', '50%')
        .text(d => d.name)

      this.linkLabels = linkGroups
        .append('text')
        .attr('dy', 3)

      this.linkLabels
        .append('textPath')
        .attr('xlink:href', d => `#edge-${d.id}`)
        .attr('startOffset', '50%')
        .text(d => d.name)

      // 连线layer遮罩
      this.linkLayers = linkGroups
        .append('path')
        .classed('edge-layer', true)

      // 添加title
      linkGroups.append('title').text(d => d.name)
    },

    /**
     * 绘制节点
     */
    renderNodes(data, svg) {
      this.nodeGroups = svg.append('g').classed('nodes', true)
        .selectAll('g.node')
        .data(data.nodes)
        .enter()
        .append('g').classed('node', true)

      // 节点layer遮罩
      this.nodeGroups.data(data.nodes)
        .append('circle')
        .classed('node-layer', true)
        .attr('r', d => this.config.radius(d) + 4)

      // 添加节点
      this.nodeGroups.data(data.nodes)
        .append('circle')
        .attr('r', d => this.config.radius(d))
        .attr('type', d => d.label)

      // 节点文字
      if (this.isIE) {
        let nodeLabels = this.nodeGroups
          .append('text')
          .text(d => d.name)
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .style('font-size', d => this.config.nodeFontSize(d))

        this.singleLineTextOverflow(nodeLabels)

      } else {
        let nodeLabels = this.nodeGroups
          .append('foreignObject')
          .attr('width', d => this.config.radius(d) * 2 - 10)
          .attr('height', d => this.config.radius(d) * 2 - 30)
          .attr('x', d => -this.config.radius(d) + 5)
          .attr('y', d => -this.config.radius(d) + 15)
          .style('font-size', d => this.config.nodeFontSize(d))

        nodeLabels
          .append('xhtml:div')
          .append('p')
          .text(d => d.name)
          .attr('title', d => d.name)

        this.multiLineTextOverflow(nodeLabels)
      }

      // 节点title
      this.nodeGroups.append('title').text(d => d.name)
    },

    /**
     * d3渲染回调函数
     */
    ticked(simulation) {
      simulation.on('tick', () => {
        this.links
          .attr('d', d => {
            if (d.source.x < d.target.x) {
              return `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`
            } else {
              return `M ${d.target.x},${d.target.y} L ${d.source.x},${d.source.y}`
            }
          })
          .attr('marker-end', d => d.source.x < d.target.x ? 'url(#arrow-end)' : '')
          .attr('marker-start', d => d.source.x >= d.target.x ? 'url(#arrow-start)' : '')

        let singleLinkLabelWordWidth = 5.5

        this.linkLabels
          .attr('dx', d => {
            let delt = Math.abs(this.config.radius(d.source) - this.config.radius(d.target)) / 2

            if (d.source.x < d.target.x) {
              return -singleLinkLabelWordWidth * d.name.length + delt
            } else {
              return -singleLinkLabelWordWidth * d.name.length - delt
            }
          })

        this.linkLabelsFake
          .attr('dx', d => {
            let delt = Math.abs(this.config.radius(d.source) - this.config.radius(d.target)) / 2

            if (d.source.x < d.target.x) {
              return -singleLinkLabelWordWidth * d.name.length + delt
            } else {
              return -singleLinkLabelWordWidth * d.name.length - delt
            }
          })

        this.linkLayers
          .attr('d', d => {
            return `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`
          })

        this.nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`)

      })
    },

    /**
     * 容器添加拖拽功能
     */
    containerDragable() {
      let x = 0, y = 0

      d3.select('svg').call(d3.drag().on('drag', d => {
        x += d3.event.dx
        y += d3.event.dy
        d3.select('g.container').attr('transform', `translate(${x}, ${y})`)
      }))
    },

    /**
     * 节点单行文字溢出处理
     * @param selection
     */
    singleLineTextOverflow(selection) {
      let self  = this
      selection.each(function (d) {
        let textSelection = d3.select(this),
          text = textSelection.text(),
          textLength = textSelection.node().getComputedTextLength()

        while (textLength > self.config.radius(d)*2 - 10 && textLength > 0) {
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
    }

  }
}
</script>

<style lang="scss">
.knowledge-map {
  height: calc(100vh - 110px);
  min-height: calc(100% - 30px);

  .tag-list {
    margin-bottom: 20px;
  }

  .tag {
    float: left;
    line-height: 30px;
    padding: 0 15px;
    border-radius: 3px;
    color: #fff;
    background-color: #628EE4;

    & + .tag {
      margin-left: 10px;
    }
  }

  .container {
    width: 100%;
    height: 100%;
    border: 1px solid #E5E9EE;
    border-radius: 3px;
    background-color: #fff;
  }

  > svg {
    width: 100%;
    height: calc(100% - 50px);
    border: 1px solid #E5E9EE;
    border-radius: 3px;
    background-color: #fff;

    marker path {
      stroke: #A5ABB6;
      fill: #A5ABB6;
    }

    g.edge {
      cursor: pointer;
      path {
        fill: none;
        stroke: #A5ABB6;
        stroke-width: 1px;
      }
      text {
        font-size: 11px;
      }
      path.edge-layer {
        opacity: 0;
        stroke: rgb(106, 198, 255);
        stroke-width: 14px;
      }

      &:hover path.edge-layer {
        opacity: .3;
      }
    }

    g.node {
      cursor: pointer;
      text {
        fill: #fff;
      }
      circle {
        stroke-width: 2px;
      }
      circle.node-layer {
        opacity: 0;
        stroke-width: 8px;
        stroke: rgb(106, 198, 255);
      }

      &:hover circle.node-layer {
        opacity: .3;
      }
    }

    foreignObject {
      div {
        display: table;
        width: 100%;
        height: 100%;
      }

      p {
        display: table-cell;
        padding: 0 2px;
        color: #fff;
        text-align: center;
        word-break: break-all;
        vertical-align: middle;
      }
    }
  }

  .tag[type="base"], circle[type='base'] {
    fill: #628EE4;
    stroke: #6082D6;
    background-color: #628EE4;
  }

  .tag[type="document"], circle[type='document'] {
    fill: #68BDF6;
    stroke: #5CA8DB;
    background-color: #68BDF6;
  }

  .tag[type="event"], circle[type='event'] {
    fill: #FF756E;
    stroke: #E06760;
    background-color: #FF756E;
  }

  .tag[type="person"], circle[type='person'] {
    fill: #6DCE9E;
    stroke: #60B58B;
    background-color: #6DCE9E;
  }

  .tag[type="place"], circle[type='place'] {
    fill: #DE9BF9;
    stroke: #BF85D6;
    background-color: #DE9BF9;
  }

  .tag[type="date"], circle[type='date'] {
    fill: #FB95AF;
    stroke: #E0849B;
    background-color: #FB95AF;
  }

  .tag[type="group"], circle[type='group'] {
    fill: #ffc107;
    stroke: #ff9800;
    background-color: #ffc107;
  }
}
</style>
