const express = require('express')
const redis = require('redis')
let client

async function initializeClient() {
  if (!client) {
    if (process.env.NODE_ENV === 'dev') {
      // Local redis server
      client = redis.createClient({
        host: '127.0.0.1',
        port: 6379,
      })
    } else {
      client = redis.createClient({
        // Remote redis server
        username: 'default',
        password: 'HZJQgqtpFHz132BTXFIcKQSuPDr9nYA0',
        socket: {
          host: 'redis-16893.crce178.ap-east-1-1.ec2.redns.redis-cloud.com',
          port: 16893,
        },
      })
    }
    client.on('error', (err) => console.log('Redis Client Error', err))
    await client.connect()
  }
}

initializeClient()

const router = express.Router()

router.get('/', async (req, res) => {
  await initializeClient()
  var posts = {}
  const keys = await client.keys(`${req.query.type}*`)
  for (var i = 0; i < keys.length; i++) {
    const value = await client.get(keys[i])
    posts[keys[i]] = value
  }
  res.status(200).send(posts)
})

router.post('/', async (req, res) => {
  await initializeClient()
  await client.set(req.body.key, req.body.value)
  res.status(200).send()
})

router.delete('/', async (req, res) => {
  await initializeClient()

  const key = req.body.key
  if (!key) {
    return res.status(400).send({ error: 'Key is required' }) // 400 Bad Request
  }

  const result = await client.del(key)
  if (result === 1) {
    // Key was successfully deleted
    res.status(200).send({ message: `Key '${key}' deleted successfully` })
  } else {
    // Key does not exist
    res.status(404).send({ error: `Key '${key}' not found` })
  }
})

// Shut down the Redis connection on termination
process.on('SIGINT', async () => {
  console.log('Shutting down server gracefully...')
  if (client) {
    await client.quit()
    console.log('Redis client disconnected')
  }
  process.exit(0)
})

module.exports = router
