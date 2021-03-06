const express = require('express')
const app = express()

//RUTAS
app.use(require('./usuario'))
app.use(require('./login'))
app.use(require('./avatar'))
app.use(require('./pregunta'))
app.use(require('./formulario'))
app.use(require('./diagnostico'))
app.use(require('./areaProtegida'))
app.use(require('./representante'))
app.use(require('./establecimiento'))
app.use(require('./informe'))
app.use(require('./email'))
app.use(require('./actividad'))
//posiblemente sea deprecated
app.use(require('./busquedas'))

module.exports = app
