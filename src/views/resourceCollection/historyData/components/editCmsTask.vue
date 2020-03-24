<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" :title="title" :custom-class="className">
    <uirb-resizable v-show="step === 1">
      <!-- 选择站点、栏目 -->
      <div v-loading="loading" element-loading-text="数据加载中..." class="clearfix">
        <div class="dialog-panel task-panel">

          <!-- 站点、栏目检索 -->
          <div v-clickoutside="handleClose" class="panel-head">
            <el-input v-model="status.searchText" :placeholder="placeholder" @input="search" @focus="status.isResultShow = true">
              <i slot="suffix" class="input-icon" @click="search"/>
            </el-input>
            <div v-loading="searchLoading" v-if="status.isResultShow && status.searchText.length > 0" class="search-result">
              <template v-if="data.resultList.some((result) => {return result.nodes.length > 0})">
                <dl v-for="item in data.resultList" :key="item.rootNode.id">
                  <template v-if="item.nodes.length > 0">
                    <dt :title="item.rootNode.name" v-text="item.rootNode.name" />
                    <dd v-for="node in item.nodes" :key="node.id" :title="node.nav"
                        @click="locateItem(node, item.rootNode.id)" v-html="node.navHighlighted"/>
                  </template>
                </dl>
              </template>
              <p v-else>暂无数据</p>
            </div>
          </div>

          <div class="panel-body">
            <template v-for="item in data.sourceList">
              <ul v-if="item.nodes.length > 0" :key="item.rootNode.id" class="el-tree-arrow">
                <li v-if="item.rootNode.desc" :title="item.rootNode.desc" :id="'node' + item.rootNode.id" class="node-title">
                  {{ item.rootNode.desc || 全选 }}
                  <el-checkbox v-model="data['standard' + item.rootNode.id]" @change="checked => checkedAllCates(checked, item)" />
                </li>
                <li v-else title="全选" class="node-title">
                  全选<el-checkbox v-model="data['standard' + item.rootNode.id]" @change="checked => checkedAllCates(checked, item)" />
                </li>
                <el-tree :ref="item.rootNode.id ? ('tree' + item.rootNode.id) : 'tree'" :data="item.nodes" :load="querySubNodeList"
                         :props="defaultProps" :default-checked-keys="data.checkedNodes[item.rootNode.id]" :check-strictly = "true"
                         node-key="id" show-checkbox lazy @check-change="updateCheckedList">
                  <span slot-scope="{ node, data }" :title="node.label" :class="{'site-title': node.level === 1}" class="custom-tree-node">
                    <i v-if="data.type === '1'" class="site-icon"></i>
                    {{ data.name }}
                  </span>
                </el-tree>
              </ul>
            </template>
          </div>
        </div>

        <!-- 已选列表 -->
        <div class="dialog-panel task-panel checked-list">
          <div class="panel-head">
            <h6>{{ checkedTitle }}<span @click="clearChecked">清空</span></h6>
            <i class="icon add-icon" @click="popoverShow = true"></i>
            <div v-if="popoverShow" class="popover">
              <textarea v-model="data.inputIds" :placeholder="popPlaceholder"></textarea>
              <i class="icon confirm-icon" @click="handleConfirm"></i>
              <i class="icon cancel-icon" @click="popoverShow = false"></i>
            </div>
          </div>
          <div class="panel-body">
            <ul>
              <li v-for="item in data.checkedList" :key="item" :class="item.split('@-@')[0] === '1' ? 'site-item' : 'channel-item'">
                <i class="delete-icon" @click="removeItem(item)"></i><i v-if="item.split('@-@')[0] === '1'" class="site-icon"></i>
                {{ item.split("@-@")[2] }}</li>
            </ul>
          </div>
        </div>

        <p class="tip">只迁移正确配置映射的数据</p>
      </div>
    </uirb-resizable>

    <!-- 填写任务名称、时间、数量 -->
    <div v-loading="loading" v-if="step === 2" element-loading-text="数据加载中...">
      <el-form ref="taskForm" :model="taskForm" :rules="taskRule" label-width="8em" label-suffix="：">
        <el-form-item class="in-input-row" label="任务名称" prop="name">
          <el-input v-model.trim="taskForm.name" placeholder="请输入任务名称"/>
        </el-form-item>

        <template v-if="isTimeStrategy">
          <el-form-item class="in-input-row" label="迁移时间策略" prop="beginTime">
            <el-date-picker v-model="taskForm.beginTime" :picker-options="beginOptions" value-format="timestamp" type="date" placeholder="请选择开始时间(发布时间)"/>
          </el-form-item>
          <el-form-item class="in-input-row" label="" prop="endTime">
            <el-date-picker v-model="taskForm.endTime" :picker-options="endOptions" value-format="timestamp" type="date" placeholder="请选择结束时间(发布时间)"/>
          </el-form-item>
        </template>

        <el-form-item class="in-input-row" label="迁移数量策略" prop="transferNum">
          <el-radio v-model="status.isNumPolicy" :label="false">不限制</el-radio>
          <el-radio v-model="status.isNumPolicy" :label="true">迁移前若干条</el-radio>
          <el-input v-if="status.isNumPolicy" v-model="taskForm.transferNum" placeholder="请输入迁移条数"/>
        </el-form-item>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <template v-if="step === 1">
        <el-button :disabled="data.checkedList.length === 0" type="primary" @click="next">下一步</el-button>
        <el-button @click="$dismiss">取 消</el-button>
      </template>
      <template v-else>
        <el-button type="primary" @click="prev">上一步</el-button>
        <el-button :disabled="loading" type="primary" @click="confirm">确 认</el-button>
      </template>
    </span>
  </el-dialog>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'
