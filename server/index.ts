import { Request, Response } from 'express'
import { Socket } from 'socket.io'

const app = require('express')()
const server = require("http").createServer(app)
const io   = require("socket.io")(server)


// get:hello world
app.get('/api/get', (req: Request, res: Response) => {
  res.send('hello world')
})

const ioChat = io.of('/chat')

ioChat.on('connection', (socket: Socket) => {

  socket.on('join', (roomId: string) => {
    socket.join(roomId)
  })

  socket.on('send-msg', (msg: string, roomId: string) => {
    ioChat.to(roomId).emit('new-msg', msg)
  })
})

const ioTicTacToe = io.of('/tic-tac-toe')

ioTicTacToe.on('connection', (socket: Socket) => {

  socket.on('join', (roomId: string, name: string) => {
    socket.join(roomId)
    ioTicTacToe.to(roomId).emit('new-member', name)
  })

  socket.on('send-msg', (roomId: string, msg: string) => {
    console.log(msg)
    ioTicTacToe.to(roomId).emit('new-msg', msg)
  })

  socket.on('reset-game', (roomId: string) => {
    ioTicTacToe.to(roomId).emit('reset-game')
  })
})

interface Loveletter {
  cards: number[],
  extra?: number,
  users: string[]
}

interface Message {
  action: string,
  number: number
}

const ioLoveletter = io.of('/loveletter')
let loveletters = new Map<string, Loveletter>()

ioLoveletter.on('connection', (socket: Socket) => {

  socket.on('join', (roomId: string, name: string) => {
    socket.join(roomId)
    let num = 1
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      if (!l.users.includes(socket.id)) {
        l.users.push(socket.id)
      }
      num = l.users.indexOf(socket.id)
      loveletters.set(roomId, l)
    } else {
      loveletters.set(roomId, { cards: [], users: [socket.id] })
    }
    ioLoveletter.to(roomId).emit('new-member', socket.id, name, num)
  })

  socket.on('game-start', (roomId: string) => {
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      const cards = [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]
      const index = Math.floor(Math.random() * 18)
      const extra = cards.splice(index, 1)[0]
      ioLoveletter.to(roomId).emit('game-start')
      ioLoveletter.adapter.rooms.get(roomId).forEach((sid: string) => {
        const msg = {
          action: 'set-hands',
          number: cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
        }
        ioLoveletter.to(sid).emit('new-msg', msg)
      })
      const msg = {
        action: 'draw-card',
        number: cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
      }
      ioLoveletter.to([...ioLoveletter.adapter.rooms.get(roomId)][0]).emit('new-msg', msg)
      l.cards = cards
      l.extra = extra
      loveletters.set(roomId, l)
    }
  })

  socket.on('send-msg', (roomId: string, msg: Message) => {
    ioLoveletter.to(roomId).emit('new-msg', msg, socket.id)
    if (msg.action === 'discard') {
      const l = loveletters.get(roomId)
      if (l !== undefined) {
        if (l.cards.length === 0) {
          const msg = {
            action: 'empty-deck',
            number: 0
          }
          ioLoveletter.to(roomId).emit('new-msg', msg, socket.id)
          return
        }
        let index = l.users.indexOf(socket.id) + 1
        if (index === l.users.length) {
          index = 0
        }
        const msg = {
          action: 'draw-card',
          number: l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0]
        }
        ioLoveletter.to(l.users[index]).emit('new-msg', msg)
      }
    }
  })

  socket.on('reset-game', (roomId: string) => {
    ioLoveletter.to(roomId).emit('reset-game')
  })

})

server.listen(3304)
