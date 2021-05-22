import { Request, Response } from 'express'
import { Socket } from 'socket.io'

const app = require('express')()
const server = require("http").createServer(app)
const io   = require("socket.io")(server)


// get:hello world
app.get('/api/get', (req: Request, res: Response) => {
  res.send('hello world')
})

io.on('connection', (socket: Socket) => {

  socket.on('join', (roomId: string) => {
    socket.join(roomId)
  })

  // send-msgイベントを受け取ったらブロードキャストする
  socket.on('send-msg', (msg: string, roomId: string) => {
    io.to(roomId).emit('new-msg', msg)
  })
})

server.listen(3304)