import uirbResizable from '@/views/common/resizable/index'

export default {
  name: 'editCmsTaskDialog',

  directives: { Clickoutside },

  components: { uirbResizable },

  props: {
    taskId: {
      type: Number,
      default: 0
    },
    taskIndex: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      loading: false,
      searchLoading: false, // 检索loading
      step: 1, // 默认为第一步
      data: {
        sourceList: [], // 站点、栏目数据
        checkedList: [], // 已选站点、栏目列表
        resultList: [], // 检索结果列表
        inputIds: '', // 手动填写的id
        checkedNodes: {} // 已选节点集合，key为标准id，value为该标准下的已选分类id数组
      },
      status: {
        searchText: '', // 检索输入
        isNumPolicy: false, // 是否采用数量策略
        isResultShow: false // 默认隐藏检索结果面板
      },
      taskForm: {}, // 初始化表单数据
      taskRule: {
        name: [
          { required: true, message: '请输入任务名称', trigger: ['blur', 'change'] },
          { validator: this.checkTaskName, trigger: ['blur', 'change'] }
        ],
        transferNum: [
          { validator: this.checkNumber, trigger: ['blur', 'change']}
        ]
      },
      defaultProps: {
        isDefaultCollapse: true,
        label: 'name',
        isLeaf: (data, node) => {
          return !node.data.hasChildren
        }
      },
      // 限制开始选择时间，今天或结束时间之前
      beginOptions: {
        disabledDate: (time) => {
          if (this.taskForm.endTime) {
            return time.getTime() > this.taskForm.endTime
          } else {
            return time.getTime() > Date.now()
          }
        }
      },
      // 限制结束时间，开始时间之后并且今天之前
      endOptions: {
        disabledDate: (time) => {
          return time.getTime() < this.taskForm.beginTime || time.getTime() > Date.now()
        }
      },
      isTimeStrategy: true, // 默认展示时间策略
      popoverShow: false // 默认隐藏手动添加面板
    }
  },

  computed: {
    title () {
      return this.taskId ? '编辑迁移任务' : '新增迁移任务'
    },

    className () {
      return this.step === 1 ? 'task-dialog interface-task-dialog resizable-dialog' : 'task-dialog interface-task-dialog normal-dialog'
    },

    placeholder () {
      return this.query.adapterId === 'trs-hy-http' ? '请输入站点或栏目名称' : '请输入分类名称'
    },

    checkedTitle () {
      return this.query.adapterId === 'trs-hy-http' ? '已选站点/栏目' : '已选分类'
    },

    popPlaceholder () {
      return this.query.adapterId === 'trs-hy-http' ? '请输入站点ID的值，如：siteIds=132,141' : '请输入分类ID的值，如categoryIds=64,128'
    }
  },

  watch: {
    'data.checkedList' (newValue) {
      this.$nextTick(() => {
        this.syncCheckedNode()
      })
    }
  },

  mounted () {
    this.queryNodeList().then(data => {
      if (this.taskId) {
        this.findTaskById()
      } else {
        this.initData()
      }
    })
  },

  methods: {
    /**
     * 请求站点列表
     */
    queryNodeList () {
      return new Promise((resolve, reject) => {
        this.loading = true
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }

        this.$api.queryNodes(url).then((data) => {
          data.forEach((item) => {
            item = item.nodes.map((node) => {
              return Object.assign(node, {
                type: '1',
                name: node.parentNodeDesc,
                id: `1@-@${node.parentNodeId}@-@${node.parentNodeDesc}@-@` + (item.rootNode.id ? item.rootNode.id : ``),
                hasChildren: node.hasChildren,
                parentNodeId: node.parentNodeId,
                rootNodeId: item.rootNode.id
              })
            })
          })

          this.data.sourceList = data
          this.$nextTick(() => {
            this.loading = false
          })
          resolve()
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 请求栏目列表
     */
    querySubNodeList (node, resolve) {
      if (node.level === 0) return
      let rootNodeId = node.data.rootNodeId ? node.data.rootNodeId : ''
      let flag = this.$refs['tree' + rootNodeId][0].getCheckedKeys().indexOf(node.data.id) >= 0

      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }

      let params = {
        siteId: node.data.parentNodeId,
        channelId: node.data.type === '2' ? node.data.nodeId : ''
      }

      this.$api.querySubNodes(url, params).then((data) => {
        data = data.map((item) => {
          return {
            type: '2',
            name: item.nodeDesc,
            id: `2@-@${item.nodeId}@-@${item.nodeDesc}@-@${rootNodeId}@-@${item.parentNodeId}@-@` + this.getParentNodeDesc(item.parentNodeId),
            hasChildren: item.hasChildren,
            parentNodeId: item.parentNodeId,
            nodeId: item.nodeId,
            rootNodeId: rootNodeId
          }
        })

        this.$set(node.data, 'children', data)
        resolve(data)

        if (flag) {
          this.$refs['tree' + rootNodeId][0].setCheckedKeys(this.data.checkedList.concat([node.data.id]))
        }

        this.$nextTick(() => {
          this.syncCheckedNode()
        })
      })
    },

    /**
     * 根据id获取父目录desc
     */
    getParentNodeDesc (id) {
      let name = ''
      this.data.sourceList.map((item) => {
        item.nodes.map((node) => {
          if (node.parentNodeId === id) {
            name = node.name
          }
        })
      })
      return name
    },

    /**
     * 新增初始化数据
     */
    initData () {
      this.taskForm = {
        name: '',
        tablesAndFields: [],
        sitesAndChannels: [],
        beginTime: '',
        endTime: '',
        transferNum: ''
      }
      this.queryNodeList().then(data => {
        this.queryTimeStrategy()
      })
    },

    /**
     * 编辑初始化数据
     */
    findTaskById () {
      this.queryNodeList().then(() => {
        this.queryTaskInfo()
      })
    },

    /**
     * 请求任务详情
     */
    queryTaskInfo () {
      this.loading = true
      this.data.checkedList = []

      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid,
        taskId: this.taskId
      }

      this.$api.queryTaskInfo(url).then(data => {
        this.taskForm = {
          name: data.taskName,
          tablesAndFields: [],
          sitesAndChannels: [],
          beginTime: data.beginTime ? parseInt(data.beginTime) : '',
          endTime: data.endTime ? parseInt(data.endTime) : '',
          transferNum: data.transferNum ? data.transferNum : ''
        }

        if (this.taskForm.transferNum) {
          this.status.isNumPolicy = true
        }

        JSON.parse(data.sitesAndChannels).map((item) => {
          let checkedItem = `${item.type}@-@${item.id}@-@${item.name}@-@${item.rootNodeId}` + (item.type === '2' ? `@-@${item.parentNodeId}@-@${item.parentNodeName}` : ``)
          let list = this.data.checkedList
          if (list.indexOf(checkedItem) < 0) {
            list.push(checkedItem)
          }
        })

        this.scrollToBottom()
        this.queryTimeStrategy()
        this.loading = false
      }, () => {
        this.loading = false
      })
    },

    /**
     * 检索站点、栏目
     */
    search () {
      if (this.status.searchText) {
        this.searchLoading = true
        this.data.resultList = []
        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }

        let params = {
          searchText: this.status.searchText
        }

        this.$api.searchChannelSites(url, params).then(data => {
          let text = this.status.searchText
          data.map(result => {
            result.nodes = result.nodes.map((item, index, arr) => {
              if (arr.findIndex((ele) => { return ele.nodeId === item.nodeId }) === index) {
                return Object.assign(item, {
                  navHighlighted: item.nav.replace(new RegExp(text, 'g'), '<em>' + text + '</em>')
                })
              }
            })
          })
          this.data.resultList = data
          this.status.isResultShow = true
          this.searchLoading = false
        }, () => {
          this.searchLoading = false
        })
      }
    },

    /**
     * 关闭检索结果
     */
    handleClose () {
      this.status.isResultShow = false
    },

    /**
     * 点击检索结果站点、栏目
     */
    locateItem (data, rootNodeId) {
      rootNodeId = rootNodeId ? rootNodeId : ''
      this.loading = true
      this.status.isResultShow = false
      let path = data.path.split(',')
      let id = ''

      // 清除所有树的选中节点
      this.data.sourceList.map((item) => {
        if(item.nodes.length > 0) {
          let name = item.rootNode.id ? ('tree' + item.rootNode.id) : 'tree'
          let currentNodeId = this.$refs[name][0].getCurrentKey()
          if (currentNodeId) {
            let node = this.$refs[name][0].getNode(currentNodeId)
            node.isCurrent = false
          }
        }
      })

      if (path.length === 1) {
        id = `1@-@${data.parentNodeId}@-@${data.nav}@-@${rootNodeId}`
        this.$nextTick(() => {
          this.$refs['tree' + rootNodeId][0].setCurrentKey(id)
          this.locateNode(rootNodeId)
        })
      } else {
        let nav = data.nav.split('>').map(item => {
          return item.trim()
        })
        path = path.map((item, index) => {
          return index === 0 ? `1@-@${item}@-@${nav[index]}@-@${rootNodeId}` : `2@-@${item}@-@${nav[index]}@-@${rootNodeId}@-@${path[0]}@-@${nav[0]}`
        })

        this.runQueue(path, rootNodeId, this.iterator, () => {
          this.$nextTick(() => {
            this.$refs['tree' + rootNodeId][0].setCurrentKey(path[path.length - 1])
            this.locateNode(rootNodeId)
          })
        })
      }
    },

    /**
     * 递归请求栏目节点
     */
    runQueue (queue, rootId, fn, callback) {
      const step = index => {
        if (index === queue.length - 1) {
          return callback(queue[index])
        }

        if (queue[index]) {
          fn(queue[index], rootId, () => {
            this.$nextTick(() => {
              step(index + 1)
            })
          })
        }
      }

      step(0)
    },

    /**
     * 请求栏目节点，将数据添加到children属性
     * @param id  父节点id
     * @param resolve
     */
    iterator (id, rootId, resolve) {
      let node = this.$refs[rootId ? ('tree' + rootId) : 'tree'][0].getNode(id)
      node.expanded = true

      if (node.data.hasChildren && node.childNodes.length === 0) {
        this.querySubNodeList(node, (childNodes) => {
          this.$set(node.data, 'children', childNodes)

          // 生成子节点
          childNodes.map(item => {
            this.$refs[rootId ? ('tree' + rootId) : 'tree'][0].append(item, node)
          })
          resolve()
        })
      } else {
        resolve()
      }
    },

    /**
     * 定位到点击站点
     */
    locateNode (rootNodeId) {
      this.loading = true

      this.$nextTick(() => {
        let ele = document.querySelector('.interface-task-dialog .panel-body')
        let scrollDis = (rootNodeId ? document.querySelector('#node' + rootNodeId).offsetTop : 0) + document.querySelector('.interface-task-dialog .is-current').offsetTop - 34 * 4
        ele.scrollTop = scrollDis
        this.loading = false
      })
    },

    /**
     * 选择站点、栏目
     */
    updateCheckedList (currentNode, checked) {
      let operationItem = currentNode.id
      let checkedList = this.data.checkedList

      if (checked && checkedList.indexOf(operationItem) < 0) {
        checkedList.push(operationItem)
        this.scrollToBottom()
      } else if (!checked && checkedList.indexOf(operationItem) >= 0) {
        this.removeItem(operationItem)
      }
    },

    /**
     * 移除已选站点、栏目
     */
    removeItem (item) {
      let catArr = item.split('@-@')
      let checkedList = this.data.checkedList
      checkedList.splice(checkedList.indexOf(item), 1)
      this.$set(this.data, 'standard' + catArr[3], false)
    },

    /**
     * 点击下一步
     */
    next () {
      this.step = 2
    },

    /**
     * 点击上一步
     */
    prev () {
      this.step = 1
    },

    /**
     * 任务名称校验
     */
    checkTaskName (rule, value, callback) {
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }

      let params = {
        taskName: this.taskForm.name,
        checkDuplicatedTaskId: this.taskId
      }

      this.$api.verifyTaskName(url, params).then((data) => {
        if (data.isDuplicate === 'true') {
          callback(new Error(data.msg))
        } else {
          callback()
        }
      })
    },

    /**
     * 任务数量校验
     */
    checkNumber (rule, value, callback) {
      let numberReg = /^\d+$/
      if(value && !numberReg.test(value)) {
        callback(new Error('请输入有效数字值'))
      } else {
        callback()
      }
    },

    /**
     * 新增任务
     */
    addTask (url, params) {
      this.loading = true
      this.$api.addTask(url, params).then(data => {
        this.$trsModalSuccess('新增任务成功！')
        this.$close()
      }, err => {
        this.loading = false
      })
    },

    /**
     * 编辑任务
     */
    editTask (url, params) {
      this.loading = true
      url.taskId = this.taskId
      this.$api.editTask(url, params).then(data => {
        this.$trsModalSuccess('编辑任务成功！')
        this.$close(this.taskIndex)
      }, err => {
        this.loading = false
      })
    },

    /**
     * 点击确认按钮
     */
    confirm () {
      this.$refs.taskForm.validate().then(() => {
        this.loading = true
        this.taskForm.sitesAndChannels = []
        this.data.checkedList.map((item) => {
          let itemArr = item.split('@-@')
          let list = this.taskForm.sitesAndChannels
          let siteChannel = {
            id: itemArr[1],
            type: itemArr[0],
            name: itemArr[2],
            rootNodeId: itemArr[3]
          }
          if (itemArr[0] === '2') {
            siteChannel = Object.assign(siteChannel, {
              parentNodeId: itemArr[4],
              parentNodeName: itemArr[5]
            })
          }
          list.push(siteChannel)
        })

        let url = {
          standardId: this.query.standardid,
          datasourceId: this.query.datasourceid
        }
        let formData = new FormData();
        formData.append('taskName', this.taskForm.name)
        formData.append('tablesAndFields', this.taskForm.tablesAndFields)
        formData.append('sitesAndChannels', JSON.stringify(this.taskForm.sitesAndChannels))
        formData.append('beginTime', this.taskForm.beginTime ? this.taskForm.beginTime : '')
        formData.append('endTime', this.taskForm.endTime ? this.taskForm.endTime + 86399000 : '')
        formData.append('transferNum', this.status.isNumPolicy ? this.taskForm.transferNum : '')
        this.taskId ? this.editTask(url, formData) : this.addTask(url, formData)
      }, () => {
        this.loading = false
      })
    },

    /**
     * 查询是否需要时间策略
     */
    queryTimeStrategy () {
      let url = {
        standardId: this.query.standardid,
        datasourceId: this.query.datasourceid
      }

      this.$api.queryTimeStrategy(url).then(data => {
        this.isTimeStrategy = data
      })
    },

    /**
     * 点击手动填写面板的确认按钮
     */
    handleConfirm () {
      let input = this.data.inputIds
      if (input.trim() && input.indexOf('=') >= 0) {
        let ids = input.split('=')[1].replace(/，/g, ',').split(',')
        ids.map((item) => {
          let node = {}
          this.data.sourceList.map(ele => {
            node = Object.assign(node, ele.nodes.find(node => {
              return node.parentNodeId === item.trim()
            }))
          })
          if (node.id) {
            let checkedItem = node.id
            let list = this.data.checkedList
            if (list.indexOf(checkedItem) < 0) {
              list.push(checkedItem)
            }
          }
        })

        this.scrollToBottom()
      }
      this.data.inputIds = ''
      this.popoverShow = false
    },

    /**
     * 定位到已选列表底部
     */
    scrollToBottom () {
      let ele = document.querySelector('.interface-task-dialog .checked-list .panel-body')
      this.$nextTick(() => {
        ele.scrollTop = ele.scrollHeight
      })
    },

    /**
     * 同步已选分类到树组件
     */
    syncCheckedNode() {
      let checkedNodes = {}
      let checkedList = this.data.checkedList
      checkedList.map((item) => {
        let catArr = item.split('@-@')

        if(!checkedNodes[catArr[3]]) {
          checkedNodes[catArr[3]] = []
        }
        checkedNodes[catArr[3]].push(item)
      })
      this.data.checkedNodes = checkedNodes

      // 包含已授权分类的标准树写入数据，否则置空
      this.data.sourceList.map((item) => {
        if(item.nodes.length > 0) {
          let key = item.rootNode.id
          if(key in checkedNodes) {
            this.$refs['tree' + key][0].setCheckedKeys(checkedNodes[key])
            this.checkStandard(key, checkedNodes[key])
          } else {
            this.$refs['tree' + key][0].setCheckedKeys([])
            this.$set(this.data, 'standard' + key, false)
          }
        }
      })
    },

    /**
     * 全选标准下分类
     */
    checkedAllCates (val, item) {
      if (val) {
        item.nodes.map(node => {
          let nodeId = `1@-@${node.parentNodeId}@-@${node.parentNodeDesc}@-@` + (item.rootNode.id ? item.rootNode.id : ``)
          if (this.data.checkedList.indexOf(nodeId) < 0) this.data.checkedList.push(nodeId)
        })
        this.scrollToBottom()
      } else {
        let list = this.data.checkedNodes[item.rootNode.id]
        this.data.checkedList = this.data.checkedList.filter(id => {
          return list.indexOf(id) < 0
        })
        this.$refs['tree' + item.rootNode.id][0].setCheckedKeys([])
      }
    },

    /**
     * 标准下所有分类均选中，标准复选框勾选
     */
    checkStandard (id, list) {
      let standard = this.data.sourceList.find(item => { return item.rootNode.id === id})
      let checkedCates = standard.nodes.filter(cate => {
        return list.indexOf(cate.id) < 0
      })
      if (checkedCates.length === 0) this.$set(this.data, 'standard' + id, true)
    },

    /**
     * 清空已选
     */
    clearChecked () {
      this.data.checkedList = []
    }
  }
}
</script>

<style lang="scss">
.interface-task-dialog {
  .node-title {
    color: #A9ADB2;
    font-size: 13px;
  }

  .search-result {
    right: 0;
    width: auto;
  }

  .dialog-panel {
    position: absolute;
    bottom: 30px;
    top: 0;
    height: auto;
    width: calc(50% - 40px);
  }

  .dialog-panel:first-child {
    left: 30px;
  }

  .panel-head .el-input {
    width: 100%;
  }

  .checked-list {
    right: 30px;
  }
}

.interface-task-dialog.normal-dialog {
  width: 520px !important;
  height: auto !important;
}
</style>

