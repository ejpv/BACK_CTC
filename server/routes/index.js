const express = require('express')
const app = express()

//RUTAS
app.use(require('./usuario'));
app.use(require('./login'));

module.exports = app
