const express = require('express')
const cors = require('cors')
const path = require('path')
const mongoose = require('mongoose')
const app = express()
const bodyParser = require('body-parser')
const { json } = require('express')
require('./config/config')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// cors para permitir conecciones
if (process.env.NODE_ENV !== 'production') app.use(cors())

// configuración de las rutas
app.use(require('./routes/index'))

// sandbox publico
app.use('/image', express.static(process.env.SANDBOX))
// Aplicación web
app.use(express.static(path.join(__dirname, '../public/client')))

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

mongoose.connection.on('error', console.error.bind(console, 'connection error:'))
mongoose.connection.once('open', function () {
  console.log('\tDB online')
})

app.listen(process.env.PORT, () => {
  console.log(`\x1b[36m\x1b[1mAplication:\x1b[0m\n\t${process.env.DOMAIN}`)
})
