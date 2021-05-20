import { Request, Response } from 'express'

const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// get:hello world
app.get('/api/get', (req: Request, res: Response) => {
  res.send('hello world')
})

export default app
