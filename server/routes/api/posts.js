const express = require('express')
const redis = require('redis')

const router = express.Router()

router.get('/', async (req, res) => {
  const client = await connectClient()
  const posts = await client.get('foo')
  res.send(posts)
  res.status(200).send()
})

router.post('/', async (req, res) => {
  const client = await connectClient()
  await client.set('foo', req.body.text)
  res.status(200).send()
})

async function connectClient() {
  const client = redis.createClient({
    username: 'default',
    password: 'HZJQgqtpFHz132BTXFIcKQSuPDr9nYA0',
    socket: {
      host: 'redis-16893.crce178.ap-east-1-1.ec2.redns.redis-cloud.com',
      port: 16893,
    },
  })
  client.on('error', (err) => console.log('Redis Client Error', err))

  await client.connect()
  return client
}

module.exports = router
