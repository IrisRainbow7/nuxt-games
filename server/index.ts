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

interface User {
  id: string,
  name: string,
  hands: number[],
  discards: number[],
  isDead: boolean,
  protected: boolean,
  nextThreeDraw: boolean,
  logs: string[],
}

interface Loveletter {
  cards: number[],
  extra?: number,
  tmp: number[],
  users: User[],
  started: boolean,
  ruleDifferense6effect: boolean,
  use6: boolean,
  use1: boolean,
  action: string,
  actionUser: string,
  targetUser: string,
}

interface Message {
  action: string,
  number: number
}

const ioLoveletter = io.of('/loveletter')
let loveletters = new Map<string, Loveletter>()

ioLoveletter.on('connection', (socket: Socket) => {

  socket.on('join', (roomId: string, name: string) => {
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      if (l.started || l.users.length >= 4) {
        return
      } else if (l.users.find((u: User) => u.id === socket.id) === undefined) {
        socket.join(roomId)
        const user: User = {
          id: socket.id,
          name,
          hands: [],
          discards: [],
          isDead: false,
          protected: false,
          nextThreeDraw: false,
          logs: []
        }
        l.users.push(user)
        loveletters.set(roomId, l)
        ioLoveletter.to(roomId).emit('update-member', l.users)
      }
    } else {
      socket.join(roomId)
      const user: User = {
        id: socket.id,
        name,
        hands: [],
        discards: [],
        isDead: false,
        protected: false,
        nextThreeDraw: false,
        logs: [],
      }
      loveletters.set(roomId, { cards: [], users: [user], started: false, use6: false, use1: false, action: '', actionUser: '', targetUser: '', tmp: [], ruleDifferense6effect: false })
      ioLoveletter.to(roomId).emit('update-member', [user])
    }
  })

  socket.on('game-start', (roomId: string) => {
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      l.started = true
      l.cards = [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1]
      l.extra = l.cards.splice(Math.floor(Math.random() * 18), 1)[0]
      ioLoveletter.to(roomId).emit('game-start')
      l.users.forEach((u: User) => {
        u.hands = [l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0]]
        ioLoveletter.to(u.id).emit('update-hands', u.hands)
      })
      l.users[0].hands.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
      ioLoveletter.to(l.users[0].id).emit('update-hands', l.users[0].hands)
      loveletters.set(roomId, l)
    }
  })


  socket.on('discard', (roomId: string, num: number, id: string, num2: number) => {
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      const u = l.users.find(user => user.id === socket.id)
      if (u !== undefined && u.hands.includes(num)) {
        u.discards.push(u.hands.splice(u.hands.indexOf(num), 1)[0])
        u.logs.push(`${num}を捨てました`)
        ioLoveletter.to(u.id).emit('update-logs', u.logs)
        u.protected = false
        u.nextThreeDraw = false
        let skipAfterProcessing = false
        if (num === 9) {
          const u2 = l.users.find(user => user.id === id)
          if (u2 !== undefined && !u2.protected && l.cards.length > 0) {
            const card = l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0]
            u2.hands.push(card)
            u2.logs.push(`${u.name}の「皇帝」の効果で${card}を引きました`)
            ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
            l.users.forEach(user => {
              if (user.id !== u.id && user.id !== u2.id) {
                ioLoveletter.to(user.id).emit('show-hands', u.id, '9', u2.id, String(u2.hands))
              }
            })
            l.action = '9'
            l.actionUser = u.id
            l.targetUser = u2.id
            ioLoveletter.to(u.id).emit('request-action', '9', u2.hands)
            skipAfterProcessing = true
          }
        } else if (num === 8) {
          const tmp = u.hands
          const u2 = l.users.find(user => user.id === id)
          if (u2 !== undefined && !u2.protected) {
            u.hands = u2.hands
            u2.hands = tmp
            l.users.forEach(user => {
              if (user.id !== u.id && user.id !== u2.id) {
                user.logs.push(`${u.name}の「精霊」の効果で${u.name}と${u2.name}は手札を交換した`)
                ioLoveletter.to(user.id).emit('update-logs', user.logs)
              }
            })
            u.logs.push(`自分の「精霊」の効果で${u2.name}と手札を交換しました`)
            u2.logs.push(`${u.name}の「精霊」の効果で手札が交換されました`)
            ioLoveletter.to(u.id).emit('update-hands', u.hands)
            ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
            ioLoveletter.to(u.id).emit('update-logs', u.logs)
            ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
          }
        } else if (num === 7) {
          u.nextThreeDraw = true
        } else if (num === 6) {
          if (l.ruleDifferense6effect && !l.use6) {
            l.action = '6f'
            l.actionUser = u.id
            ioLoveletter.to(u.id).emit('request-action', '6f', [])
            skipAfterProcessing = true
          } else {
            l.action = '6s'
            l.actionUser = u.id
            ioLoveletter.to(u.id).emit('request-action', '6s', [])
            skipAfterProcessing = true
          }
          l.use6 = true
        } else if (num === 5) {
          const u2 = l.users.find(user => user.id === id)
          if (u2 !== undefined && !u2.protected && l.cards.length > 0) {
            const draw = l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0]
            u2.hands.push(draw)
            const discard = u2.hands.splice(Math.floor(Math.random() * 2), 1)[0]
            u2.discards.push(discard)
            l.users.forEach(user => {
              if (user.id !== u2.id) {
                user.logs.push(`${u.name}の「死神」の効果で${u2.name}は手札を1枚引いたあと1枚捨てた`)
                ioLoveletter.to(user.id).emit('update-logs', user.logs)
              }
            })
            u2.logs.push(`${u.name}の「死神」の効果で${draw}を引いたあと${discard}を捨てた`)
            ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
            ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
            if (discard === 6) {
              l.use6 = true
            } else if (discard === 1) {
              l.use1 = true
            } else if (discard === 10) {
              u2.discards.push(u2.hands.splice(0, 1)[0])
              if (l.extra !== undefined) {
                u2.hands = [l.extra]
              }
              ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
              l.users.forEach(user => {
                user.logs.push(`${u.name}の「死神」の効果で${u2.name}は「英雄」を捨てられたため転生した`)
                ioLoveletter.to(user.id).emit('update-logs', user.logs)
              })
            }
          }
        } else if (num === 4) {
          u.protected = true
        } else if (num === 3) {
          const u2 = l.users.find(user => user.id === id)
          if (u2 !== undefined && !u2.protected) {
            ioLoveletter.to(u.id).emit('show-hands', u.id, '3', u2.id, String(u2.hands))
            l.users.forEach(user => {
              user.logs.push(`${u.name}の「占い師」の効果で${u2.name}の手札を見た`)
              ioLoveletter.to(user.id).emit('update-logs', user.logs)
            })
          }
        } else if (num === 2) {
          const u2 = l.users.find(user => user.id === id)
          if (u2 !== undefined && !u2.protected) {
            let log = ''
            if (u2.hands[0] === num2) {
              if (num2 === 10) {
                u2.discards.push(u2.hands.splice(0, 1)[0])
                if (l.extra !== undefined) {
                  u2.hands = [l.extra]
                }
                ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
                log = (`${u.name}の「兵士」の効果で${u2.name}の手札を[${num2}]と予想し、正解したが「英雄」だったため転生した`)
              } else {
                u2.isDead = true
                u2.discards.push(u2.hands.splice(0, 1)[0])
                log = `${u.name}の「兵士」の効果で${u2.name}の手札を[${num2}]と予想し、正解したため${u2.name}は脱落した`
              }
            } else {
              log = `${u.name}の「兵士」の効果で${u2.name}の手札を[${num2}]と予想したが外れた`
            }
            l.users.forEach(user => {
              user.logs.push(log)
              ioLoveletter.to(user.id).emit('update-logs', user.logs)
            })
          }
        } else if (num === 1) {
          if (l.use1 && l.cards.length > 0) {
            l.action = '1sf'
            l.actionUser = u.id
            ioLoveletter.to(u.id).emit('request-action', '1sf', [])
            skipAfterProcessing = true
          }
          l.use1 = true
        }
        if (!skipAfterProcessing) {
          if (l.cards.length === 0) {
            ioLoveletter.to(roomId).emit('empty-deck')
            l.users.forEach(user => {
              user.discards.push(user.hands[0])
            })
            ioLoveletter.to(roomId).emit('update-member', l.users)
            loveletters.set(roomId, l)
            return
          }
          let nextUserIndex = l.users.indexOf(u)
          for (let i = 1; i < l.users.length; i++) {
            nextUserIndex += 1
            if (nextUserIndex === l.users.length) {
              nextUserIndex = 0
            }
            if (!l.users[nextUserIndex].isDead) {
              break
            }
          }
          const nextUser = l.users[nextUserIndex]
          if (nextUser.isDead) {
            ioLoveletter.to(roomId).emit('empty-deck')
            l.users.forEach(user => {
              user.discards.push(user.hands[0])
            })
            ioLoveletter.to(roomId).emit('update-member', l.users)
            loveletters.set(roomId, l)
            return
          }
          if (nextUser.nextThreeDraw && l.cards.length > 1) {
            l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
            if (l.cards.length > 0) {
              l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
            }
            if (l.cards.length > 0) {
              l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
            }
            l.action = '7'
            l.actionUser = u.id
            ioLoveletter.to(nextUser.id).emit('request-action', '7', l.tmp)
          } else {
            nextUser.hands.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
            ioLoveletter.to(nextUser.id).emit('update-hands', nextUser.hands)
          }
        }
        const _users: User[] = []
        l.users.forEach((_u: User) => {
          _users.push({
            id: _u.id,
            name: _u.name,
            hands: [],
            discards: _u.discards,
            isDead: _u.isDead,
            protected: false,
            nextThreeDraw: false,
            logs: []
          })
        })
        ioLoveletter.to(roomId).emit('update-member', _users)
        loveletters.set(roomId, l)
      }
    }
  })

  socket.on('response-action', (roomId: string, action:string, response: string) => {
    const l = loveletters.get(roomId)
    if (l !== undefined && l.action === action) {
      const u = l.users.find(user => user.id === l.actionUser)
      if (action === '6f') {
        const u2 = l.users.find(user => user.id === response)
        if (u !== undefined && u2 !== undefined && !u2.protected) {
          l.users.forEach(user => {
            if (user.id !== u.id && user.id !== u2.id) {
              user.logs.push(`${u.name}が「貴族」の効果で${u2.name}と手札を見せ合った`)
              ioLoveletter.to(user.id).emit('update-logs', user.logs)
            }
          })
          u.logs.push(`自分の「貴族」の効果で${u2.name}の手札を確認した`)
          u2.logs.push(`${u.name}の「貴族」の効果で${u.name}の手札を確認した`)
          ioLoveletter.to(u.id).emit('show-hands', u.id, action, u2.id, String(u2.hands))
          ioLoveletter.to(u2.id).emit('show-hands', u.id, action, u.id, String(u.hands))
          ioLoveletter.to(u.id).emit('update-logs', u.logs)
          ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
        }
      } else if (action === '6s') {
        const u2 = l.users.find(user => user.id === response)
        if (u !== undefined && u2 !== undefined && !u2.protected) {
          l.users.forEach(user => {
            if (user.id !== u.id && user.id !== u2.id) {
              user.logs.push(`${u.name}の「貴族」の効果で${u2.name}と手札を見せ合い、${u.hands[0] === u2.hands[0] ? '引き分けた' : u.hands[0] > u2.hands[0] ? `${u.name}が勝利した` : `${u2.name}が勝利した`}`)
              ioLoveletter.to(user.id).emit('update-logs', user.logs)
            }
          })
          u.logs.push(`自分の「貴族」の効果で${u2.name}と手札を見せ合い、${u.hands[0] === u2.hands[0] ? '引き分けた' : u.hands[0] > u2.hands[0] ? '勝利した' : '敗北した'}`)
          u2.logs.push(`${u.name}の「貴族」の効果で${u.name}と手札を見せ合い、${u.hands[0] === u2.hands[0] ? '引き分けた' : u.hands[0] < u2.hands[0] ? '勝利した' : '敗北した'}`)
          ioLoveletter.to(u.id).emit('show-hands', u.id, action, u2.id, String(u2.hands))
          ioLoveletter.to(u2.id).emit('show-hands', u.id, action, u.id, String(u.hands))
          ioLoveletter.to(u.id).emit('update-logs', u.logs)
          ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
          if (u.hands[0] > u2.hands[0]) {
            u2.isDead = true
            u2.discards.push(u2.hands.splice(0, 1)[0])
          } else if (u.hands[0] < u2.hands[0]) {
            u.isDead = true
            u.discards.push(u.hands.splice(0, 1)[0])
          } else {
            u.isDead = true
            u2.isDead = true
            u.discards.push(u.hands.splice(0, 1)[0])
            u2.discards.push(u2.hands.splice(0, 1)[0])
          }
        }
      } else if (action === '1sf') {
        const u2 = l.users.find(user => user.id === response)
        if (u !== undefined && u2 !== undefined && !u2.protected) {
          const card = l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0]
          u2.hands.push(card)
          u2.logs.push(`${u.name}の「少年」の効果で${card}を引きました`)
          ioLoveletter.to(u2.id).emit('update-logs', u2.logs)
          l.users.forEach(user => {
            if (user.id !== u.id && user.id !== u2.id) {
              ioLoveletter.to(user.id).emit('show-hands', u.id, '1', u2.id, String(u2.hands))
            }
          })
          ioLoveletter.to(u.id).emit('request-action', '1ss', u2.hands)
          l.action = '1ss'
          l.targetUser = response
          loveletters.set(roomId, l)
          return
        }
      } else if (action === '9' || action === '1ss') {
        const u2 = l.users.find(user => user.id === l.targetUser)
        if (u !== undefined && u2 !== undefined && u2.hands.includes(Number(response)) && !u2.protected) {
          const cardIndex = u2.hands.indexOf(Number(response))
          if (cardIndex !== undefined) {
            u2.discards.push(u2.hands.splice(u2.hands.indexOf(Number(response)), 1)[0])
            l.users.forEach(user => {
              user.logs.push(`${u.name}の「${action === '9' ? '皇帝' : '少年'}」の効果で${u2.name}の${response}が捨てさせられた`)
              ioLoveletter.to(user.id).emit('update-logs', user.logs)
            })
            ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
            if (response === '6') {
              l.use6 = true
            } else if (response === '1') {
              l.use1 = true
            } else if (action === '9' && response === '10') {
              u2.isDead = true
              u2.discards.push(u2.hands.splice(0, 1)[0])
              l.users.forEach(user => {
                user.logs.push(`${u2.name}の「英雄」が「皇帝」に捨てさせられたため${u2.name}は処刑されました`)
                ioLoveletter.to(user.id).emit('update-logs', user.logs)
              })
              ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
            } else if (action === '1ss' && response === '10') {
              u2.discards.push(u2.hands.splice(0, 1)[0])
              if (l.extra !== undefined) {
                u2.hands = [l.extra]
              }
              l.users.forEach(user => {
                user.logs.push(`${u2.name}の「英雄」が「少年」に捨てさせられたため${u2.name}は転生しました`)
                ioLoveletter.to(user.id).emit('update-logs', user.logs)
              })
              ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
            }
          }
        }
      } else if (action === '7') {
        const u2 = l.users.find(user => user.id === socket.id)
        if (u2 !== undefined && l.tmp.includes(Number(response))) {
          u2.hands.push(l.tmp.splice(l.tmp.indexOf(Number(response)), 1)[0])
          l.cards.push(l.tmp.splice(0, 1)[0])
          if (l.cards.length > 0) {
            l.cards.push(l.tmp.splice(0, 1)[0])
          }
          ioLoveletter.to(u2.id).emit('update-hands', u2.hands)
          l.users.forEach(user => {
            user.logs.push(`${u2.name}の「賢者」がで引くカードが選択された`)
            ioLoveletter.to(user.id).emit('update-logs', user.logs)
          })
          u2.nextThreeDraw = false
          l.action = ''
          l.actionUser = ''
          l.targetUser = ''
          return
        }
      }
      l.action = ''
      l.actionUser = ''
      l.targetUser = ''
      if (l.cards.length === 0) {
        ioLoveletter.to(roomId).emit('empty-deck')
        l.users.forEach(user => {
          user.discards.push(user.hands[0])
        })
        ioLoveletter.to(roomId).emit('update-member', l.users)
        loveletters.set(roomId, l)
      } else if (l.users.filter(user => !user.isDead).length === 1) {
        ioLoveletter.to(roomId).emit('empty-deck')
        l.users.forEach(user => {
          user.discards.push(user.hands[0])
        })
        ioLoveletter.to(roomId).emit('update-member', l.users)
        loveletters.set(roomId, l)
      } else if (u !== undefined) {
        let nextUserIndex = l.users.indexOf(u)
        for (let i = 1; i < l.users.length; i++) {
          nextUserIndex += 1
          if (nextUserIndex === l.users.length) {
            nextUserIndex = 0
          }
          if (!l.users[nextUserIndex].isDead) {
            break
          }
        }
        const nextUser = l.users[nextUserIndex]
        if (nextUser.nextThreeDraw && l.cards.length > 1) {
          l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
          if (l.cards.length > 0) {
            l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
          }
          if (l.cards.length > 0) {
            l.tmp.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
          }
          l.action = '7'
          l.actionUser = u.id
          ioLoveletter.to(nextUser.id).emit('request-action', '7', l.tmp)
        } else {
          nextUser.hands.push(l.cards.splice(Math.floor(Math.random() * l.cards.length), 1)[0])
          ioLoveletter.to(nextUser.id).emit('update-hands', nextUser.hands)
        }
        const _users: User[] = []
        l.users.forEach((_u: User) => {
          _users.push({
            id: _u.id,
            name: _u.name,
            hands: [],
            discards: _u.discards,
            isDead: _u.isDead,
            protected: false,
            nextThreeDraw: false,
            logs: []
          })
        })
        ioLoveletter.to(roomId).emit('update-member', _users)
        loveletters.set(roomId, l)
      }
    }
  })

  socket.on('reset-game', (roomId: string) => {
    const l = loveletters.get(roomId)
    if (l !== undefined) {
      l.cards = []
      l.started = false
      l.use6 = false
      l.use1 = false
      l.action = ''
      l.actionUser = ''
      l.targetUser = ''
      l.tmp = []
      l.ruleDifferense6effect = false
      loveletters.set(roomId, l)
    }
    ioLoveletter.to(roomId).emit('reset-game')
  })

})

server.listen(3304)
