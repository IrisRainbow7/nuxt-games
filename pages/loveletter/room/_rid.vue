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
          {{m.isDead ? '☠' : '　' }}{{ m.name }} : {{ finished ? m.isDead ? `(${m.hands})` : m.hands : m.discards }}
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
          {{ finished ? 'ゲーム終了' : '他の人のターンです' }}<br>
          あなたの手札：{{ hands }}<br>
        </template>
        <div>
          ログ<br>
          <v-textarea solo flat auto-grow no-resize readonly :value="logs.join('\n')" style="border: 1px solid" />
        </div>
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
        <v-dialog v-model="playerSelectDialog" width="500">
          <v-card>
            <v-card-title>
              プレイヤーを選択してください
            </v-card-title>
            <v-radio-group v-model="playerID">
              <v-radio v-for="m in members" :key="m.id" :label="m.name" :value="m.id" :disabled="m.id === socket.id || m.isDead" class="ml-2"/>
            </v-radio-group>
            <div class="text-center">
              <v-btn @click="discardWithID(discardIndex, playerID)" block class="primary" :disabled="playerID === ''">
                確定
              </v-btn>
            </div>
          </v-card>
        </v-dialog>
        <v-dialog v-model="actionDialog" width="500">
          <v-card>
            <v-card-title>
              プレイヤーを選択してください
            </v-card-title>
            <v-radio-group v-model="playerID">
              <v-radio v-for="m in members" :key="m.id" :label="m.name" :value="m.id" :disabled="m.id === socket.id || m.isDead" class="ml-2"/>
            </v-radio-group>
            <div class="text-center">
              <v-btn @click="responseAction" block class="primary" :disabled="playerID === ''">
                確定
              </v-btn>
            </div>
          </v-card>
        </v-dialog>
        <v-dialog v-model="showHandsDialog" width="500">
          <v-card>
            <v-textarea solo flat auto-grow no-resize readonly :value="showHandsText" />
            <v-card-actions>
              <v-spacer />
              <v-btn @click="closeShowHandsDialog">
                閉じる
              </v-btn>
            </v-card-actions>
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
  hands: number[],
  discards: number[],
  isDead: boolean,
}

export default Vue.extend({
  validate ({ params }) {
    return params.rid !== undefined && params.rid.length === 8
  },
  data() {
    const socket: any = null
    const members: Member[] = []
    const hands: number[] = []
    const logs: string[] = []
    return {
      roomId: '',
      socket,
      name: '',
      nameEntered: false,
      members,
      hands,
      started: false,
      finished: false,
      discardIndex: 0,
      playerSelectDialog: false,
      playerID: '',
      logs,
      actionDialog: false,
      action: '',
      showHandsText: '',
      showHandsDialog: false,
      cardNames: new Map([['10', '英雄'], ['9', '皇帝'], ['8', '精霊'], ['7', '賢者'], ['6', '貴族'], ['5', '死神'], ['4', '乙女'], ['3', '占い師'], ['2', '兵士'], ['1', '少年']])
    }
  },
  mounted() {
    this.roomId = this.$route.params.rid
    this.socket = io('/loveletter', { path: '/api/socket.io/' })
    this.socket.on('update-member', (members: Member[]) => {
      this.members = members
    })
    this.socket.on('update-hands', (hands: number[]) => {
      this.hands = hands
    })
    this.socket.on('update-logs', (logs: string[]) => {
      this.logs = logs
    })
    this.socket.on('game-start', () => {
      this.started = true
    })
    this.socket.on('request-action', (action: string) => {
      if (['6f', '6s'].includes(action)) {
        this.actionDialog = true
        this.action = action
      }
    })
    this.socket.on('show-hands', (action: string, id: string, hands: string) => {
      const u = this.members.find(m => m.id === id)
      if (u !== undefined) {
        const cardname = this.cardNames.get(action.substring(0, 1))
        this.showHandsText = `${u.name}さんの「${cardname}」の効果\n ${u.name}さんの手札は[${hands}]です`
        this.showHandsDialog = true
      }
    })
    this.socket.on('empty-deck', () => {
      this.finished = true
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
      if ([8].includes(this.hands[index])) {
        this.playerSelectDialog = true
        this.discardIndex = index
      } else {
        this.socket.emit('discard', this.roomId, this.hands[index], '')
        this.hands.splice(index, 1)
      }
    },
    discardWithID (index: number, id: string) {
      this.socket.emit('discard', this.roomId, this.hands[index], id)
      this.hands.splice(index, 1)
      this.playerSelectDialog = false
      this.playerID = ''
    },
    responseAction () {
      if (['6f', '6s'].includes(this.action)) {
        this.socket.emit('response-action', this.roomId, this.action, this.playerID)
      }
      this.actionDialog = false
      this.playerID = ''
    },
    closeShowHandsDialog () {
      this.showHandsText = ''
      this.showHandsDialog = false
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
