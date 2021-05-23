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
    ioTicTacToe.to(roomId).emit('new-msg', msg)
  })

  socket.on('reset-game', (roomId: string) => {
    ioTicTacToe.to(roomId).emit('reset-game')
  })
})

server.listen(3304)
