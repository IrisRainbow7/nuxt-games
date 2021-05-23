<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="text-center text-h4 mt-5">
          Tic-Tac-Toe
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="text-center my-5">
          Tic-Tac-Toe(マルバツゲーム)
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="1" md="3" />
      <v-col cols="10" md="6" class="text-center">
        <v-btn @click="enterRoom" block>
          入室
        </v-btn>
      </v-col>
      <v-col cols="1" md="3" />
    </v-row>
  </v-container>
</template>

<script>
export default {
  methods: {
    enterRoom () {
      const roomId = this.$utils.createRandomID()
      this.$router.push({ path: `room/${roomId}`, append: true })
    }
  }
}
</script>

<style>

</style>
