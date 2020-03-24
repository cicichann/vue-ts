<template>
  <el-dialog :visible.sync="visible" :close-on-click-modal="false" title="分类授权">
    <!-- 分类授权 -->
    <div v-loading="loading" element-loading-text="数据加载中..." class="app-auth-frame category-auth">
      <div class="distribute-modal clearfix">
        <div class="dialog-panel auth-panel">

          <!-- 分类检索 -->
          <div v-clickoutside="handleClose" class="panel-head">
            <el-input v-model="status.searchCatText" placeholder="请输入分类名称" @input="search" @focus="status.isResultShow = true" >
              <i slot="suffix" class="input-icon" @click="search"/>
            </el-input>
            <div v-loading="searchLoading" v-if="status.isResultShow && status.searchCatText.length > 0" class="search-result">
              <template v-if="data.resultList.some((result) => {return result.categories.length > 0})">
                <dl v-for="item in data.resultList" :key="item.standard.id">
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
            <ul v-for="category in data.categoryList" :key="category.standard.id" class="el-tree-arrow">
              <template v-if="category.categories.length > 0">
                <li :title="category.standard.standardName" :id="'standard' + category.standard.id" class="standard-title">{{ category.standard.standardName }}</li>
                <el-tree :ref="'category' + category.standard.id" :data="category.categories" :load="querySubCatList" :props="defaultProps"
                         :default-checked-keys="data.checkedCats[category.standard.id]" :check-strictly = "true" node-key="id" show-checkbox lazy
                         @check-change="updateCheckedCatList">
                  <span slot-scope="{ node, data }" :title="data.category_name" class="custom-tree-node">{{ data.category_name }}</span>
                </el-tree>
              </template>
            </ul>
          </div>
        </div>

        <!-- 已选分类列表 -->
        <div class="dialog-panel auth-panel checked-cat">
          <div class="panel-head">
            <h6>已选分类</h6>
          </div>
          <div class="panel-body">
            <ul>
              <li v-for="cat in data.checkedCatList" :key="cat" :title="cat.split('-')[2]"><i class="delete-icon" @click="removeCat(cat)"></i>{{ cat.split("-")[2] }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <span slot="footer">
      <el-button :disabled="loading" type="primary" @click="confirm">确认</el-button>
      <el-button @click="$dismiss">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'

export default {
  name: 'categoryAuthDialog',

  directives: { Clickoutside },

  props: {
    roleId: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      searchLoading: false, // 检索loading
      data: {
        categoryList: [], // 分类列表
        checkedCatList: [], // 选中的分类列表
        checkedCats: {}, // 授权分类集合，key为标准id，value为该标准下的授权分类id数组
        resultList: [] // 检索结果列表
      },
      status: {
        searchCatText: '', // 分类检索输入
        isResultShow: false // 默认隐藏检索结果面板
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

  watch: {
    'data.checkedCatList' (newValue) {
      let ele = document.querySelector('.checked-cat .panel-body')
      this.$nextTick(() => {
        if(ele) ele.scrollTop = ele.scrollHeight
        this.syncCheckedCat()
      })
    }
  },

  mounted() {
    this.queryCatList().then(() => {
      this.queryCkeckedAuthorize()
    })
    /**
     * 点击空白区域隐藏检索结果列表
     */
    document.addEventListener('click', (e) =>{
      if(e.target !== document.querySelector('.panel-head .el-input__inner')) {
        this.status.isResultShow = false
      }
    })
  },

  methods: {
    /**
     * 请求分类列表数据
     */
    queryCatList() {
      return new Promise((resolve, reject) => {
        this.loading = true
        let params = {
          standardId: '',
          parentCategoryId: 0,
          searchText: ''
        }

        this.$api.queryCatList(params).then(data => {
          data.map((item) => {
            item.categories.map((category) => {
              category.id = item.standard.id + '-' + category.id + '-' + category.category_name
            })
          })
          this.data.categoryList = data
          this.loading = false
          resolve()
        }, () => {
          this.loading = false
          reject()
        })
      })
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

      this.$api.queryCatList(params).then((data) => {
        data.map((item) => {
          item.categories.map((category) => {
            category.id = item.standard.id + '-' + category.id + '-' + category.category_name
          })
        })

        this.$set(node.data, 'children', data[0].categories)
        if(resolve) resolve(data[0].categories)
        if(checked) {
          this.$nextTick(() => {
            let idArr = this.runQueue(node.data.children, nodeArr[0])
            let checkedList = this.data.checkedCatList
            checkedList = checkedList.concat([node.data.id])
            this.data.checkedCatList = Array.from(new Set(checkedList.concat(idArr)))
          })
        }
      })
    },

    /**
     * 获取已选分类授权列表
     */
    queryCkeckedAuthorize () {
      this.loading = true
      this.data.checkedCatList = []
      let url = {
        roleId: this.roleId
      }
      let params = {
        appType: 2,
        oprType: 203,
        objType: 9002
      }
      this.$api.checkedCategories(url, params).then(data => {
        data.map((item) => {
          if(item.available === 1) {
            let checkedCat = item.pObjId + "-" + item.objId + "-" + item.categoryName
            this.data.checkedCatList.push(checkedCat)
          }
        })

        this.loading = false
      })
    },

    /**
     * 关闭检索结果
     */
    handleClose () {
      this.status.isResultShow = false
    },

    /**
     * 选择分类
     */
    updateCheckedCatList(currentNode, checked) {
      let operationCat = currentNode.id
      let nativeNode = this.$refs['category' + operationCat.split('-')[0]][0].getNode(operationCat)
      let checkedCatList = this.data.checkedCatList

      if (checked && checkedCatList.indexOf(operationCat) < 0) {
        // 勾选
        checkedCatList.push(operationCat)
        if(currentNode.hasChildren) {
          if(nativeNode.data.children.length === 0 || nativeNode.level >= 2) {
            // 非叶子节点首次请求子节点数据
            this.querySubCatList(nativeNode, (childNodes) => {
              nativeNode.childNodes = []
              this.$set(nativeNode.data, 'children', childNodes)

              this.$nextTick(() => {
                let idArr = this.runQueue(childNodes, operationCat.split('-')[0])
                this.data.checkedCatList = Array.from(new Set(checkedCatList.concat(idArr)))
                nativeNode.expanded = true
              })
            })
          } else {
            let idArr = this.runQueue(nativeNode.data.children, operationCat.split('-')[0])
            this.data.checkedCatList = Array.from(new Set(checkedCatList.concat(idArr)))
            nativeNode.expanded = true
          }
        }
      } else if(!checked && checkedCatList.indexOf(operationCat) >= 0) {
        // 取消选中
        this.removeCat(operationCat)
      }
    },

    /**
     * 移除选中分类
     */
    removeCat(cat) {
      let catArr = cat.split('-')
      let catList = this.data.checkedCatList
      let nativeNode = this.$refs['category' + cat.split('-')[0]][0].getNode(cat)
      catList.splice(catList.indexOf(cat), 1)
      if(nativeNode && nativeNode.level > 1) {
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
          } else {
            this.$refs['category' + key][0].setCheckedKeys([])
          }
        }
      })
    },

    /**
     * 隐藏弹窗
     */
    confirm () {
      this.loading = true
      let list = []
      this.data.checkedCatList.map((item) => {
        list.push({
          objType: 5010,
          objId: parseInt(item.split('-')[1]),
          pObjType: 50,
          pObjId: parseInt(item.split('-')[0])
        })
      })
      let params = {
        oprType: 203,
        oprId: this.roleId,
        objs: list
      }
      this.$api.categories(params).then(data => {
        this.$trsModalSuccess('分类授权成功！')
        this.$close()
      }, data => {
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
     * 检索
     */
    search() {
      if(this.status.searchCatText) {
        this.searchLoading = true
        this.data.resultList = []
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
          this.data.resultList = data
          this.status.isResultShow = true
          this.searchLoading = false
        }, () => {
          this.searchLoading = false
        })
      }
    },

    /**
     * 点击检索结果定位到相应分类
     */
    clickResult(data, standardId) {
      this.loading = true
      this.status.isResultShow = false
      let path = data.path.split(',')
      let nameArr = data.nav.split('/')

      path = path.map((item, index) => {
        return standardId + '-' + path[index] + '-' + nameArr[index]
      })

      let id = path[path.length - 1]

      // 清除所有树的选中节点
      this.data.categoryList.map((item) => {
        if(item.categories.length > 0) {
          this.$refs['category' + item.standard.id][0].setCurrentKey(null)
        }
      })

      if(path.length === 1) {
        this.locateCallback(standardId, id)
      } else {
        this.recursion(path, this.iterator, () => {
          this.locateCallback(standardId, id)
        })
      }
    },

    /**
     * 定位结果回调
     */
    locateCallback(standardId, id) {
      this.$refs['category' + standardId][0].setCurrentKey(id)
      this.$nextTick(() => {
        this.locateCat(standardId)
      })
    },

    /**
     * 定位到相应分类
     */
    locateCat(standardId) {
      this.loading = true
      let ele = document.querySelector('.panel-body')
      let scrollDis = document.querySelector('#standard' + standardId).offsetTop + document.querySelector('.is-current').offsetTop + 34

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
     * @param resolve
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
    }
  }
}
</script>
