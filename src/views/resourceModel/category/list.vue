<template>
  <div>
    <!------------------------------------- 数据分类 ---------------------------------------------------->
    <div class="sub-nav">
      <div class="fl">
        <!-- 按钮层 -->
        <button :disabled="selectArray.length > 0" class="edit-btn other-btn" @click="importCategory">导入</button>
        <button v-if="isExportable" class="edit-btn other-btn" @click="exportCategory">导出目录</button>
        <button :disabled="selectArray.length == 0" class="edit-btn other-btn" @click="moveTo">移动到</button>
        <button :disabled="selectArray.length <= 1" class="edit-btn other-btn" @click="editCategory('merge', selectArray.join(','))">合并</button>
        <button :disabled="selectArray.length == 0" class="edit-btn delete-btn" @click="deleteCategory()">删除</button>
      </div>
      <div class="fr">
        <el-input v-model="status.searchText" placeholder="请输入分类名称" suffix-icon="search" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList" />
        </el-input>
      </div>
    </div>

    <div v-loading="loading" class="table-content no-selected" element-loading-text="数据加载中...">
      <div ref="box" class="block-wrapper el__body-wrapper">
        <!-- 列表层 -->
        <el-checkbox-group v-model="selectArray">
          <div v-for="item in categoryList" :key="item.id" :id="item.id" class="card-block-wrapper draggable" @mouseenter="status.activeId = item.id" @mouseleave="status.activeId = ''">
            <div v-if="item.id === moveToId" class="move-box"></div>
            <div :title="item.category_name + ` (id:${ item.id })`" class="card-item">
              <div class="card-head">
                <el-checkbox :label="item.id" />
                <span class="move-icon" title="拖拽" @mousedown="status.activeId = ''" @mouseup="status.activeId = item.id"></span>
                <span class="card-id">ID:{{ item.id }}</span>
              </div>
              <div class="card-body" @click="handleCategoryClick(item)">
                <div class="img-block"></div>
                <p class="block-desc">{{ item.category_name }}</p>
              </div>
              <div v-show="!status.dragging && status.activeId === item.id" class="card-footer category-footer">
                <span class="list-icon edit-icon" title="编辑" @click="editCategory('edit', item.id)"></span>
                <span class="list-icon split-icon" title="拆分" @click="splitCategory(item)"></span>
                <span class="list-icon delete-icon" title="删除" @click="deleteCategory(item.id)"></span>
              </div>
            </div>

            <div v-if="item.hasChildren == 1" class="have-level"></div>
            <div v-if="item.hasChildren == 1" class="have-level-bottom"></div>
          </div>

          <!-- 新增分类 -->
          <div id="classify-add" class="add-item dis-draggable" style="display: inline-block;" @click="editCategory('add')">
            <div class="add-layer"></div>
            <p class="desc">新增分类</p>
          </div>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>

<script>
import editCategoryDialog from './components/editCategory.vue'
import deleteCategory from './components/deleteCategory.vue'
import importCategory from './components/loadCategory.vue'
import moveToDialog from './components/moveTo.vue'
import splitCategoryDialog from './components/splitCategory.vue'
import Sortable from 'sortablejs'

