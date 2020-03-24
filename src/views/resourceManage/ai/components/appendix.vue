<template>
  <ul>
    <li v-for="item in sortAttachFile(list)" :key="item.id" :class="{'is-image': item.isImage}">
      <img v-if="item.isImage" :src="item.accessUrl" alt="">
      <span v-else>{{ item.fileName }}</span>
      <a href="javascript:;" class="download-btn" title="下载" @click="downloadAttach(item)"></a>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'appendix',

  props: {
    list: {
      type: Array | null,
      required: true
    }
  },

  methods: {
    /**
     * 附件排序，图片在前，文档在后
     */
    sortAttachFile(array) {
      let picArray = []
      array = array || []
      for (const file of Array.from(array)) {
        if (/.*(\.gif|\.jpeg|\.png|\.jpg|\.bmp)/i.test(file.fileName)) {
          file.isImage = true
          picArray.push(file)
        }
      }
      return [...new Set(picArray.concat(array))]
    },

    /**
     * 下载附件
     */
    downloadAttach(item) {
      if (item.appendixType === 'mv') {
        this.$api.downloadVideo(item.id).then(url => {
          window.open(url, '_blank')
        })
      } else {
        this.$api.downloadAttach(item.id)
      }
    }
  }
}
</script>
