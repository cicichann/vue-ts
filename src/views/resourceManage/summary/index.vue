<template>
  <div v-loading="loading" class="resource-summary" element-loading-text="数据加载中...">
    <!--数据管理概览页面头部切换 -->
    <div v-if="standardList.length > 0 || loading" style="margin-top:20px">
      <div class="summary-header clearfix">
        <trs-scroll-flip :items="standardList">
          <ul id="summary-tabs" class="summary-tabs clearfix">
            <li
              v-for="item in standardList"
              :class="{'is-active':isSelected == item.id}"
              :key="item.id"
              :title="item.name"
              class="summary-item"
              @click="selectedStand(item)">{{ item.name }}
            <!-- <span v-if="isSelected != item.id" class="right-line"></span> -->
            </li>
          </ul>
        </trs-scroll-flip>
      </div>

      <div class="loading-box">
        <!-- 数据概览统计 -->
        <div class="summary-count">
          <ul style="display: flex">
            <li class="all-counts fl">
              <p class="count-num">{{ getCounts }}</p>
              <p class="count-desc">数据总入库条数</p>
            </li>
            <li class="today-counts fl">
              <p class="count-num">{{ todayCounts }}</p>
              <p class="count-desc">数据今日入库数</p>
            </li>
            <li class="resource-counts fl">
              <p class="count-num">{{ allCounts }}</p>
              <p class="count-desc">数据表总数</p>
            </li>
            <li class="change-counts fl">
              <p class="count-num">{{ beGetCounts }}</p>
              <p class="count-desc">数据被调用总次数</p>
            </li>
          </ul>
        </div>
        <!-- 走势图、数据分布、排行榜 -->
        <div class="summary-detail">
          <ul class="flex-ul">
            <li v-if="datas.length != 0" class="detail-item">
              <data-trend :data="datas" @requestData="toggleMenu"></data-trend>
            </li>
            <li v-if="distritData.length != 0" class="detail-item">
              <distribution :data="distritData"></distribution>
            </li>
            <li v-if="changeDatas.length != 0" class="detail-item">
              <change-trend :data="changeDatas" @requestChaData = "toggleChaMenu"></change-trend>
            </li>
            <li class="detail-item">
              <div class="counts-rank">
                数据调用次数排行榜
              </div>
              <ul v-if="rankData && rankData.length != 0">
                <li v-for="(rank,index) in rankData" :key="index" class="rank-item clearfix">
                  <span :class="{'top-three':index<3}" class="rank-num">{{ index+1 }}</span>
                  <span class="rank-title">{{ rank.title }}</span>
                  <span class="rank-counts fr">{{ rank.count }}</span>
                </li>
              </ul>
              <div v-if="rankData && rankData.length === 0" class="no-rank-data">暂无数据被调用</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 暂无标准情况 -->
    <div v-else class="uirb-no-data-img">
      <p class="no-data-tip">暂无可见标准</p>
    </div>

    <editionFooter :bottom="true"></editionFooter>
  </div>
</template>

<script>
import dataTrend from "./components/trend.vue"
import changeTrend from "./components/changeTrend.vue"
import distribution from "./components/distribution.vue"
import editionFooter from "@/views/common/footer/footer.vue"
import trsScrollFlip from "@/views/common/scrollFlip/index"
import { getStandard } from '@/utils/index'

