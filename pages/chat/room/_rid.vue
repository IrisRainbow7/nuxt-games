<template>
  <v-card class="app-outer">
    <template v-if="!nameEntered">
      <div class="mx-3">
        <v-text-field v-model="name" @keypress.enter.exact="nameEntered=true" label="Name" />
      </div>
    </template>
    <template v-else>
      <div class="mx-3">
        <v-text-field v-model="msg" @keypress.enter.exact="sendMessage" label="Message" />
      </div>
      <v-simple-table>
        <tbody>
          <tr v-for="(msg, index) in msgs" :key="index">
            <td>
              <strong>{{ msg.name }}</strong>
            </td>
            <td>
              {{ msg.text }}
            </td>
            <td>
              {{ msg.time }}
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </template>
  </v-card>
</template>

<script>
import io from 'socket.io-client'

export default {
  data() {
    return {
      msg: '',
      msgs: [],
      socket: '',
      name: '',
      nameEntered: false,
    }
  },
  mounted() {
    this.socket = io('/chat', { path: '/api/socket.io/' })
    this.socket.emit('join', this.$route.params.rid)
    this.socket.on('new-msg', msg => {
      this.msgs.unshift(msg)
    })
  },
  methods: {
    sendMessage() {
      this.msg = this.msg.trim()
      if (this.msg) {
        const message = {
          id: this.socket.id,
          name: this.name,
          text: this.msg,
          time: new Date().toLocaleString()
        }
        this.socket.emit('send-msg', message, this.$route.params.rid)
        this.msg = ''
      }
    }
  }
}
</script>
