const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const express = require('express')
require('dotenv').config()

const uri = `mongodb+srv://ntusfa:${process.env.MONGO_PASSWORD}@ntusfa.ffgku3g.mongodb.net/?retryWrites=true&w=majority&appName=NTUSFA`
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client

async function initializeClient() {
	if (client) return
	client = new MongoClient(uri, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		},
	})
	await client.connect()
	await client.db('admin').command({ ping: 1 })
	console.log('Pinged your deployment. You successfully connected to MongoDB!')
}

initializeClient()

let booksCache

let isUpdatingCache = false
// store the book data in cache so that the IO will be faster
async function updateCache() {
	if (isUpdatingCache) return // Skip if already updating
	isUpdatingCache = true
	try {
		// Ensure client is initialized
		await initializeClient()
		// Access the 'ntusfa-web' database and 'books' collection
		const database = client.db('ntusfa-web')
		const booksCollection = database.collection('books')
		// Fetch all documents from the 'books' collection
		const books = await booksCollection.find({}).toArray()
		booksCache = books.reduce((cache, book) => {
			cache[book._id.toString()] = book
			return cache
		}, {})
		console.log('Books fetched successfully')
	} catch (error) {
		console.error('Error fetching books:', error)
		throw error
	}

	isUpdatingCache = false
}

updateCache()

const router = express.Router()

router.get('/', async (req, res) => {
	if (!booksCache) await updateCache()
	res.status(200).send(booksCache)
	updateCache()
})

router.post('/', async (req, res) => {
	if (!booksCache) await updateCache()
	// booksCache[req.body.key] = req.body.value

	const _id = req.body.key
	const updateData = req.body.value
	console.log(updateData)
	// client.set(req.body.key, req.body.value)
	const database = client.db('ntusfa-web')
	const booksCollection = database.collection('books')
	console.log('Updating book with _id:', _id)
	const result = await booksCollection.updateOne(
		{ _id: new ObjectId(_id) }, // Convert _id to ObjectId
		{ $set: updateData }, // Update specified fields
		{ upsert: false } // Do not create a new document if _id doesn't exist
	)
	if (result.matchedCount === 0) {
		return res.status(404).json({ inflight_error: 'Book not found' })
	}
	// Update the cache with the new data
	const updatedBook = await booksCollection.findOne({ _id: new ObjectId(_id) })
	booksCache[_id.toString()] = updatedBook // Update cache with the new document
	console.log('Updated book in cache:', booksCache[_id.toString()])
	res.status(200).json({ message: 'Book updated successfully', book: updatedBook })
})

// The following code is for deleting a book, not implemented yet
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
		console.log('MongoDB client disconnected')
	}
	process.exit(0)
})

module.exports = router
