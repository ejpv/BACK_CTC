const express = require('express')
const app = express()

//RUTAS
app.use(require('./usuario'))
app.use(require('./login'))
app.use(require('./avatar'))

module.exports = app
