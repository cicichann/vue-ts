<template>
  <div class="">
    <div class="sub-nav">
      <!-- 按钮 -->
      <div class="fl">
        <button :disabled="data.selectArray.length > 0" class="edit-btn other-btn" @click="importResource">导入</button>
        <button :disabled="data.selectArray.length == 0" class="edit-btn other-btn" @click="moveResource">移动到</button>
        <button :disabled="data.selectArray.length == 0" class="edit-btn delete-btn" @click="deleteResource('')">删除</button>
      </div>

      <!-- 面包屑、检索 -->
      <div class="fr">
        <el-input v-model="status.searchText" :placeholder="'请输入' + (status.selectedSearchType ? status.selectedSearchType : '检索词')"
                  class="front-condition-search" @keyup.enter.native="queryList()">
          <el-select slot="prepend" v-model="status.searchType" :title="status.selectedSearchType" popper-class="condition-dropdown" placeholder="类型" @change="searchTypeChange">
            <el-option label="全部" value=""></el-option>
            <el-option
              v-for="item in data.searchList"
              :key="item.id"
              :label="item.cnName"
              :value="item.enName"
              :title="item.cnName" />
          </el-select>
          <i slot="suffix" class="input-icon" @click="queryList()"/>
        </el-input>
      </div>
    </div>

    <div class="sub-filter">
      <!-- 动态单选、多选、下拉筛选 -->
      <div class="select-filter fl">
        <el-select v-for="item in data.filterList" :key="item.name" v-model="item.choose" :placeholder="item.desc"
                   :title="item.choose" popper-class="dropdown-select-150" class="fl active-select" @change="queryList">
          <el-option
            v-for="option in item.options"
            :key="option.desc"
            :title="option.desc"
            :label="option.desc"
            :value="option.desc">
          </el-option>
        </el-select>
      </div>

      <!-- 右侧面包屑 -->
      <el-breadcrumb class="fr" separator-class="el-icon-arrow-right">
        <span class="fl sign"/>
        <el-breadcrumb-item>全部</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 列表 -->
    <div v-loading="loading" class="table-content table-has-select-nav no-selected" element-loading-text="数据加载中..." element-loading-background="rgba(255, 255, 255, 1)">
      <div class="block-wrapper el__body-wrapper">
        <el-checkbox-group v-model="data.selectArray">

          <!-- 新增数据表 -->
          <div v-if="$route.query.groupid" class="add-item dis-draggable" @click="editResource('add')">
            <div class="add-layer"></div>
            <p class="desc">新增数据表</p>
          </div>

          <div v-for="item in data.structureList" :key="item.id" :id="item.id" class="card-block-wrapper draggable" @mouseenter="status.activeId = item.id" @mouseleave="status.activeId = ''">
            <div v-if="item.id === data.moveToId" class="move-box"></div>
            <div :title="item.resource_name + ` (id:${ item.id })`" class="card-item">
              <div class="card-head">
                <el-checkbox :label="item.id" />
                <span class="move-icon" title="拖拽" @mousedown="status.activeId = ''" @mouseup="status.activeId = item.id"></span>
                <span class="card-id">ID:{{ item.id }}</span>
              </div>
              <div class="card-body" @click="handleItemClick(item)">
                <div class="img-block structure-cover"></div>
                <p class="block-desc">{{ item.resource_name }}</p>
              </div>
              <div :class="{'show': !status.dragging && (status.activeId === item.id || status.actionId === item.id)}" class="card-footer">
                <span class="list-icon edit-icon" title="编辑" @click="editResource('edit', item.id)"></span>
                <span class="list-icon attr-icon" title="数据表属性" @click="changeAttribute(item)"></span>
                <span class="list-icon dupl-icon" title="排重规则设置" @click="setDeDuplication(item.id)"></span>
                <el-popover trigger="hover" placement="bottom-start" popper-class="nav-more-popover sub-menu clearfix" @show="status.actionId = item.id" @hide="status.actionId = ''">
                  <ul>
                    <li @click.stop="setSortRule(item.id)">默认排序规则</li>
                    <li @click.stop="editResource('copy', item.id)">相似创建</li>
                    <li @click.stop="deleteResource(item.id)">删除</li>
                  </ul>
                  <span slot="reference" class="list-icon more-icon" title="更多"></span>
                </el-popover>
              </div>
            </div>
          </div>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>

