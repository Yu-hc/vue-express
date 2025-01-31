const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const app = express()
// middleware
app.use(cors())

app.use(bodyParser.json())

const posts = require('./routes/api/posts')
const books = require('./routes/api/books')

app.use('/api/posts', posts)
app.use('/api/books', books)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(__dirname + '/public/'))
  app.get('/.*/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
  })
}

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
