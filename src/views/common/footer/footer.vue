<template>
  <p class="edition-info">{{ data }}</p>
</template>

<script>
export default {
  props: {
    bottom: {
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      data: ''
    }
  },
  mounted() {
    this.$api.editionMsg().then(data => {
      this.data = data
    })
  }
}
</script>

<style>

</style>