<script>
import loadResourceDialog from './components/loadResource.vue'
import moveResourceDialog from './components/moveResource.vue'
import editResourceDialog from './components/editResource.vue'
import attributeDialog from './components/attributeDialog.vue'
import deleteResourceDialog from './components/deleteResource.vue'
import setDeDuplicationDialog from './components/setDeDuplication.vue'
import setSortRuleDialog from './components/setSortRule.vue'
import Sortable from "sortablejs"

export default {
  name: "resourceList",

  data () {
    return {
      data: {
        structureList: [], // 列表数据
        selectArray: [], // 选中数组
        moveToId: '', // 拖拽的目标id
        searchList: [], // 检索字段列表
        filterList: [] // 动态下拉筛选列表
      },
      status: {
        searchText: "",
        searchType: '', // 检索类型
        selectedSearchType: '', // 检索类型名称
        activeId: '', // 当前资源表
        actionId: '', // 展示更多操作的资源表
        dragging: false // 是否正在拖拽
      },
      loading: false
    }
  },

  watch: {
    $route (newVal, oldVal) {
      if (newVal.query.standardid !== oldVal.query.standardid || newVal.query.groupid !== oldVal.query.groupid) { // 监听标准名/库名变化
        this.status.searchText = ''
        this.structureList = []
        if (newVal.query.groupid) this.queryList()
      }

      if (newVal.query.standardid !== oldVal.query.standardid) {
        this.queryFieldList()
      }
    }
  },

  /**
   * 初始化
   */
  mounted () {
    this.status.searchText = this.$route.query.searchText
    this.queryFieldList()
    if (this.$route.query.groupid) this.queryList() //请求数据
    this.rowDrop() //拖动排序
  },

  methods: {
    /**
     * 请求字段列表
     */
    queryFieldList () {
      this.data.searchList = []
      this.data.filterList = []
      this.$api.queryResourceFields({ standardId: this.$route.query.standardid }).then(data => {
        data.map(field => {
          let type = field.fieldType
          if (type === 'TEXT' || type === 'NUMERICAL') {
            this.data.searchList.push(field)
          } else if (type !== 'CHECK') {
            let options = JSON.parse(field.enumValue)
            options.unshift({'desc': '全部' + field.cnName, 'id': ''})
            this.data.filterList.push({
              name: field.enName,
              type: field.fieldType,
              init: '全部' + field.cnName,
              choose: '全部' + field.cnName,
              options: options
            })
          }
        })
      })
    },

    /**
     * 请求列表数据
     */
    queryList () {
      this.loading = true
      this.data.selectArray = []
      let url = {
        standardId: this.$route.query.standardid
      }

      // 下拉筛选参数拼接
      let specialSearch = []
      this.data.filterList.map(item => {
        if (item.choose !== item.init) {
          specialSearch.push({field: item.name, id: item.options.find(option => { return option.desc === item.choose }).id, type: item.type})
        }
      })

      let params = {
        groupId: this.$route.query.groupid,
        searchText: this.status.searchText,
        searchField: this.status.searchType,
        specialSearch: specialSearch.length === 0 ? '' : JSON.stringify(specialSearch)
      }
      this.$api.queryStructureListTable(url, params).then(data => {
        this.data.structureList = data
        this.loading = false
      })
    },

    /**
     * 切换检索类型
     */
    searchTypeChange (value) {
      let selectedItem = this.data.searchList.find(item => { return item.enName === value })
      this.status.selectedSearchType = selectedItem ? selectedItem.cnName : ''
    },

    /**
     * 方块拖拽
     */
    rowDrop () {
      const tbody = document.querySelector(".el__body-wrapper .el-checkbox-group") // 获取容器
      // 实例化，定义初始配置
      Sortable.create(tbody, {
        group: "id",
        sort: true,
        delay: 0,
        store: null,
        handle: ".move-icon",
        draggable: ".draggable", // 可拖拽元素类名
        filter: ".dis-draggable", // 不可拖拽元素类名
        forceFallback: true,
        onStart: () => {
          this.status.dragging = true
        },
        onMove: evt => {
          this.data.moveToId = parseInt(evt.dragged.getAttribute("id"))
        },
        onEnd: evt => {
          this.data.moveToId = ''
          this.status.dragging = false
          // 判断到底拖动了没有
          if (evt.newIndex !== undefined && evt.newIndex !== evt.oldIndex) {
            // 移动方向
            const moveDirection = evt.oldIndex > evt.newIndex ? 1 : -1
            // 被拖拽字段ID +1加上不可拖拽元素
            const fromId = evt.to.children[evt.newIndex].getAttribute("id")
            // 目标字段ID +1 -1抵消
            let toId =
              moveDirection == -1
                ? evt.to.children[evt.newIndex - 1].getAttribute("id")
                : evt.to.children[evt.newIndex + 1].getAttribute("id")
            let param = {
              fromId: fromId,
              toId: toId,
              moveDirection: moveDirection
            }
            this.$api.structureDrag(this.$route.query, param).then(
              data => {
                this.queryList(true)
              },
              data => { }
            )
          }
        }
      })
    },

    /**
     * 调整查看列表详情
     */
    handleItemClick (item) {
      let params = {
        standardid: this.$route.query.standardid,
        groupid: this.$route.query.groupid,
        groupname: this.$route.query.groupname,
        resourceid: item.id,
        resourcename: item.resource_name,
        searchText: status.searchText || ''
      }
      this.$router.push({ path: '/model/structure/list', query: params })
    },

    /**
     * 方块卡片选中事件
     * @param {item, check, delId}
     */
    changeSelectArray (item, check) {
      if (!check) {
        this.data.selectArray.forEach((items, index) => {
          if (item === items) {
            this.data.selectArray.splice(index, 1)
          }
        })
      } else {
        this.data.selectArray.push(item)
      }
    },

    /**
     * 展示数据表属性弹窗
     * @param {item} 当前数据表
     */
    changeAttribute (item) {
      this.$dialog(attributeDialog, { path: this.$route.path , query: this.$route.query, resource: item }).then(() => {
        this.queryList()
      })
    },

    /**
     * 删除数据表
     */
    deleteResource (id) {
      this.$dialog(deleteResourceDialog, { query: this.$route.query, ids: id ? id : this.data.selectArray.join(',')}).then(() => {
        this.queryList()
      })
    },

    /**
     * 新增/编辑/相似创建数据表
     */
    editResource (action, resourceId = 0) {
      this.$dialog(editResourceDialog, { action: action, resourceId: resourceId, query: this.$route.query}).then(() => {
        this.queryList()
      })
    },

    /**
     * 导入数据表
     */
    importResource () {
      this.$dialog(loadResourceDialog, { query: this.$route.query }).then(() => {
        this.queryList()
      })
    },

    /**
     * 移动数据表
     */
    moveResource () {
      this.$dialog(moveResourceDialog, {selectedList: this.data.selectArray, query: this.$route.query}).then(data => {
        this.$router.push({
          path: "/model/structure/catalog",
          query: {
            standardid: this.$route.query.standardid,
            groupid: data.id,
            groupname: data.groupName
          }
        })
      })
    },

    /**
     * 排重规则设置
     */
    setDeDuplication (resourceId) {
      this.$dialog(setDeDuplicationDialog, {resourceId: resourceId, query: this.$route.query}).then(data => {

      })
    },

    /**
     * 默认排序规则设置
     */
     setSortRule (resourceId) {
       this.$dialog(setSortRuleDialog, {resourceId: resourceId, query: this.$route.query}).then(data => {

       })
     }
  }
}
</script>
