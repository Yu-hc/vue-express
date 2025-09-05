const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const app = express()
// middleware
app.use(cors())

app.use(bodyParser.json())

const reviews = require('./routes/api/reviews')
const book = require('./routes/api/book')
const board = require('./routes/api/board')
const events = require('./routes/api/events')
const records = require('./routes/api/records')

app.use('/api/reviews', reviews)
app.use('/api/book', book)
app.use('/api/events', events)
app.use('/api/board', board)
app.use('/api/records', records)

// Please comment the following lines if you have not built the frontend
// if (process.env.NODE_ENV === 'production') {
// 	app.use(express.static(__dirname + '/dist/'))
// 	app.get('/.*/', (req, res) => {
// 		res.sendFile(__dirname + '/dist/index.html')
// 	})
// }

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
