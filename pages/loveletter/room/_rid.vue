<template>
  <v-card class="app-outer loveletter-outer">
    <template v-if="!nameEntered">
      <div class="mx-3" style="padding-top:200px;">
        <v-text-field v-model="name" @keypress.enter.exact="join" label="名前を入力してください..." />
      </div>
      <div class=" text-center mx-3">
        <v-btn @click="join" :disabled="name===''">
          確定
        </v-btn>
      </div>
      <div class="text-center" style="margin-top: 200px">
        <v-btn @click="resetRoom" style="width:50%">
          部屋リセット
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
        <div class="text-center mt-15">
          <v-btn @click="requestGameReset" style="width:50%">
            リセット
          </v-btn>
        </div>
      </template>
      <template v-else>
        <v-container>
          <v-row>
            <v-col cols="12" class="text-center text-h6">
              山札　残り{{ deckLength }}枚
            </v-col>
            <v-col cols="12" class="text-center text-h6">
              捨て札
            </v-col>
            <v-col cols="12">
              <v-divider />
            </v-col>
          </v-row>
          <v-row no-gutters v-for="m in members" :key="`c${m.id}`">
            <v-col cols="12" md="3" align-self="center">
              <v-card class="pa-2" outlined tile :height="wwidth > 960 ? '60px' : '40px'" :style="{'background-color': m.isDead ? '#BBB' : '#FFF'}">
                <div class="text-center font-weight-bold" :style="{'margin-top': wwidth > 960 ? '-2px': '-10px'}">
                  <span style="font-size: 28px">
                    {{ m.isDead ? '☠' : '　' }}
                  </span>
                  {{ m.name }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="9" align-self="center">
              <v-card class="pa-2" outlined tile height="60px" :style="{'background-color': m.isDead ? '#BBB' : '#FFF'}">
                <div v-for="(discard, i) in m.discards" :key="`${m.id}${i}${discard}`" class="card float-left">
                  {{ discard }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
        <v-divider />
        <v-container>
          <v-row v-if="hands.length === 2">
            <v-col cols="12" class="text-center text-h6">
              捨てるカードを選んでください
            </v-col>
            <v-col cols="6">
              <v-card @click="discard(0)" width="100%" height="100px" color="#DDD" elevation="5" :disabled="hands[0] === 10" class="discard-btn">
                <div class="btn-content">
                  {{ hands[0] }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card @click="discard(1)" width="100%" height="100px" color="#DDD" elevation="5" :disabled="hands[1] === 10" class="discard-btn">
                <div class="btn-content">
                  {{ hands[1] }}
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else>
            <v-col cols="12" class="text-center text-h6">
              <template v-if="finished">
                ゲーム終了<br>
                <v-btn @click="requestGameReset">
                  リセット
                </v-btn>
              </template>
              <template v-else>
                他の人のターンです
              </template>
            </v-col>
            <v-col cols="12">
              <div style="height:100px" class="text-h5">
                あなたの手札：{{ hands }}<br>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-divider />
        <div>
          ログ<br>
          <v-textarea solo flat auto-grow no-resize readonly :value="logs.join('\n')" style="border: 1px solid" />
        </div>
        <v-dialog v-model="helpDialog" width="1000">
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" fav class="floating" :style="{ 'z-index': helpDialog ? 1 : 1000}">
              <v-icon>
                mdi-help-circle-outline
              </v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              ルール
            </v-card-title>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <a href="https://www.happybrainwash.com/xeno" target="_blank">
                    ルール（公式サイト)
                  </a>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <card-table />
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="helpDialog=false">
                閉じる
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="handDialog" width="800">
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" fav class="floating2" :style="{ 'z-index': handDialog ? 1 : 2000}">
              <v-icon>
                mdi-cellphone-information
              </v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              手札
            </v-card-title>
            <v-container>
              <v-row>
                <v-col cols="12">
                  あなたの手札は[{{ hands[0] }}]{{ hands.length === 2 ? '　['+hands[1]+']' : '' }}です
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="handDialog=false">
                閉じる
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog persistent v-model="playerSelectDialog" width="500">
          <v-card>
            <v-card-title>
              プレイヤーを選択してください
            </v-card-title>
            {{ playerSelectText[hands[discardIndex]] }}
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
        <v-dialog persistent v-model="playerSelectDialog2" width="500">
          <v-card>
            <v-card-title>
              プレイヤーを選択してください
            </v-card-title>
            {{ playerSelectText[hands[discardIndex]] }}
            <v-radio-group v-model="playerID">
              <v-radio v-for="m in members" :key="m.id" :label="m.name" :value="m.id" :disabled="m.id === socket.id || m.isDead" class="ml-2"/>
            </v-radio-group>
            <v-divider />
            <v-select v-model="playerCard" :items="[1,2,3,4,5,6,7,8,9,10]" label="手札のカード予想" />
            <div class="text-center">
              <v-btn @click="discardWithIDNum(discardIndex, playerID, playerCard)" block class="primary" :disabled="playerID === ''">
                確定
              </v-btn>
            </div>
          </v-card>
        </v-dialog>
        <v-dialog persistent v-model="actionDialog" width="500">
          <v-card>
            <v-card-title>
              プレイヤーを選択してください
            </v-card-title>
            {{ actionText[action] }}
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
        <v-dialog persistent v-model="action2Dialog" width="500">
          <v-card>
            <v-card-title>
              カードを選択してください
            </v-card-title>
            {{ actionText[action] }}
            <v-radio-group v-model="cardNum">
              <v-radio v-for="n in actionHands" :key="`actionhands${n}`" :label="n" :value="n" class="ml-2"/>
            </v-radio-group>
            <div class="text-center">
              <v-btn @click="responseAction2" block class="primary" :disabled="cardNum === ''">
                確定
              </v-btn>
            </div>
          </v-card>
        </v-dialog>
        <v-dialog v-model="showHandsDialog" width="500">
          <v-card>
            <div class="pt-4 ml-4">
              <p>
                {{ showHandsTexts[0] }}
              </p>
              <p>
                {{ showHandsTexts[1] }}さんの手札
              </p>
              <p>
                <span v-for="hand in showHandsTexts[2].split(',')" :key="`showhands${hand}`" class="pa-2 mr-2" style="border:1px solid">
                  {{ hand }}
                </span>
              </p>
            </div>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="closeShowHandsDialog">
                閉じる
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog persistent v-model="action3Dialog" width="500">
          <v-card>
            <v-card-title>
              カードを選択してください
            </v-card-title>
            {{ actionText[action] }}
            <v-radio-group v-model="cardNum">
              <v-radio v-for="n in actionHands" :key="`actionhands${n}`" :label="n" :value="n" class="ml-2"/>
            </v-radio-group>
            <div class="text-center">
              <v-btn @click="responseAction3" block class="primary" :disabled="cardNum === ''">
                確定
              </v-btn>
            </div>
          </v-card>
        </v-dialog>
      </template>
    </template>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import io from 'socket.io-client'
import CardTable from '@/components/CardTable.vue'

interface Member {
  id: string,
  name: string,
  hands: number[],
  discards: number[],
  isDead: boolean,
}

export default Vue.extend({
  components: {
    CardTable
  },
  validate ({ params }) {
    return params.rid !== undefined && params.rid.length === 8
  },
  data() {
    const socket: any = null
    const members: Member[] = []
    const hands: number[] = []
    const logs: string[] = []
    const actionHands: number[] = []
    const showHandsTexts: string[] = ['', '', '']
    return {
      roomId: '',
      socket,
      wwidth: 1000,
      name: '',
      nameEntered: false,
      members,
      hands,
      started: false,
      finished: false,
      discardIndex: 0,
      playerSelectDialog: false,
      playerSelectDialog2: false,
      playerID: '',
      playerCard: 1,
      logs,
      actionDialog: false,
      action: '',
      showHandsDialog: false,
      showHandsTexts,
      cardNames: new Map([['10', '英雄'], ['9', '皇帝'], ['8', '精霊'], ['7', '賢者'], ['6', '貴族'], ['5', '死神'], ['4', '乙女'], ['3', '占い師'], ['2', '兵士'], ['1', '少年']]),
      action2Dialog: false,
      actionHands,
      cardNum: '',
      helpDialog: false,
      action3Dialog: false,
      actionText: { '6f': '「貴族」の効果：対面する相手を選んでください', '6s': '「貴族」の効果：対決する相手を選んでください', '1sf': '「少年」の効果：公開処刑する相手を選んでください', '9': '「皇帝」の効果：捨てさせるカードを選んでください', '1ss': '「少年」の効果：捨てさせるカードを選んでください', '7': '「賢者」の効果：手札に加えるカードを選んでください' },
      playerSelectText: ['', '', '「兵士」の効果：プレイヤーとカードを選択してください', '「占師」の効果：プレイヤーを選択してください', '', '「死神」の効果：プレイヤーを選択してください', '', '', '「精霊」の効果：プレイヤーを選択してください', '「皇帝」の効果：プレイヤーを選択してください',],
      deckLength: 0,
      handDialog: false
    }
  },
  mounted() {
    this.wwidth = window.innerWidth
    this.roomId = this.$route.params.rid
    this.socket = io('/loveletter', { path: '/api/socket.io/' })
    this.socket.on('update-member', (members: Member[], deckLength: number) => {
      this.members = members
      this.deckLength = deckLength
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
    this.socket.on('request-action', (action: string, numbers: number[]) => {
      if (['6f', '6s', '1sf'].includes(action)) {
        this.actionDialog = true
        this.action = action
      } else if (action === '9' || action === '1ss') {
        this.action2Dialog = true
        this.action = action
        this.actionHands = numbers
      } else if (action === '7') {
        this.action3Dialog = true
        this.action = action
        this.actionHands = numbers
      }
    })
    this.socket.on('show-hands', (oid: string, action: string, id: string, hands: string) => {
      const u = this.members.find(m => m.id === oid)
      const u2 = this.members.find(m => m.id === id)
      if (u !== undefined && u2 !== undefined) {
        const cardname = this.cardNames.get(action.substring(0, 1))
        this.showHandsTexts = [`${u.name}さんの「${cardname}」の効果`, u2.name, hands]
        this.showHandsDialog = true
      }
    })
    this.socket.on('empty-deck', () => {
      this.finished = true
    })
    this.socket.on('reset-game', () => {
      this.reset()
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
      if ([8, 9, 3, 5].includes(this.hands[index])) {
        this.playerSelectDialog = true
        this.discardIndex = index
      } else if (this.hands[index] === 2) {
        this.playerSelectDialog2 = true
        this.discardIndex = index
      } else {
        this.socket.emit('discard', this.roomId, this.hands[index], '', 0)
        this.hands.splice(index, 1)
      }
    },
    discardWithID (index: number, id: string) {
      this.socket.emit('discard', this.roomId, this.hands[index], id, 0)
      this.hands.splice(index, 1)
      this.playerSelectDialog = false
      this.playerID = ''
    },
    discardWithIDNum (index: number, id: string, card: number) {
      this.socket.emit('discard', this.roomId, this.hands[index], id, card)
      this.hands.splice(index, 1)
      this.playerSelectDialog2 = false
      this.playerID = ''
      this.playerCard = 1
    },
    responseAction () {
      if (['6f', '6s', '1sf'].includes(this.action)) {
        this.socket.emit('response-action', this.roomId, this.action, this.playerID)
      }
      this.actionDialog = false
      this.playerID = ''
    },
    responseAction2 () {
      if (this.action === '9' || this.action === '1ss') {
        this.socket.emit('response-action', this.roomId, this.action, String(this.cardNum))
      }
      this.action2Dialog = false
      this.cardNum = ''
      this.actionHands = []
    },
    responseAction3 () {
      if (this.action === '7') {
        this.socket.emit('response-action', this.roomId, this.action, String(this.cardNum))
      }
      this.action3Dialog = false
      this.cardNum = ''
      this.actionHands = []
    },
    closeShowHandsDialog () {
      this.showHandsTexts = ['', '', '']
      this.showHandsDialog = false
    },
    requestGameReset () {
      this.socket.emit('reset-game', this.roomId)
    },
    resetRoom () {
      this.socket.emit('reset-room', this.roomId)
    },
    reset () {
      this.started = false
      this.finished = false
      this.discardIndex = 0
      this.playerSelectDialog = false
      this.playerSelectDialog2 = false
      this.playerID = ''
      this.playerCard = 1
      this.actionDialog = false
      this.action = ''
      this.showHandsDialog = false
      this.showHandsTexts = ['', '', '']
      this.action2Dialog = false
      this.actionHands = []
      this.cardNum = ''
      this.helpDialog = false
      this.action3Dialog = false
      this.deckLength = 0
      this.handDialog = false
    }
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
.floating2{
  position: fixed;
  bottom: 60px;
  right: 10px;
  padding: 6px 40px;
}
.loveletter-outer{
  min-height: 100vh;
}
.card{
  border: 1px solid #333;
  padding: 8px;
  margin-right: 10px;
}
.btn-content{
  margin: 0px auto;
  line-height: 100px;
  text-align: center;
  font-size: 50px;
}
</style>
