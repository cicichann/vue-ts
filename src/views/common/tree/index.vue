<template>
  <div v-loading="loading" ref="intree" class="in-tree">
    <el-tree ref="category" :data="treeData" :props="treeProps" :default-expanded-keys="defaultExpandedKeys" :load="querySubCategory"
             lazy node-key="id" @node-click="handleNodeClick">
      <span slot-scope="{ node, data }" :id="node.id" :title="node.label.trim()" :class="{'disabled-item': data.disabled}" class="custom-tree-node">
        {{ node.label }}
      </span>
    </el-tree>
  </div>
</template>

<script>
import { CATEGORY_TREE_PROPS } from '@/config/index'

export default {
  name: 'TrsTree',

  props: {
    data: {
      type: Array,
      default: () => []
    },
    props: {
      type: Object,
      default: () => {
        CATEGORY_TREE_PROPS
      }
    },
    standardId: {
      type: [String, Number],
      default: ''
    },
    isAllShow: {
      type: Boolean,
      default: true
    },

    // 是否禁用节点方法
    checkDisabled: {
      type: [Function, String],
      default: ''
    },

    // 为节点添加类名方法
    addClassName: {
      type: Function,
      default: () => {}
    }
  },

  data () {
    return {
      defaultExpandedKeys: [],
      loading: false
    }
  },

  computed: {
    /**
     * 添加"全部分类"节点数据
     */
    treeData () {
      let data = JSON.parse(JSON.stringify(this.data))
      return data
    },

    treeProps () {
      return Object.assign({}, CATEGORY_TREE_PROPS, this.props)
    }
  },

  watch: {
    data (val) {
      if (!this.treeProps.isDefaultCollapse) {
        this.initExpanedKeys()
      }

      this.initDisableNode(val)

      this.$nextTick(() => {
        this.$refs.category.setCurrentKey(0)
      })
    }
  },

  methods: {
    /**
     * 默认展开到第一级父节点
     */
    initExpanedKeys () {
      this.defaultExpandedKeys.splice(0)

      this.data.forEach((item) => {
        if (item.hasChildren === 1) {
          this.defaultExpandedKeys.push(item.id)
        }
      })
    },

    /**
     * 请求子分类数据
     * @param node  展开的父节点
     * @param resolve element-tree，通过resolve，将数据append到字节点
     */
    querySubCategory (node, resolve) {
      if (Object.prototype.toString.apply(node.data) !== '[object Object]') return

      let params = {
        parentCategoryId: node.data.id,
        containsChildren: 0,
        searchText: ''
      }
      this.$api.querySubCategory(this.standardId, params).then((data) => {
        resolve(data)

        this.initDisableNode(data)
      })
    },

    /**
     * 初始化节点状态，为禁用的节点添加类名
     */
    initDisableNode (nodes) {
      if (this.checkDisabled) {
        nodes.map((item) => {
          item.disabled = this.checkDisabled(item, this.$refs.category.getNode(item.parent_id))
        })

        this.$nextTick(() => {
          this.addClassName()
        })
      }
    },

    /**
     * 点击分类节点
     */
    handleNodeClick (data) {
      this.$emit('categoryChange', data)
    },

    /**
     * 树结构联动
     */
    locateNode (id) {
      return new Promise(resolve => {
        if (parseInt(id) === 0) {
          this.$refs.category.setCurrentKey(0)
          let parentNode = document.querySelector('.side-bar .in-tree .is-current')
          this.locateTreeNode(parentNode, this.$refs.category.getNode(0).data)
          resolve()
        } else {
          this.$api.queryCategoryPath(this.standardId, id).then(data => {
            let idPath = data.idPath.split(',')

            this.runQueue(idPath, this.iterator, (id) => {
              this.$nextTick(() => {
                this.$refs.category.setCurrentKey(id)
                let parentNode = document.querySelector('.side-bar .in-tree .is-current')
                this.locateTreeNode(parentNode, this.$refs.category.getNode(id).data)
                resolve()
              })
            })
          })
        }
      })
    },

    /**
     * 根据id获取节点信息
     * @param id 节点id
     */
    getNodeById (id) {
      return this.$refs.category.getNode(id)
    },

    /**
     * 插入节点
     * @param parentId 要插入节点的父节点
     * @param data 节点数据
     * @param option 位置信息
     */
    insertNode (parentId, data, option = null) {
      if (option) {
        option.type === 'before' ? this.$refs.category.insertBefore(data, option.targetId)
        : this.$refs.category.insertAfter(data, option.targetId)
      } else {
        if (+parentId !== 0) {
          this.$refs.category.append(data, parentId)
          this.updateNodeStatus(parentId, false)
        } else {
          let lastId = this.$refs.category.data[this.$refs.category.data.length - 1].id
          this.$refs.category.insertAfter(data, lastId)
          this.updateNodeStatus(data.id, false)
        }
      }
    },

    /**
     * 更新节点状态，是否展开、是否是叶子节点
     * @param id 节点id
     */
    updateNodeStatus (id, expand = true) {
      let node = this.getNodeById(id)
      node.expanded = expand
      node.isLeafByUser = !(node.data.children && node.data.children.length > 0)
    },

    /**
     * 更新子节点数据
     * @param id 节点id
     * @param childrenData 子节点数据
     */
    updateChildNode (id, childrenData) {
      this.$refs.category.updateKeyChildren(id, childrenData)
      this.updateNodeStatus(id)
    },

    /**
     * 移除节点
     * @param id 节点id
     */
    removeNode (id) {
      let node = this.getNodeById(id)
      let parentNodeId = node.data.parent_id

      this.$refs.category.remove(this.getNodeById(id))
      if (parentNodeId) this.updateNodeStatus(parentNodeId)
    },

    /**
     * 更新节点数据
     * @param id 节点id
     */
    editNode (data) {
      let node = this.getNodeById(data.id)
      node.data = data
    },

    /**
     * 异步请求子节点数据队列
     */
    runQueue (queue, fn, callback) {
      const step = index => {
        if (index === queue.length - 1) {
          return callback(queue[index])
        }

        if (queue[index]) {
          fn(queue[index]).then(() => {
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
    iterator (id) {
      let node = this.$refs.category.getNode(id)
      node.expanded = true

      return new Promise((resolve) => {
        if (node.data.hasChildren === 1 && node.childNodes.length === 0 && this.defaultExpandedKeys.indexOf(parseInt(id)) < 0) {
          this.querySubCategory(node, (childNodes) => {
            this.$set(node.data, 'children', childNodes)

            // 生成子节点
            childNodes.forEach(item => {
              this.$refs.category.append(item, node)
            })
            resolve()
          })
        } else {
          resolve()
        }
      })
    },

    /**
     * 定位到点击站点
     */
    locateTreeNode (targetNode, data) {
      this.$nextTick(() => {
        let scrollDis = targetNode.offsetTop
        setTimeout(() => {
          this.$refs.intree.scrollTop = scrollDis
          this.handleNodeClick(data)
        }, 250)
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
