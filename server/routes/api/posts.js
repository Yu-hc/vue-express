const express = require('express')
const redis = require('redis')

let client

async function initializeClient() {
  if (!client) {
    if (process.env.NODE_ENV === 'dev') {
      client = redis.createClient({
        host: '127.0.0.1', // Local Redis server
        port: 6379,
      })
    } else {
      client = redis.createClient({
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
  const keys = await client.keys('*')
  //   console.log('keys',keys)
  for (var i = 0; i < keys.length; i++) {
    const value = await client.get(keys[i])
    posts[keys[i]] = value
  }
  console.log('posts', posts)
  res.send(posts)

  res.status(100).send()
})

router.post('/', async (req, res) => {
  await initializeClient()
  await client.set(req.body.key, req.body.value)
  res.status(200).send()
})

// Gracefully shut down the Redis connection on termination
process.on('SIGINT', async () => {
  console.log('Shutting down server gracefully...')
  // Close the Redis client connection
  if (client) {
    await client.quit()
    console.log('Redis client disconnected')
  }
  process.exit(0)
})

module.exports = router
