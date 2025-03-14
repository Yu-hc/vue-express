const express = require('express')
const redis = require('redis')
let client
let reviewsCache

async function initializeClient() {
    if (client) return

    client = redis.createClient({
        username: 'default',
        password: 'khAeLNdfuu0Tw9DStuak0NvksyzG9xc9',
        socket: {
            host: 'redis-18745.crce178.ap-east-1-1.ec2.redns.redis-cloud.com',
            port: 18745,
        },
    })

    client.on('error', (err) => console.log('Redis Client Error', err))
    await client.connect()
}

initializeClient()

let isUpdatingCache = false
// store the book data in cache so that the IO will be faster
async function updateCache() {
    if (isUpdatingCache) return // Skip if already updating
    isUpdatingCache = true
    await initializeClient()
    var reviews = {}
    var keys_ = await client.keys(`*REVIEW:*`)
    var keys = Array.from(keys_)
    keys.sort()
    for (var i = 0; i < keys.length; i++) {
        const value = await client.get(keys[i])
        reviews[keys[i]] = value
    }
    reviewsCache = reviews
    isUpdatingCache = false
}

updateCache()

const router = express.Router()

router.get('/', async (req, res) => {
    await initializeClient()
    if (!reviewsCache) {
        updateCache()
    }
    res.status(200).send(reviewsCache)
    updateCache()
})

router.post('/', async (req, res) => {
    await initializeClient()
    if (!reviewsCache) await updateCache()
    reviewsCache[req.body.key] = req.body.value
    res.status(200).send()
    client.set(req.body.key, req.body.value)
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
