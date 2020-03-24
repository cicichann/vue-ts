<template>
  <div v-loading="loading" class="uirb-preview-content uirb-edit-history" element-loading-text="数据加载中...">
    <!-- 标题 -->
    <div v-if="versions && versions[0]" class="title-section">
      <h1 class="content-title">{{ versions[versions.length - 1].title }}</h1>
      <div class="sub">
        <span>创建人：{{ versions[versions.length - 1].createUser }}</span>
        <span>创建时间：{{ formatDate(versions[versions.length - 1].createTime) }}</span>
      </div>
    </div>

    <div class="bigface-result">
      <!-- 操作人记录 -->
      <div class="opr-user">
        <ul v-html="userHtml"></ul>
      </div>

      <!-- 对比结果 -->
      <div v-html="html"></div>
    </div>

    <!-- 时间轴 -->
    <div class="time-axis">
      <div style="position: relative;">
        <div v-for="log in oprLogs" :key="log.oprTime + Math.random()">
          <p class="log">{{ log.oprTime }}</p>

          <div v-for="opr in log.oprArr" :key="opr.time + Math.random()" class="operation">
            <p :title="opr.name" class="log-user">{{ opr.name }}</p>
            <span class="log-time">{{ opr.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import fecha from 'fecha'
import bigface from '@/lib/bigface/bigface.js'
import diffMatch from '@/lib/bigface/diff_match_patch.js'

export default {
  name: 'editRecord',

  data() {
    return {
      loading: false,
      versions: '',
      html: '',
      userHtml: '',
      oprLogs: [],
      beDeletedText: '该应用已删除'
    }
  },

  mounted() {
    bigface()
    diffMatch()
    this.queryVersions()
  },

  methods: {
    /**
     * 查询历史版本数据
     */
    queryVersions() {
      this.loading = true

      this.$api.queryDocVersions(this.$route.query).then(data => {
        this.loading = false
        // 版本稿只展示当前版本及原稿的修订记录，过滤其他版本稿信息
        if (this.$route.query.isorigin == 0) {
          data = data.filter(version => {
            return +version.dataId === +this.$route.query.dataid || +version.versionNum === 1
          })
        }
        this.versions = data
        this.excuteCompare()
      })
    },

    /**
     * 时间戳格式化
     */
    formatDate(timeStamp) {
      return fecha.format(+timeStamp, 'YYYY-MM-DD HH:mm:ss')
    },

    /**
     * 获取用于大花脸比对的正文
     * @param htmlContent
     * @returns {*}
     */
    removeHtmlTag: function (htmlContent) {
      var dom = document.createElement("div")
      dom.innerHTML = htmlContent

      Array.prototype.forEach.call(dom.querySelectorAll('ol'), function (index) {
        this.querySelectorAll("li").each(function (_index) {
          this.innerHTML = `${_index + 1}.${this.innerHTML}`
        })
        Array.prototype.forEach.call(this.querySelectorAll('li'), function (_index) {
          this.innerHTML = `${_index + 1}.${this.innerHTML}`
        })
      })

      htmlContent = dom.innerHTML
        .replace(/\s+/g, '')
        .replace(/<script[^>]*>(?:.*?)<\/script>/g, '')
        .replace(/<style[^>]*>(?:.*?)<\/style>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<\/div>/g, '\n')
        .replace(/<(p|div)[^>]*>/ig, '')
        .replace(/<br\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n+/g, "\n")

      //去掉文章末尾的换行
      if (htmlContent[htmlContent.length - 1] === "\n") {
        htmlContent = htmlContent.substring(0, htmlContent.length - 1)
      }

      return htmlContent
    },

    /**
     * 根据比对结果，从操作人的角度进行版本统计
     */
    calculateVersion(data) {
      if (!data) return false

      let map = {}

      let count = 2
      for (let i = 0; i < data.length; i++) {
        let range = data[i]
        let oprUser = range.updateUser

        // 未做修改，不进行统计
        if (range.type === "=") continue

        if (map[oprUser] === undefined) {
          map[oprUser] = count
          range.oprUserVesion = count.toString()
          count++
        } else {
          range.oprUserVesion = map[oprUser].toString()
        }
      }

      return data
    },

    /**
     * 根据比对结果，获取文档比对正文html
     */
    getOprResult(result) {
      // 新建的文档，没有文档版本的变化，用户列表默认黑色
      if (!result) {
        return {
          oprLog: [{updateTime: this.versions[0].updateTime, updateUser: this.versions[0].updateUser}],
          oprUserHtml: `<li><span class="uservT userv1"></span>` +
                       `<label ${this.versions[0].updateUser === this.beDeletedText ? 'class="disabled"' : ''}>${this.versions[0].updateUser}</label></span></li>`,
          oprContentHtml: `${this.versions[0].bigFaceContent.replace(/\n\s*/g, "<br/>")}`
        }
      }

      let oprLog = [{updateTime: this.versions[0].createTime, updateUser: this.versions[0].createUser}]
      let oprUserArray = []
      let oprUserHtml = `<li><span class="uservT userv1"></span>` +
                        `<label ${this.versions[0].updateUser === this.beDeletedText ? 'class="disabled"' : ''}>${this.versions[0].updateUser}</label></span></li>`
      let oprContentHtml = ''

      for (let i = 0; i < result.length; i++) {
        let range = result[i]
        let oprUserVesion = range.oprUserVesion
        let otherType = range.type === '-' ? 'sub' : 'org'
        let oprType = range.type === '+' ? 'add' : otherType
        let oprTitle = `${range.updateUser}，${fecha.format(+range.updateTime, 'YYYY-MM-DD HH:mm:ss')} ${oprType === 'add' ? '新增' : '删除'}`

        if (range.type !== "=") {
          if(range.last && range.last === '1') {
            oprTitle = `${range.updateUser_last}，${fecha.format(+range.updateTime_last, 'YYYY-MM-DD HH:mm:ss')} 新增&#13;` + oprTitle
          }

          // 标示修改内容，span包裹，添加title
          range.fragment = range.fragment
            .replace(/\[分段\]/g, "<hr/>")
            .replace(/\n\s*/g, "<br/>")
            .replace(/\u3000/g, `<span title="${oprTitle}" opertype="${oprType}" class="v${oprUserVesion}">&nbsp;&nbsp;</span>`)
          oprContentHtml += `<span title="${oprTitle}" opertype="${oprType}" class="v${oprUserVesion}">${range.fragment}</span>`

        } else {
          // 未做修改的原文
          range.fragment = range.fragment
            .replace(/<(p)[^>]*>/ig, '')
            .replace(/\[分段\]/g, "<hr/>")
            .replace(/\n\s*/g, '<br/>')
          oprContentHtml += `<span>${range.fragment}</span>`
        }

        // 操作人
        if (oprUserArray[oprUserVesion] === undefined) {
          if (range.type === "=") continue
          oprUserArray[oprUserVesion] = range
        }

        // 时间轴
        if (range.type === "=" || oprLog.some(item => item.updateTime === range.updateTime)) {
          continue
        }
        oprLog.unshift(range)
      }

      oprUserArray.sort((a, b) => {
        return new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime()
      })
      for (let i = 0; i < oprUserArray.length; i++) {
        let range = oprUserArray[i]
        if (!range) continue
        oprUserHtml += `<li><span class="uservT userv${range.oprUserVesion}"></span>` +
                       `<label ${range.updateUser === this.beDeletedText ? 'class="disabled"' : ''}>${range.updateUser}</label></span></li>`
      }

      return { oprLog, oprUserHtml, oprContentHtml }
    },

    /**
     * 生成时间轴
     */
    createTimeAxis(oprLog) {
      oprLog.sort((a, b) => {
        return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
      })

      let oprLogArray = []
      let oprLogMap = {}
      for (let i = 0; i < oprLog.length; i++) {
        let YMD_time = fecha.format(+oprLog[i].updateTime, 'YYYY-MM-DD')
        let HMS_time = fecha.format(+oprLog[i].updateTime, 'HH:mm:ss')

        //如果日期不相同添加一个oprLog
        if (!oprLogMap[YMD_time]) {
          let log = {oprTime: YMD_time, oprArr: []}
          oprLogMap[YMD_time] = log
          oprLogArray.push(log)
        }

        oprLogMap[YMD_time].oprArr.push({time: HMS_time, name: oprLog[i].updateUser})
      }

      return oprLogArray.sort((a, b) => {
        return new Date(b.oprTime).getTime() - new Date(a.oprTime).getTime()
      })
    },

    /**
     * 执行文档对比
     */
    excuteCompare() {
      // 1.处理后端返回值
      for (let i = 0; i < this.versions.length; i++) {
        this.versions[i].bigFaceContent = ''
        this.versions[i].updateUser = this.versions[i].appName ? this.versions[i].appName : this.beDeletedText
        this.versions[i].createUser = this.versions[i].appName ? this.versions[i].appName : this.beDeletedText

        for (let j = 0; j < this.versions[i].content.length; j++) {
          this.versions[i].bigFaceContent += `${j > 0 ? '[分段]' : ''}${this.versions[i].content[j].htmlContent}`

          if (j === this.versions[i].content.length -1) {
            let content = `<p>${this.versions[i].title}</p> ${this.versions[i].bigFaceContent}`
            this.versions[i].bigFaceContent = this.removeHtmlTag(content)
          }
        }
      }

      // 2.bigface文档比较
      let result = new window.trs.BigFace('bigFaceContent').execute(this.versions)
      result = this.calculateVersion(result)

      // 3.根据比较结果，获得显示内容html片段、操作人html、操作日志
      let {oprLog, oprUserHtml, oprContentHtml } = this.getOprResult(result)
      this.oprLogs = this.createTimeAxis(oprLog)
      this.userHtml = oprUserHtml
      this.html = oprContentHtml
    }

  }
}
</script>


<style lang="scss">
.uirb-edit-history {
  position: relative;
  padding: 0 250px 100px 160px;

  .title-section {
    border-bottom: 1px dashed #e1e1e1;
  }

  .sub {
    font-size: 12px;
    color: #828282;
  }

  .time-axis {
    position: absolute;
    right: 30px;
    top: 35px;
    width: 150px;
    max-height: calc(100% - 80px);
    padding: 44px 5px 20px 37px;
    border-radius: 4px;
    background: #2A8BED;
    overflow: auto;
  }
  .time-axis>div:before {
    position: absolute;
    left: -17px;
    top: -20px;
    bottom: 0;
    content: '';
    width: 4px;
    border-radius: 4px;
    background-color: #fff;
    opacity: .2;
  }

  .time-axis .log {
    position: relative;
    height: 50px;
    color: #fff;
    &:before {
      position: absolute;
      left: -17px;
      top: 0;
      margin-top: 2px;
      margin-left: -5px;
      content: '';
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #fff;
    }
    &:after {
      position: absolute;
      left: -17px;
      top: 0;
      margin-top: 4px;
      margin-left: -2px;
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #FF5F5B;
    }
  }

  .time-axis .operation {
    position: relative;
    height: 50px;

    &:before {
      position: absolute;
      left: -17px;
      top: 0;
      margin-top: 5px;
      margin-left: -3px;
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #fff;
    }

    .log-time {
      font-size: 12px;
      color: #7eb1e2;
    }
    .log-user {
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.bigface-result {
  line-height: 30px;
  color: #363636;

  .v1, .userv1 {
    background-color: #363636;
  }
  .v2, .userv2 {
    color: #fa3947!important;
    background-color: #fa3947!important;
  }
  .v3, .userv3 {
    color: #398bfa!important;
    background-color: #398bfa!important;
  }
  .v4, .userv4 {
    color: #f9cf3e!important;
    background-color: #f9cf3e!important;
  }
  .v5, .userv5 {
    color: #44eb33!important;
    background-color: #44eb33!important;
  }
  .v6, .userv6 {
    color: #bd33eb!important;
    background-color: #bd33eb!important;
  }
  .v7, .userv7 {
    color: #554d58!important;
    background-color: #554d58!important;
  }
  .v8, .userv8 {
    color: #ff7505!important;
    background-color: #ff7505!important;
  }
  .v9, .userv9 {
    color: #308e24!important;
    background-color: #308e24!important;
  }
  .v10, .userv10 {
    color: #092cc3!important;
    background-color: #092cc3!important;
  }
  .v11, .userv11 {
    color: #c71585!important;
    background-color: #c71585!important;
  }
  .v12, .userv12 {
    color: #b22222!important;
    background-color: #b22222!important;
  }
  .v13, .userv13 {
    color: #b0c4de!important;
    background-color: #b0c4de!important;
  }
  .v14, .userv14 {
    color: #adff2f!important;
    background-color: #adff2f!important;
  }
  .v15, .userv15 {
    color: #a9a9a9!important;
    background-color: #a9a9a9!important;
  }
  .v16, .userv16 {
    color: #9932cc!important;
    background-color: #9932cc!important;
  }
  .v17, .userv17 {
    color: #8b008b!important;
    background-color: #8b008b!important;
  }
  .v18, .userv18 {
    color: #808080!important;
    background-color: #808080!important;
  }
  .v19, .userv19 {
    color: #008080!important;
    background-color: #008080!important;
  }
  .v20, .userv20 {
    color: #00b88b!important;
    background-color: #00b88b!important;
  }

  *[opertype=add] {
    background-color: #fff !important;
  }
  *[opertype=sub] {
    text-decoration: line-through;
    background-color: #fff !important;
  }
}

.bigface-result .opr-user {
  padding: 15px 0;

  ul {
    overflow: hidden;
  }

  li {
    float: left;
    margin-right: 23px;

    span {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-top: 4px;
      margin-right: 3px;
      border-radius: 50%;
    }

    label {
      line-height: 16px;
      margin-bottom: 10px;
      padding-right: 7px;

      &.disabled {
        color: #c5c8cc;
      }
    }
  }
}
</style>
