<template>
  <v-btn @click="enterRoom">
    入室
  </v-btn>
</template>

<script>
export default {
  methods: {
    enterRoom () {
      const roomId = [...Array(8)].map(()=>'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('')
      this.$router.push({ path: `room/${roomId}`, append: true })
    }
  }
}
</script>

<style>

</style>
