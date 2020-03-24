<template>
  <div class="main-container">
    <div class="side-bar">
      <div class="nav-menu">
        <ul>
          <li v-for="tag in data.tagCategory" :key="tag.id" :class="{'is-active': data.isSelect == tag.typeCode}" class="nav-item" @click="select(tag)">
            <router-link :to="{ path: '/model/tag/list', query: { tagType: tag.typeCode, tagname: tag.typeName } }">{{ tag.typeName }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <div class="content-container">
      <router-view/>
      <edition />
    </div>
  </div>
</template>

<script>
import edition from '@/views/common/footer/footer.vue'

export default {
  name: 'tagManage',

  components: {
    edition
  },

  data () {
    return {
      data: {
        tagCategory: [],
        isSelect: 'person'
      }
    }
  },

  watch: {
    '$route' (val) {
      if (val.path === '/model/tag') {
        this.queryList()
      }
    }
  },

  mounted () {
    this.queryList()
  },



  methods: {
    /**
     * 请求左侧树
     */
    queryList () {
      this.$api.queryTagTree().then(data => {
        this.data.tagCategory = data
        this.data.isSelect = this.data.tagCategory[0].typeCode
        this.$router.push({ path: '/model/tag/list', query: { tagType: this.data.tagCategory[0].typeCode, tagname: this.data.tagCategory[0].typeName } })
      })
    },

    select (tag) {
      this.data.isSelect = tag.typeCode
      this.$router.push({ path: '/model/tag/list', query: { tagType: tag.typeCode, tagname: tag.typeName } })
    }
  }
}
</script>
