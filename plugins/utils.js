import Vue from 'vue'

Vue.prototype.$utils = {
  createRandomID: () => [...Array(8)].map(()=>'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*62)]).join('')
}
