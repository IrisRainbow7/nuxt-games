<template>
  <v-card class="app-outer">
    <template v-if="!nameEntered">
      <div class="mx-3">
        <v-text-field v-model="name" @keypress.enter.exact="join" label="Name" />
      </div>
    </template>
    <template v-else>
      <div class="py-10 text-center">
        <table class="table">
          <tbody>
            <tr>
              <td v-for="i in 3" :key="`1${i}`" @click="onClick(i-1)">
                <template v-if="cells[i-1] === 1">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <circle fill="#fff" stroke="#000" stroke-width="7" cx="35" cy="35" r="30"></circle>
                  </svg>
                </template>
                <template v-if="cells[i-1] === 2">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(45,35,35)"></rect>
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(-45,35,35)"></rect>
                  </svg>
                </template>
              </td>
            </tr>
            <tr>
              <td v-for="i in 3" :key="`2${i}`" @click="onClick(i+2)">
                <template v-if="cells[i+2] === 1">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <circle fill="#fff" stroke="#000" stroke-width="7" cx="35" cy="35" r="30"></circle>
                  </svg>
                </template>
                <template v-if="cells[i+2] === 2">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(45,35,35)"></rect>
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(-45,35,35)"></rect>
                  </svg>
                </template>
              </td>
            </tr>
            <tr>
              <td v-for="i in 3" :key="`3${i}`" @click="onClick(i+5)">
                <template v-if="cells[i+5] === 1">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <circle fill="#fff" stroke="#000" stroke-width="7" cx="35" cy="35" r="30"></circle>
                  </svg>
                </template>
                <template v-if="cells[i+5] === 2">
                  <svg style="width: 70px;height:70px;margin-top:5px;" width="70" height="70" viewbox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" version="1.1">
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(45,35,35)"></rect>
                    <rect x="30" y="0" width="10" height="70" fill="#000" transform="rotate(-45,35,35)"></rect>
                  </svg>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="win===0 && ready" class="text-center mt-2 font-weight-bold">
        {{ turn ? 'あなたの番です' : '相手の番です' }}
      </div>
      <div v-if="win!==0" class="text-center mt-2 font-weight-bold">
        {{ win === 1 ? 'あなたの勝ちです' : 'あなたの負けです' }}
      </div>
      <div v-if="win !==0" class="text-center">
        <v-btn @click="requestGameReset">
          もう一回!
        </v-btn>
      </div>
      <div class="text-center mt-2">
        {{ ready ? `対戦相手:${name2}` : '対戦相手を待機中...' }}
      </div>
    </template>
  </v-card>
</template>

<script>
import io from 'socket.io-client'

export default {
  validate ({ params }) {
    return params.rid!== undefined && params.rid.length === 8
  },
  data() {
    return {
      roomId: '',
      socket: '',
      name: '',
      name2: '',
      nameEntered: false,
      cells: Array(9).fill(0),
      ready: false,
      value: 2,
      turn: false,
      win: 0,
    }
  },
  mounted() {
    this.roomId = this.$route.params.rid
    this.socket = io('/tic-tac-toe', { path: '/api/socket.io/' })
    this.socket.on('new-member', name => {
      if (!this.ready && this.name !== name) {
        this.socket.emit('join', this.roomId, this.name)
        this.name2 = name
        this.ready = true
      } else if (this.name !== name) {
        this.value = 1
        this.turn = true
      }
    })
    this.socket.on('new-msg', msg => {
      if (msg.value !== this.value) {
        this.$set(this.cells, msg.index, msg.value)
        this.turn = true
      }
      [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]].forEach((i) => {
        if (this.cells[i[0]] !== 0 && this.cells[i[1]] !== 0 && this.cells[i[2]] !== 0 && this.cells[i[0]] === this.cells[i[1]] && this.cells[i[1]] === this.cells[i[2]]) {
          this.win = this.cells[i[0]] === this.value ? 1 : 2
        }
      })
    })
    this.socket.on('reset-game', () => {
      this.cells = Array(9).fill(0)
      this.win = 0
      this.turn = this.value === 1
    })
  },
  methods: {
    join () {
      this.socket.emit('join', this.roomId, this.name)
      this.nameEntered = true
    },
    onClick(index) {
      if (this.cells[index] === 0 && this.turn && this.win === 0) {
        this.$set(this.cells, index, this.value)
        const message = {
          index: index,
          value: this.value
        }
        this.socket.emit('send-msg', this.roomId, message)
        this.turn = false
      }
    },
    requestGameReset () {
      this.socket.emit('reset-game', this.roomId)
    }
  }
}
</script>

<style scoped>
.table{
  table-layout: fixed;
  border-collapse:collapse;
  text-align: center;
  margin: 0 auto;
}
.table td{
  border: 2px solid #000066;
  width: 100px;
  height: 100px;
}
</style>
