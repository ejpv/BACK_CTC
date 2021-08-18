const express = require('express')
const Response = require('../utils/response')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Usuario = require('../models/usuario')
const app = express()

// logeo de un usuario
app.post('/api/login', async (req, res) => {
  const body = req.body

  //Email y contraseña requridos.
  if (!(body.email && body.password)) {
    return Response.BadRequest(null, res, 'Email y contraseña Requeridos')
  }

  await Usuario.findOne({ email: body.email }, (err, usuarioDb) => {
    if (err) return Response.BadRequest(err, res)

    //buscando el email
    if (!usuarioDb) return Response.BadRequest(err, res, 'Correo Incorrecto')

    //usuario borrado
    if (!usuarioDb.estado) return Response.BadRequest(err, res, 'Usuario actualmente borrado')

    //comparar contraseña encriptandola y comparando la encriptación
    if (!bcrypt.compareSync(body.password, usuarioDb.password)) return Response.BadRequest(err, res, 'Contraseña Incorrecta')

    //generar token
    //let token = jwt.sign({ usuario: usuarioDb }, process.env.SEED_TOKEN, process.env.CADUCIDAD_TOKEN);
    let token = jwt.sign(
      {
        usuario: usuarioDb
      },
      process.env.SEED_TOKEN,
      { expiresIn: process.env.CADUCIDAD_TOKEN }
    )
    
    let exp = jwt.decode(token).exp

    //respuesta
    res.json({
      ok: true,
      usuario: usuarioDb,
      token,
      expireAt: exp
    })
  })
})

module.exports = app
