<template>
  <div class="main-container app-auth">
    <!-- 左侧导航 -->
    <div class="side-bar">
      <div class="nav-menu">
        <h4 class="title">应用（<span>{{ data.appCount }}</span>）</h4>

        <!-- 应用检索 -->
        <el-input v-model="status.searchText" class="search-input" placeholder="请输入应用名称" @keyup.enter.native="queryList">
          <i slot="suffix" class="input-icon" @click="queryList"/>
        </el-input>

        <!-- 应用列表 -->
        <ul>
          <li v-for="(app, index) in data.appList" :class="{'is-active': data.currentAppId === app.appID, 'last-item': index > 6 && index === data.appList.length - 1}"
              :key="app.appID" :title="app.appName" class="nav-item">
            <router-link :to="{ query: { appid: app.appID, appname: app.appName } }">{{ app.appName }}</router-link>
            <i v-access="'sysconf.appauth.viewapp'" class="nav-more view-icon" title="查看应用详情" @click.stop="viewInfo(app)"/>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="content-container">
      <div v-loading="loading" element-loading-text="数据加载中..." class="main-content">

        <!-- 选项卡 -->
        <div class="app-tab">
          <ul>
            <li class="active">分类授权</li>
          </ul>
        </div>

        <!-- 分类授权 -->
        <div v-if="!noData" class="app-auth-frame">
          <div class="clearfix">
            <div class="auth-panel cat-list">

              <!-- 分类检索 -->
              <div v-clickoutside="handleClose" class="panel-head">
                <input v-show="false" type="password" autocomplete="new-password">
                <el-input v-model="status.searchCatText" placeholder="请输入分类名称" @input="search" @focus="status.isCatResultShow = true">
                  <i slot="suffix" class="input-icon" @click="search"/>
                </el-input>
                <div v-loading="searchLoading" v-if="status.isCatResultShow && status.searchCatText.length > 0" class="search-result">
                  <template v-if="data.catResultList.some((result) => {return result.categories.length > 0})">
                    <dl v-for="item in data.catResultList" :key="item.standard.id">
                      <template v-if="item.categories.length > 0">
                        <dt :title="item.standard.name" v-text="item.standard.name" />
                        <dd v-for="category in item.categories" :key="category.id" :title="category.nav"
                            @click="clickResult(category, item.standard.id)" v-html="category.navHighlighted"/>
                      </template>
                    </dl>
                  </template>
                  <p v-else>暂无数据</p>
                </div>
              </div>

              <div class="panel-body">
                <template v-for="category in data.categoryList">
                  <ul v-if="category.categories.length > 0" :key="category.standard.id" class="el-tree-arrow">
                    <li :title="category.standard.standardName" :id="'standard' + category.standard.id" class="standard-title">
                      {{ category.standard.standardName }}
                      <el-checkbox v-model="data['standard' + category.standard.id]" @change="checked => checkedAllCates(checked, category)" />
                    </li>
                    <el-tree :ref="'category' + category.standard.id" :data="category.categories" :load="querySubCatList"
                             :props="defaultProps" :check-strictly = "true"
                             node-key="id" show-checkbox lazy @check-change="updateCheckedCatList">
                      <span slot-scope="{ node, data }" :title="data.category_name" class="custom-tree-node">{{ data.category_name }}</span>
                    </el-tree>
                  </ul>
                </template>
              </div>
            </div>

            <!-- 已选分类列表 -->
            <div class="auth-panel checked-cat">
              <div class="panel-head">
                <h6>已选分类<span @click="clearChecked">清空</span></h6>
              </div>
              <div class="panel-body">
                <ul>
                  <li v-for="(cat, index) in data.checkedCatList" :key="index" :title="cat.split('-')[2]">
                    <i :class="{'disabled-icon': !$checkRight('sysconf.appauth.saveauth')}" class="delete-icon" @click="removeCat(cat)"></i>{{ cat.split("-")[2] }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="app-auth-btns">
            <el-button v-access="'sysconf.appauth.saveauth'" :disabled="isDisabled" type="primary" @click="saveCat">保存</el-button>
          </div>
        </div>

        <!-- 暂无数据 -->
        <div v-show="noData" class="app-auth-frame uirb-no-data"></div>
      </div>

      <!-- 版本号 -->
      <edition/>
    </div>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'
import edition from '@/views/common/footer/footer.vue'
import appDetailDialog from '@/views/resourceCollection/appManage/components/appDetail.vue'

export default {
  name: 'AppAuth',

  directives: { Clickoutside },

  components: {
    edition
  },

  data() {
    return {
      loading: false,
      searchLoading: false, // 检索loading
      hasSaved: false, // 默认为未保存状态
      hasChanged: false, // 默认为未编辑状态
      noData: false, //暂无数据
      status: {
        searchText: '', // 应用检索输入
        searchCatText: '', // 分类检索输入
        isCatResultShow: false // 默认隐藏检索结果面板
      },
      data: {
        appCount: 0, // 应用数量
        appList: [], // 应用列表
        currentAppId: '', // 当前激活应用Id
        operationApp: {}, // 当前操作应用
        categoryList: [], // 分类列表
        checkedCatList: [], // 选中的分类列表
        authList: {
          resources: [],
          categories: []
        }, // 应用授权信息列表
        checkedCats: {}, // 授权分类集合，key为标准id，value为该标准下的授权分类id数组
        catResultList: [], // 检索分类结果列表
        app: {
          appName: ''
        }
      },
      defaultProps: {
        isDefaultCollapse: true,
        label: 'category_name',
        isLeaf: (data, node) => {
          return node.data.hasChildren === 0
        }
      }
    }
  },

  computed: {
    //按钮可用状态
    isDisabled() {
      return !this.hasChanged
    }
  },

  watch: {
    'data.checkedCatList' (newValue, oldValue) {
      this.hasSaved = false
      this.hasChanged = false

      if(newValue.toString() !== this.data.authList.categories.toString()) {
        this.hasChanged = true
      }

      this.$nextTick(() => {
        this.syncCheckedCat()
      })
    },

    '$route.query.appid' (newValue) {
      if (newValue) {
        this.data.currentAppId = newValue
        this.showCatPanel()
      }
    }
  },

  mounted() {
    this.queryList().then(() => {
      if (this.$route.query.appid) { 
        this.data.currentAppId = parseInt(this.$route.query.appid)
        this.showCatPanel()
      }
    })
  },

  methods: {
    /**
     * 请求左侧导航数据
     */
    queryList() {
      this.loading = true
      let params = {
        searchText: this.status.searchText
      }
      return new Promise((resolve,reject) => {
        this.$api.queryAppList(params).then((data) => {
          this.data.appList = data
          this.data.appCount = data.length

          if(this.data.appCount > 0) {
            this.data.currentAppId = data[0].appID
            this.$router.push({ query: { appid: data[0].appID, appname: data[0].appName }})
            this.noData = false
          } else {
            this.$router.push({ query: {}})
            this.noData = true
          }
          resolve()
          this.loading = false
        }, err => {
          this.loading = false
        })
      })
    },

    /**
     * 请求分类列表数据
     */
    queryCatList(standardId, categoryId) {
      this.loading = true

      let params = {
        standardId: standardId || '',
        parentCategoryId: categoryId || 0,
        searchText: ''
      }
      let _this = this
      if(this.data.currentAppId) {
        this.$api.queryCatList(params).then(data => {
          data.map((item) => {
            item.categories.map((category) => {
              category.id = item.standard.id + '-' + category.id + '-' + category.category_name
              category.disabled = !_this.$checkRight('sysconf.appauth.saveauth')
            })

            this.$set(this.data, 'standard' + item.standard.id, false)
          })
          this.data.categoryList = data
          this.queryAuthList()
        })
      }
    },

    /**
     * 请求子分类数据
     */
    querySubCatList(node, resolve) {
      if(node.level === 0) {
        resolve(node.data)
      }

      if(!node.level) return
      let nodeArr = node.data.id.split('-')
      let checked = node.checked

      let params = {
        standardId: nodeArr[0],
        parentCategoryId: nodeArr[1],
        containsChildren: 1,
        searchText: ''
      }
      let _this = this

      this.$api.queryCatList(params).then((data) => {
        data.map((item) => {
          item.categories.map((category) => {
            category.id = item.standard.id + '-' + category.id + '-' + category.category_name
            category.disabled = !_this.$checkRight('sysconf.appauth.saveauth')
          })
        })

        this.$set(node.data, 'children', data[0].categories)
        resolve(data[0].categories)
        if(checked) {
          this.$nextTick(() => {
            let idArr = this.runQueue(node.data.children, nodeArr[0])
            let checkedList = this.data.checkedCatList
            checkedList.push(node.data.id)
            this.data.checkedCatList = Array.from(new Set(checkedList.concat(idArr)))
          })
        }
      })
    },

    /**
     * 请求应用授权详情
     */
    queryAuthList() {
      this.loading = true
      this.data.authList = {
        resources: [],
        categories: []
      }
      this.data.checkedCatList = []
      this.data.checkedResList = []

      let params = {
        id: this.data.currentAppId
      }

      this.$api.queryAppAuth(params).then(data => {
        data.resources.map((item) => {
          let checkedRes = item.standardId + "-" + item.resourceId + '-' + item.resourceName
          this.data.checkedResList.push(checkedRes)
          this.data.authList.resources.push(checkedRes)
        })
        data.categories.map((item) => {
          let checkedCat = item.standardId + "-" + item.categorieId + "-" + item.categorieName
          this.data.checkedCatList.push(checkedCat)
          this.data.authList.categories.push(checkedCat)
        })

        this.$nextTick(() => {
          this.syncCheckedCat()
          this.scrollToBottom()
          this.loading = false
        })
      }, err => {
        this.loading = false
      })
    },

    /**
     * 查看应用详情
     */
    viewInfo(app) {
      this.operationApp = app
      this.$dialog(appDetailDialog, {appId: app.appID})
    },

    /**
     * 初始化面板
     */
    initPanel() {
      let eles = document.querySelectorAll('.panel-body')

      this.hasChanged = false
      this.hasSaved = false
      this.$nextTick(() => {
        eles.forEach((ele) => {
          ele.scrollTop = 0
        })
      })
    },

    /**
     * 显示分类授权面板
     */
    showCatPanel(appid) {
      this.status.searchCatText = ''
      this.data.currentAppId = appid || this.data.currentAppId
      this.data.checkedCatList = []
      this.data.checkedCats = {}
      this.initPanel()
      this.queryCatList()
    },

    /**
     * 选择分类
     */
    updateCheckedCatList(currentNode, checked) {
      let operationCat = currentNode.id
      let checkedCatList = this.data.checkedCatList

      if (checked && checkedCatList.indexOf(operationCat) < 0) {
        // 勾选
        this.checkCate(operationCat)
      } else if(!checked && checkedCatList.indexOf(operationCat) >= 0) {
        // 取消选中
        this.removeCat(operationCat)
      }
    },

    /**
     * 添加选中分类
     */
    checkCate (cat) {
      let catArr = cat.split('-')
      let catList = this.data.checkedCatList
      let nativeNode = this.$refs['category' + catArr[0]][0].getNode(cat)
      catList.push(cat)
      if(nativeNode.data.hasChildren) {
        if(nativeNode.data.children.length === 0 || nativeNode.level >= 2) {
          // 非叶子节点首次请求子节点数据
          this.loading = true
          this.querySubCatList(nativeNode, (childNodes) => {
            nativeNode.childNodes = []
            this.$set(nativeNode.data, 'children', childNodes)

            let idArr = this.runQueue(childNodes, catArr[0])
            this.data.checkedCatList = Array.from(new Set(catList.concat(idArr)))
            // nativeNode.expanded = true
            this.loading = false
          })
        } else {
          let idArr = this.runQueue(nativeNode.data.children, catArr[0])
          this.data.checkedCatList = Array.from(new Set(catList.concat(idArr)))
          // nativeNode.expanded = true
        }
      }

      this.$nextTick(() => {
        this.scrollToBottom()
      })

      this.checkStandard(catArr[0], this.data.checkedCatList)
    },

    /**
     * 标准下所有分类均选中，标准复选框勾选
     */
    checkStandard (id, list) {
      let standard = this.data.categoryList.find(item => { return item.standard.id === +id})
      let checkedCates = standard.categories.filter(cate => {
        return list.indexOf(cate.id) < 0
      })
      if (checkedCates.length === 0) this.$set(this.data, 'standard' + id, true)
    },

    /**
     * 移除选中分类
     */
    removeCat(cat) {
      // 无保存权限时，不可修改
      if (!this.$checkRight('sysconf.appauth.saveauth')) return

      let catArr = cat.split('-')
      let catList = this.data.checkedCatList
      let nativeNode = this.$refs['category' + catArr[0]][0].getNode(cat)
      catList.splice(catList.indexOf(cat), 1)
      this.$set(this.data, 'standard' + catArr[0], false)

      if (!nativeNode) return

      if(nativeNode.level > 1) {
        nativeNode.parent.checked = false
        nativeNode.parent.indeterminate = true
      }

      if(!nativeNode.isLeaf && !nativeNode.indeterminate) {
        // 非叶子节点所有子节点一并移除
        if(nativeNode.data.children && nativeNode.data.children.length !== 0) {
          // 已请求子节点数据可直接移除
          let idArr = this.runQueue(nativeNode.data.children, catArr[0])
          this.data.checkedCatList = catList.filter((id) => {
            return idArr.indexOf(id) < 0
          })
        } else {
          // 初次请求子节点数据
          this.loading = true
          let params = {
            standardId: catArr[0],
            parentCategoryId: catArr[1],
            containsChildren: 1,
            searchText: ''
          }

          this.$api.queryCatList(params).then((data) => {
            data[0].categories.map((category) => {
              category.id = data[0].standard.id + '-' + category.id + '-' + category.category_name
            })

            let idArr = this.runQueue(data[0].categories, catArr[0])
            this.data.checkedCatList = catList.filter((id) => {
              return idArr.indexOf(id) < 0
            })
            this.loading = false
          })
        }
      }
    },

    /**
     * 同步已选分类到树组件
     */
    syncCheckedCat() {
      // 将已选分类数据序列化为授权集合
      let checkedCats = {}
      let checkedList = this.data.checkedCatList
      checkedList.map((cat) => {
        let catArr = cat.split('-')

        if(!checkedCats[catArr[0]]) {
          checkedCats[catArr[0]] = []
        }
        checkedCats[catArr[0]].push(cat)
      })
      this.data.checkedCats = checkedCats

      // 包含已授权分类的标准树写入数据，否则置空
      this.data.categoryList.map((category) => {
        if(category.categories.length > 0) {
          let key = category.standard.id
          if(key in checkedCats) {
            this.$refs['category' + key][0].setCheckedKeys(checkedCats[key])
            this.checkStandard(key, checkedCats[key])
          } else {
            this.$refs['category' + key][0].setCheckedKeys([])
            this.$set(this.data, 'standard' + key, false)
          }
        }
      })
    },

    /**
     * 保存分类授权
     */
    saveCat() {
      this.loading = true
      let authInfos = []

      this.data.checkedCatList.forEach((item) => {
        let arr = item.split('-')
        authInfos.push({
          standardId: parseInt(arr[0]),
          categorieId: parseInt(arr[1]),
          grantType: 1
        })
      })

      let params = {
        appId: this.data.currentAppId,
        grantType: 1,
        authInfos: authInfos
      }

      this.$api.saveAppAuth(params).then(data => {
        this.hasSaved = true
        this.hasChanged = false
        this.$trsModalSuccess('保存分类授权成功！')
        this.$emit('update:visible', false)
        this.queryAuthList()
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * 递归
     */
    runQueue(data, standardId) {
      let resultArr = []
      let loopFunc = function(data) {
        data.map((item) => {
          resultArr.push(item.id.toString().indexOf('-') >= 0 ? item.id : (standardId + '-' + item.id + '-' + item.category_name))
          if(item.hasChildren && item.children.length > 0) {
            loopFunc(item.children)
          }
        })
      }

      loopFunc(data)
      return resultArr
    },

    /**
     * 检索分类
     */
    search() {
      if(this.status.searchCatText) {
        this.searchLoading = true
        this.data.catResultList = []
        let params = {
          searchText: this.status.searchCatText,
          pageIndex: 1,
          pageSize: 10
        }
        this.$api.cateFuzzySearch(params).then(data => {
          let text = this.status.searchCatText
          data.map((item) => {
            item.categories.map((category) => {
              category.navHighlighted = category.nav.replace(new RegExp(text, 'g'), '<em>' + text + '</em>')
            })
          })
          this.data.catResultList = data
          this.status.isCatResultShow = true
          this.searchLoading = false
        }, () => {
          this.searchLoading = false
        })
      }
    },

    /**
     * 隐藏检索结果面板
     */
    handleClose () {
      this.status.isCatResultShow = false
    },

    /**
     * 点击检索结果定位到相应分类
     */
    clickResult(data, standardId) {
      this.loading = true
      this.status.isCatResultShow = false
      let path = data.path.split(',')
      let nameArr = data.nav.split('/')

      path = path.map((item, index) => {
        return standardId + '-' + path[index] + '-' + nameArr[index]
      })

      // 清除所有树的选中节点
      this.data.categoryList.map((item) => {
        if(item.categories.length > 0) {
          let currentNodeId = this.$refs['category' + item.standard.id][0].getCurrentKey()
          if (currentNodeId) {
            let node = this.$refs['category' + item.standard.id][0].getNode(currentNodeId)
            node.isCurrent = false
          }
        }
      })

      if(path.length === 1) {
        this.$refs['category' + standardId][0].setCurrentKey(path[0])
        this.$nextTick(() => {
          this.locateCat(standardId)
        })
      } else {
        this.recursion(path, this.iterator, () => {
          this.$refs['category' + standardId][0].setCurrentKey(path[path.length - 1])
          this.$nextTick(() => {
            this.locateCat(standardId)
          })
        })
      }
    },

    /**
     * 定位到相应分类
     */
    locateCat(standardId) {
      this.loading = true
      let ele = document.querySelector('.cat-list .panel-body')
      let scrollDis = document.querySelector('#standard' + standardId).offsetTop + document.querySelector('.is-current').offsetTop - 34 * 4

      ele.scrollTop = scrollDis
      this.loading = false
    },

    /**
     * 递归请求栏目节点
     */
    recursion(queue, fn, callback) {
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
     * 请求栏目节点，将数据添加到children属性
     * @param id  父节点id
     */
    iterator(id, resolve) {
      let nodeArr = id.split('-')
      let node = this.$refs['category' + nodeArr[0]][0].getNode(id)
      node.expanded = true
      node.childNodes = []

      if (node.data.hasChildren && node.childNodes.length === 0) {
        this.querySubCatList(node, (childNodes) => {
          this.$set(node.data, 'children', childNodes)
          resolve()
        })
      } else {
        resolve()
      }
    },

    /**
     * 定位到已选列表底部
     */
    scrollToBottom () {
      let ele = document.querySelector('.checked-cat .panel-body')
      ele.scrollTop = ele.scrollHeight
    },

    /**
     * 全选标准下分类
     */
    checkedAllCates (val, category) {
      if (val) {
        category.categories.map(cate => {
          this.checkCate(cate.id)
        })
      } else {
        let list = this.data.checkedCats[category.standard.id]
        this.data.checkedCatList = this.data.checkedCatList.filter(id => {
          return list.indexOf(id) < 0
        })
        this.$refs['category' + category.standard.id][0].setCheckedKeys([])
      }
    },

    /**
     * 清空已选
     */
    clearChecked () {
      this.data.checkedCatList = []
    }
  }
}
</script>
