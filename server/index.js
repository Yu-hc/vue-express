const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const app = express()
// middleware
app.use(cors())

app.use(bodyParser.json())

const review = require('./routes/api/review')
const book = require('./routes/api/book')

app.use('/api/review', review)
app.use('/api/book', book)

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(__dirname + '/dist/'))
    app.get('/.*/', (req, res) => {
        res.sendFile(__dirname + '/dist/index.html')
    })
}

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
