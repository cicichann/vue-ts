<template>
  <!-- 信息资源库左侧分类树，兼容标准下分类和三方应用下分类 -->
  <div ref="intree" class="in-tree">
    <el-tree
      ref="tree"
      :data="treeData"
      :props="props"
      :default-expanded-keys="defaultExpandedKeys"
      :load="querySubNode"
      node-key="id"
      lazy
      @node-click="handleClick">
      <span slot-scope="{ node, data }" :title="node.label" :class="{'disabled-item': data.disabled}" class="custom-tree-node">
        {{ node.label }}
      </span>
    </el-tree>
  </div>
</template>

<script>
import { CATEGORY_TREE_PROPS } from '@/config/index'

export default {
  name: 'uirbTree',

  props: {
    // 一级分类列表
    data: {
      type: Array,
      default: () => []
    },

    // 当前选择的标准或应用id
    standardId: {
      type: [String, Number],
      default: ''
    },

    handleClick: {
      type: Function,
      default: () => {}
    },

    // 当前查看类型，'standard'-标准，'app'-应用
    type: {
      type: String,
      default: 'standard'
    },

    // 获取子分类方法
    getCategory: {
      type: Function,
      default: () => {}
    }
  },

  data() {
    return {
      props: CATEGORY_TREE_PROPS,
      defaultExpandedKeys: []
    }
  },

  computed: {
    treeData () {
      this.$nextTick(() => this.$refs.tree.setCurrentKey(0))
      return JSON.parse(JSON.stringify(this.data))
    }
  },

  watch: {
    data (newVal) {
      if (this.type === 'standard') {
        this.defaultExpandedKeys = newVal.map(item => item.id).splice(1)
      }
    }
  },

  methods: {
    /**
     * load请求子分类数据
     * @param node  展开的父节点
     * @param resolve element-tree，通过resolve，将数据append到字节点
     */
    querySubNode(node, resolve) {
      if (!Object.values(node.data).length) return

      let params = { parentCategoryId: node.data.id }
      if (+node.data.id !== 0 && +node.data.parentId === 0) params.rootCategoryId = node.data.id

      this.getCategory(this.type, params).then(data => { resolve(data) })
    },

    /**
     * 树结构联动
     */
    locateNode(originData) {
      if(originData.id === '0') return

      this.runQueue(originData.path.split(','), this.iterator, (selectedNodeId) => {
        this.$refs.tree.setCurrentKey(selectedNodeId)

        this.$nextTick(() => {
          let parentNode = document.querySelector('.side-bar .in-tree .is-current')
          this.scrollToNode(parentNode, selectedNodeId, originData)
        })
      })
    },

    /**
     * 异步请求子节点数据队列
     */
    runQueue(queue, fn, callback) {
      const step = index => {
        if (index === queue.length - 1) {
          return callback(queue[index])
        }

        if (queue[index]) {
          fn(queue[index], () => {
            this.$nextTick(() => {
              step(index + 1)
            })
          })
        }
      }

      step(0)
    },

    /**
     * 请求子节点，将数据添加到children属性
     * @param id  父节点id
     * @param resolve
     */
    iterator(id, resolve) {
      let node = this.$refs.tree.getNode(id)
      node.expanded = true

      if (node.data.hasChildren === 1 && node.childNodes.length === 0 && this.defaultExpandedKeys.indexOf(parseInt(id)) < 0) {
        let params = { parentCategoryId: id }
        if (+node.data.id !== 0 && +node.data.parentId === 0) params.rootCategoryId = node.data.id

        this.getCategory(this.type, params).then(category => {
          this.$set(node.data, 'children', category)
          resolve()
        })
      } else {
        resolve()
      }
    },

    /**
     * 定位到点击站点
     */
    scrollToNode(targetNode, id, data) {
      let scrollDis = targetNode.offsetTop
      let parentId = data.path.split(',').filter(id => id !== data.id).pop()

      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.intree.scrollTop = scrollDis
          this.handleClick(data, targetNode, null, parentId || 0)
        },250)
      })
    }
  }
}
</script>

<style lang="scss">
.in-tree {
  height: calc(100% - 105px);
  overflow-y: auto;
}

.custom-tree-node {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.custom-tree-all-node {
  font-size: 15px;
}

@media screen and (max-width: 1400px) {
  .custom-tree-all-node {
    font-size: 13px;
  }
}
</style>