export default {
  name: "resource-manage-summary",

  components: {
    dataTrend,
    changeTrend,
    distribution,
    editionFooter,
    trsScrollFlip
  },

  data() {
    return {
      isSelected: "",
      loading: true, // loading样式
      curTrendSelect: "week", //当前选中的入库的时间下拉项
      curTChaRendSelect: "week", // 当前选中的调用的时间下拉项
      getCounts: "", // 数据总入库条数
      todayCounts: "", // 数据今日入库数
      allCounts: "", // 数据表总数
      beGetCounts: "", // 数据被调用总次数
      standardList: [], // 标准数组
      rankData: null, // 数据调用次数排行榜数据
      datas: [], // 数据入库走势图数据
      changeDatas: [], // 数据调用情况走势
      distritData: [] // 数据类型分布数据
    }
  },

  mounted() {
    this.switchStandard()
  },

  methods: {
    /**
     * 查询标准列表
     */
    queryStandardList() {
      return new Promise((resolve, reject) => {
        this.$api.queryAuthStandardList().then(data => {
          if (!data.length) resolve(false)
          else {
            this.standardList = data
            getStandard(data).then(standard => {
              this.isSelected = standard.id
            })
            // this.isSelected = this.standardList[0].id
            resolve(true)
          }
        })
      })
    },

    /**
     * @description 初始化数据
     */
    initData() {
      this.getCountsFun()
      this.getTodayCounts()
      this.getAllCounts()
      this.getBeGetCounts()
      this.getDatas(this.curTrendSelect)
      this.getDistritData()
      this.getChangeDatas(this.curTChaRendSelect)
      this.getRankData()
    },

    /**
     * @description 获取数据总入库条数
     */
    getCountsFun() {
      let params = {
        id: this.isSelected,
        type: 1
      }
      this.$api.getDataAllcounts(params).then(data => {
        let counts = data.data.count
        this.getCounts = this.getNums(counts)
      })
    },

    /**
     * @description 获取今日入库数
     */
    getTodayCounts() {
      let params = {
        id: this.isSelected,
        type: 1,
        beginDateTime: new Date(
          new Date(
            new Date()
              .toLocaleDateString()
              .replace(/[\u4E00-\u9FA5]/g, "/")
              .replace(/\/$/g, "")
              .replace(/[\u200E]/g, "")
          ).getTime()
        ).valueOf(),
        endDateTime: new Date(
          new Date(
            new Date()
              .toLocaleDateString()
              .replace(/[\u4E00-\u9FA5]/g, "/")
              .replace(/\/$/g, "")
              .replace(/[\u200E]/g, "")
          ).getTime() +
            24 * 60 * 60 * 1000 - 1
        ).valueOf()
      }
      this.$api.getDataAllcounts(params).then(data => {
        let counts = data.data.count
        this.todayCounts = this.getNums(counts)
      })
    },

    /**
     * @description 获取数据表总数
     */
    getAllCounts() {
      let params = {
        id: this.isSelected
      }
      this.$api.getAllResource(params).then(data => {
        let allCounts = data.data.count
        this.allCounts = this.getNums(allCounts)
      })
    },

    /**
     * @description 获取被调用次数
     */
    getBeGetCounts() {
      let params = {
        id: this.isSelected,
        type: 2
      }
      this.$api.getDataAllcounts(params).then(data => {
        let counts = data.data.count
        this.beGetCounts = this.getNums(counts)
      })
    },

    /**
     * @description 获取数据调用次数排行榜数据
     */
    getRankData() {
      this.loading = true
      const params = {
        standardId: this.isSelected
      }
      this.$api.getDataCallRank(params).then(data => {
        let rankData = data
        for (var i = 0; i < rankData.length; i++) {
          rankData[i].count = this.getNums(rankData[i].count)
        }
        this.rankData = rankData
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * @description 获取数据入库走势图数据
     */
    getDatas(val) {
      this.loading = true
      const params = {
        standardId: this.isSelected,
        time: val ? val : "week",
        type: 1
      }
      this.$api.getDataTrend(params).then(data => {
        this.datas = data.data
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * @description 获取数据调用情况走势图数据
     */
    getChangeDatas(val) {
      this.loading = true
      const params = {
        standardId: this.isSelected,
        time: val ? val : "week",
        type: 2
      }
      this.$api.getDataTrend(params).then(data => {
        this.changeDatas = data.data
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * @description 获取数据类型分布
     */
    getDistritData() {
      this.loading = true
      const params = {
        standardId: this.isSelected
      }
      this.$api.getDataTypeDistrib(params).then(data => {
        this.distritData = data.data
        this.loading = false
      }, err => {
        this.loading = false
      })
    },

    /**
     * @description 数据入库走势图下拉切换
     */
    toggleMenu(val) {
      this.getDatas(val)
      this.curTrendSelect = val
    },

    /**
     * @description 数据调用情况走势图下拉切换
     */
    toggleChaMenu(val) {
      this.getChangeDatas(val)
      this.curTChaRendSelect = val
    },

    /**
     * @description 选中标准
     */
    selectedStand(item) {
      this.isSelected = item.id
      localStorage.setItem('standard-' + localStorage.curUser, JSON.stringify(item))
      this.initData()
    },

    /**
     *@description 三位分节法
     */
    getNums(num) {
      return parseFloat(num).toLocaleString()
    },

    /**
     * 请求初始化数据
     */
    switchStandard() {
      this.loading = true
      this.queryStandardList().then((data) => {
        this.loading = false
        if (data) {
          this.initData()
        }
      }, err => {
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss"></style>
