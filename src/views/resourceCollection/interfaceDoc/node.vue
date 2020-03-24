<template>
  <div>
    <section v-for="section in data" :key="section.id" :class="'node'+ (section.id ? section.id : '')">
      <p v-if="section.type.indexOf('heading') >= 0" :class="section.type" v-html="section.value" />
      <span v-if="section.type === 'text'" v-html="replaceOrigin(section.value)"></span>
      <span v-if="section.type === 'codeBlock'" class="json-datas">
        <pre v-html="JSON.stringify(JSON.parse(section.value), null, 4)"/>
      </span>
      <tableNode v-if="section.type === 'table'" :section="section"></tableNode>
      <node v-if="section.type !== 'table' && section.children && section.children.length" :data="section.children"></node>
    </section>
  </div>
</template>

<script>
import tableNode from './tableNode'

export default {
  name: 'node',

  components: {
    tableNode
  },

  props: {
    data: {
      type: Array || Object,
      default: () => []
    }
  },

  methods: {
    /**
     * 动态写入origin
     */
    replaceOrigin(value) {
      let origin = location.origin
      return value.replace('${origin}', origin)
    }
  }
}
</script>
