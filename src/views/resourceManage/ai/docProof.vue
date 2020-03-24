<template>
  <div v-loading="loading" class="doc-proof uirb-preview-content" element-loading-text="数据加载中...">
    <!-- 标题 -->
    <div class="title-section">
      <h1>{{ title }}</h1>
      <div class="sub"></div>
    </div>

    <!-- 校对内容 -->
    <div class="content-section">
      <p class="proof-count">包含错别字、敏感词 : <span :class="{'scroll-text': docProofData.data.length > 0}" @click="scollToTarget">{{ docProofData.data.length }}</span></p>
      <div class="proof-content content rich-content" v-html="filterHtml(docProofData.content)"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'docProof',

  data() {
    return {
      loading: false,
      title: '', // 标题
      docProofData: { // 文档校对信息
        data: [],
        content: ''
      }
    }
  },

  created() {
    this.queryDocProofData()
  },

  methods: {
    /**
     * 查询文档校对信息
     */
    queryDocProofData() {
      this.loading = true
      const { standardid, resourceid, dataid } = this.$route.query
      this.$api.queryDocProofData({ standardid, resourceid, dataid }).then((data) => {
        this.docProofData = data
        this.title = data.title

        // 智能校对
        let content = data.content
        let errorArr = data.data
        let proofArr = [] // 带样式的校对数据
        let imgArr = content.match(/<img.*?(?:>|\/>)/gi) || [] // 图片数组
        let lastIndex = 0 // 默认开始匹配的索引值
        let bodyReg = /<body[^>]*>([\s\S]*)<\/body>/
        let textContent = bodyReg.test(content) ? content.match(bodyReg)[1].trim() : content.trim() // 去掉文本首尾的空格和换行符
        textContent = textContent.replace(/<\/*span[^>]*>/g, '') // 去掉span标签，增加匹配精度

        // 将图片替换掉
        imgArr.map((img) => {
          textContent = textContent.replace(img, "𪚥")
          return textContent
        })

        // 将校对数据重组为带样式的标签
        errorArr.map((err) => {
          let err_word = typeof(err.error_word) === 'string' ? err.error_word : err.error_word[0]
          let right_word = typeof(err.right_words) === 'string' ? err.right_words : err.right_words[0]
          let regS = new RegExp(err_word, "gi")
          regS.lastIndex = lastIndex

          let matchS = regS.exec(textContent)
          lastIndex = matchS.index
          textContent = [textContent.substring(0, lastIndex), '龘', textContent.substring(lastIndex + matchS[0].length)].join('')

          let newstring = '<span class="match-word">' + err_word + '<em>(' + (right_word ? right_word + "," : '') + err.type + ')</em></span>'
          proofArr.push(newstring)
        })

        // 将校对数据逐项写入
        proofArr.map((item) => {
          textContent = textContent.replace("龘", item)
          return textContent
        })

        // 将图片还原
        imgArr.map((img) => {
          textContent = textContent.replace("𪚥", img)
          return textContent
        })

        data.content = textContent
        this.loading = false
      }, () => {
        this.loading = false
        document.addEventListener('click', this.closeBtnClick)
      })
    },

    /**
     *  富文本过滤
     */
    filterHtml (value) {
      if (value) {
        value = value.replace(/(( style=")([^"]*)(text-align:\s*\w+)([^"]*))/g, '$2$4') // 过滤包含text-align行内样式的style中的其他样式
        value = value.replace(/(( style=")(?!text-align:)([^"]*))/g, '$2') // 过滤不含text-align的style属性
        value = value.replace(/&nbsp;/g, '')
        value = value.replace(/\s*\n/g, '<br/>')
        value = value.replace(/\s+</g, '<') // 过滤标签前的空格
        value = value.replace(/><br>\s*<\//g, '></') // 过滤空标签中的<br>
        // value = value.replace(/<([^>]+)><\/\w+>/g, '') // 过滤空标签
        return value
      } else return ''
    },

    /**
     * 锚点定位第一个错别字或敏感词
     */
    scollToTarget () {
      if (this.docProofData.data.length === 0) return

      let scollHeight = document.querySelector('.match-word').offsetTop - 50
      let curScroll = document.querySelector('.main-container').scrollTop

      let interval = setInterval(() => {
        if (curScroll >= scollHeight) {
          clearInterval(interval)
          document.querySelector('.main-container').scrollTop = scollHeight
        } else {
          document.querySelector('.main-container').scrollTop = curScroll + scollHeight / 50
          curScroll += scollHeight / 50
        }
      }, 10)
    },

    /**
     * 监听弹窗按钮关闭事件
     */
    closeBtnClick (event) {
      if (!event.target.className) return
      if (event.target.className.indexOf('el-dialog__headerbtn') > -1 || event.target.className.indexOf('el-dialog__close') > -1) {
        document.removeEventListener('click', this.closeBtnClick)
        window.close()
      }
    }
  }
}
</script>
