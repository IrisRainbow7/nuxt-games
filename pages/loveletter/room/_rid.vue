<template>
  <v-card class="app-outer loveletter-outer">
    <template v-if="!nameEntered">
      <div class="mx-3">
        <v-text-field v-model="name" @keypress.enter.exact="join" label="名前を入力してください..." />
      </div>
      <div class=" text-center mx-3">
        <v-btn @click="join" :disabled="name===''">
          確定
        </v-btn>
      </div>
    </template>
    <template v-else>
      <template v-if="!started">
        <div class="text-center text-h3 pt-7 mb-3">
          メンバー
        </div>
        <div v-for="m in members" :key="`a${m.id}`" class="text-center text-h5">
          ・{{ m.name }}
        </div>
        <div class="text-center mt-15">
          <v-btn @click="gameStart" style="width:50%">
            開始
          </v-btn>
        </div>
      </template>
      <template v-else>
        <div v-for="m in members" :key="`c${m.id}`">
          {{ m.name }} : {{ finished ? lastCard[m.id] : m.discards }}
        </div>
        <br>
        <template v-if="hands.length === 2">
          捨てるカードを選んでください
          <v-btn @click="discard(0)">
            {{ hands[0] }}
          </v-btn>
          <v-btn @click="discard(1)">
            {{ hands[1] }}
          </v-btn>
        </template>
        <template v-else>
          {{ finished ? 'ゲーム終了' : '他の人のターンです' }}
        </template>
        <v-dialog width="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" fav class="floating">
              <v-icon>
                mdi-menu
              </v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              メンバー
            </v-card-title>
            <v-container>
              <v-row>
                <v-col cols="12" v-for="m in members" :key="`b${m.id}`">
                  ・{{ m.name }}
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-dialog>
      </template>
    </template>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import io from 'socket.io-client'

interface Member {
  id: string,
  name: string,
  index: number,
  discards: number[],
}

interface Message {
  action: string,
  number: number,
}

interface LastCardDict {
  [id: string]: number
}
export default Vue.extend({
  validate ({ params }) {
    return params.rid !== undefined && params.rid.length === 8
  },
  data() {
    const socket: any = null
    const members: Member[] = []
    const hands: number[] = []
    const lastCard: LastCardDict = {}
    return {
      roomId: '',
      socket,
      name: '',
      nameEntered: false,
      members,
      hands,
      started: false,
      finished: false,
      lastCard,
    }
  },
  mounted() {
    this.roomId = this.$route.params.rid
    this.socket = io('/loveletter', { path: '/api/socket.io/' })
    this.socket.on('new-member', (id: string, name: string, index: number) => {
      if (this.members.filter(m => m.id === id).length === 0) {
        this.members.push({
          id,
          name,
          index,
          discards: []
        })
        this.members.sort((a, b) => (a.index - b.index))
        this.socket.emit('join', this.roomId, this.name)
      }
    })
    this.socket.on('game-start', () => {
      this.started = true
    })
    this.socket.on('new-msg', (msg: Message, id: string) => {
      console.log(msg)
      if (msg.action === 'discard') {
        const member = this.members.find(el => el.id === id)
        if (member === undefined) { return }
        member.discards.push(msg.number)
      } else if (msg.action === 'set-hands') {
        this.hands = [msg.number]
      } else if (msg.action === 'draw-card') {
        this.hands.push(msg.number)
      } else if (msg.action === 'empty-deck') {
        this.finished = true
        this.socket.emit('send-msg', this.roomId, {
          action: 'show-down',
          number: this.hands[0]
        })
      } else if (msg.action === 'show-down') {
        this.finished = true
        this.$set(this.lastCard, id, msg.number)
      }
    })
    this.socket.on('reset-game', () => {
    })
  },
  methods: {
    join () {
      if (this.name === '') { return }
      this.socket.emit('join', this.roomId, this.name)
      this.nameEntered = true
    },
    gameStart () {
      this.socket.emit('game-start', this.roomId)
      this.started = true
    },
    discard (index: number) {
      const data: Message = {
        action: 'discard',
        number: this.hands[index]
      }
      this.socket.emit('send-msg', this.roomId, data)
      this.hands.splice(index, 1)
    },
    requestGameReset () {
      this.socket.emit('reset-game', this.roomId)
    },
  }
})
</script>

<style scoped>
.floating{
  position: fixed;
  bottom: 10px;
  right: 10px;
  padding: 6px 40px;
}
.loveletter-outer{
  min-height: 100vh;
}
</style>
