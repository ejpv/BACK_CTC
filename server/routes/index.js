const express = require('express')
const app = express()

//RUTAS
app.use(require('./usuario'))
app.use(require('./login'))
app.use(require('./avatar'))
app.use(require('./pregunta'))
app.use(require('./formulario'))
//app.use(require('./formularioRepresentante'))
app.use(require('./lugar'))
app.use(require('./areaProtegida'))
app.use(require('./representante'))
app.use(require('./establecimiento'))

module.exports = app