export default {
  name: 'categoryList',

  data () {
    return {
      categoryList: [], //列表数据
      selectArray: [], //选中数组
      moveToId: '', // 拖拽的目标id
      status: {
        containsChildren: 0,
        searchText: '',
        activeId: '', // 当前分类
        dragging: false // 是否正在拖拽
      },
      loading: false,
      isExportable: true // 默认展示导出目录按钮
    }
  },

  watch: {
    /**
     * 监听分类名变化
     * @param val 当前分类ID
     */
    '$route.query.standardid' (val) {
      this.status.searchText = ''
      this.selectArray = []
      this.isExportable = true
      this.queryList()
    },
    '$route.query.categoryid' (val) {
      this.status.searchText = ''
      this.selectArray = []
      this.isExportable = (val === 0)
      this.queryList()
    }
  },

  /**
   * 初始化
   */
  mounted () {
    this.queryList() // 请求分类数据
    this.rowDrop() // 拖动排序初始化
  },

  methods: {
    /**
     * 请求列表数据
     * @param flag
     */
    queryList (flag) {
      this.loading = true
      let params = {
        containsChildren: 0,
        searchText: this.status.searchText,
        parentCategoryId: this.$route.query.categoryid
      }
      return new Promise(resolve => {
        this.$api.queryCategoriesList({standardId: this.$route.query.standardid}, params).then(data => {
          this.categoryList = data || []
          this.selectArray = []
          this.loading = false
          resolve(data)
        })
      })
    },

    /**
     * 跳转到子分类
     */
    handleCategoryClick (data) {
      let params = {
        standardid: this.$route.query.standardid,
        categoryid: data.id,
        parentCategoryId: data.parent_id,
        category_name: data.category_name.trim()
      }
      this.$router.push({ path: '/model/category/list', query: params })
      this.$parent.$refs.sideMenu.locateNode(data.id, true)
    },

    /**
     * 新建/编辑/合并分类
     */
    editCategory(type, categoryId = 0) {
      this.$dialog(editCategoryDialog, {action: type, query: this.$route.query, categoryId: categoryId}).then((id) => {
        this.queryList().then(data => {
          const nodeData = type === 'merge' ? data : data.find(item => item.id === id)
          this.updateNode(this.$route.query.categoryid, type, nodeData)
        })
      })
    },

    /**
     * 导入操作
     */
    importCategory() {
      this.$dialog(importCategory, {query: this.$route.query}).then(() => {
        let oldData = JSON.parse(JSON.stringify(this.categoryList))
        this.queryList().then(data => {
          let importData = data.filter(newItem => { return !oldData.some(oldItem => oldItem.id === newItem.id) })
          importData.forEach(item => {
            this.updateNode(this.$route.query.categoryid, 'add', item)
          })
          this.$parent.$refs.sideMenu.updateNodeStatus(this.$route.query.categoryid)
        })
      })
    },

    /**
     * 移动到弹窗
     */
    moveTo () {
      this.$dialog(moveToDialog, { selectArray: this.selectArray, route: this.$route }).then(([targetId, ids]) => {
        // 跳转到移动节点
        this.$parent.$refs.sideMenu.locateNode(+targetId).then(() => {
          this.$nextTick(() => {
            // 更新左侧分类树
            String(ids).split(',').forEach(id => {
              const node = this.$parent.$refs.sideMenu.getNodeById(+id)
              this.updateNode(+id, 'delete')
              this.$parent.$refs.sideMenu.updateNodeStatus(this.$route.query.categoryid)
              this.updateNode(+targetId, 'add', node.data)
            })
          })
        })
        this.$router.push({ path: '/model/category/list', query: { standardid: this.$route.query.standardid, categoryid: targetId, category_name: '' } })
      })
    },

    /**
     * 删除选中分类操作
     */
    deleteCategory(ids) {
      let categoryId = ids || this.selectArray.join(',')
      this.$api.classfyHaveData({standardId: this.$route.query.standardid}, {categoryIds: categoryId}).then(data => {
        this.$dialog(deleteCategory, {standardId: this.$route.query.standardid, ids: categoryId}).then(() => {
          this.queryList()
          String(categoryId).split(',').forEach(id => {
            this.updateNode(id, 'delete')
          })
        })
      })
    },

    /**
     * 更新左侧分类树
     */
    updateNode (id, type, nodeData, option) {
      switch (type) {
        case 'add': // 新增一个分类节点
          this.$parent.$refs.sideMenu.insertNode(id, nodeData, option);
          break
        case 'delete': // 删除一个分类节点
          this.$parent.$refs.sideMenu.removeNode(id);
          break
        case 'edit':  // 修改一个分类节点
          this.$parent.$refs.sideMenu.editNode(nodeData);
          break
        case 'merge':
        case 'update':  // 更新一个分类节点的子节点
          if (!parseInt(id)) this.$parent.initCategory()
          else this.$parent.$refs.sideMenu.updateChildNode(id, nodeData)
      }
    },

    /**
     * 增加选中，或者取消选中
     * @param {item, check, delId}
     */
    changeSelectArray (item, check) {
      if (!check) {
        this.selectArray.forEach((items, index) => {
          if (item === items) {
            this.selectArray.splice(index, 1)
          }
        })
      } else {
        this.selectArray.push(item)
      }
    },

    /**
     * 方块拖拽
     */
    rowDrop () {
      const tbody = document.querySelector('.el__body-wrapper .el-checkbox-group')// 获取容器
      // 实例化，定义初始配置
      Sortable.create(tbody, {
        group: 'id',
        sort: true,
        delay: 0,
        store: null,
        handle: '.move-icon',
        draggable: '.draggable', // 可拖拽元素类名
        filter: '.dis-draggable', // 不可拖拽元素类名
        forceFallback: true,
        onStart: () => {
          this.status.dragging = true
        },
        onMove: (evt) => {
          this.moveToId = parseInt(evt.dragged.getAttribute("id"))
        },
        onEnd: (evt) => {
          this.status.dragging = false
          this.moveToId = ''
          // 判断到底拖动了没有
          if ((evt.newIndex !== undefined) && evt.newIndex !== evt.oldIndex) {
            // 移动方向
            const moveDirection = evt.oldIndex > evt.newIndex ? 1 : -1
            // 被拖拽字段ID +1加上不可拖拽元素
            const fromId = evt.to.children[evt.newIndex].getAttribute('id')
            // 目标字段ID +1 -1抵消
            let toId = moveDirection == -1 ? evt.to.children[evt.newIndex - 1].getAttribute('id') : evt.to.children[evt.newIndex + 1].getAttribute('id')
            let param = {
              fromId: fromId,
              toId: toId,
              moveDirection: moveDirection
            }
            this.$api.sortClassfication(this.$route.query, param).then(data => {
              this.queryList()

              const node = this.$parent.$refs.sideMenu.getNodeById(fromId)
              const targetNode = this.$parent.$refs.sideMenu.getNodeById(toId)
              this.updateNode(node.data.id, 'delete')
              this.updateNode(node.data.parent_id, 'add', node.data, {targetId: targetNode.data.id, type: moveDirection === 1 ? 'before' : 'after'})
            })
          }
        }
      })
    },

    /**
     * 拆分
     */
    splitCategory (item) {
      this.$dialog(splitCategoryDialog, { editItem: item, query: this.$route.query }).then(data => {
        this.queryList().then(data => {
          this.updateNode(this.$route.query.categoryid, 'update', data)
        })
      })
    },

    /**
     * 导出
     */
    exportCategory () {
      this.$trsModalConfirm({title: "导出目录", content: "是否确认导出当前标准下的所有目录？", danger: false}).then(() => {
        this.$api.downloadCategory(this.$route.query.standardid)
      })
    }
  }
}
</script>
