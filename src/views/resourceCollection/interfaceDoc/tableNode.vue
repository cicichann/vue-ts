<template>
  <table v-if="section.type === 'table'" border="1" width="100%" cellpadding="5%">
    <tbody>
      <tr v-if="section.header.trim()">
        <th v-for="(val, i) in JSON.parse(section.header)" :key="i" v-html="val"/>
      </tr>
      <tr v-for="(val, index) in JSON.parse(section.value)" :key="val.id">
        <td v-for="i in val.length" :key="i" :colspan="(i === val.length) && val.length < section.cols ? (section.cols - val.length + 1) : 1">
          <span v-if="val[i-1]" v-html="replaceOrigin(val[i-1])"></span>
          <template v-for="(child, num) in section.children" >
            <template v-if="index === parseInt(child.position.split(',')[0]) && i === (parseInt(child.position.split(',')[1]) + 1 )">
              <tableNode :key="num" :section="child" />
            </template>
          </template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "tableNode",

  props: {
    section: {
      type: Object,
      default: () => {}
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

