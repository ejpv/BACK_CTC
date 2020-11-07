const express = require('express')
const bcrypt = require('bcrypt')
const Usuario = require('../models/usuario')
const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//obtener todos los usuarios
//app.get('/usuarios', verificarToken, (req, res) => {
  app.get('/usuarios', (req, res) => {

  Usuario.find({ estado: true }, 'nombre apellido email rol estado activado')
    .exec((err, usuarios) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        })
      }
      Usuario.countDocuments({ estado: true }, (err, conteo) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            err
          })
        }

        res.json({
          ok: true,
          usuarios,
          total: conteo
        })
      })
    })
})

//ingresar un usuario
// app.post('/usuario', [verificarToken, verificarAdmin_Rol], (req, res) => {
  app.post('/usuario', (req, res) => {
  let body = req.body


  let usuario = new Usuario({
    nombre: body.nombre,
    apellido: body.apellido,
    email: body.email,
    rol: body.rol
  })

  if (!(body.password === undefined)) {
    usuario.password= bcrypt.hashSync(body.password, 10)
  }

  usuario.save((err, usuarioDB) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      })
    }

    res.json({
      ok: true,
      usuario: usuarioDB
    })
  })
})

//editar un usuario por id
// app.put('/usuario/:id', [verificarToken, verificarAdmin_Rol], (req, res) => {
  app.put('/usuario/:id', (req, res) => {
  let id = req.params.id

  //_.pick es filtrar y solo elegir esas del body
    //problema al editar email
  // let body = _.pick(req.body, ['nombre', 'apellido','email', 'rol',])
  let body = _.pick(req.body, ['nombre', 'apellido', 'rol'])

  Usuario.findByIdAndUpdate(
    id,
    body,
    { new: true, runValidators: true },
    (err, usuarioDB) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        })
      }

      res.json({
        ok: true,
        usuario: usuarioDB
      })
    }
  )
})

//eliminar un usuario
// app.delete('/usuario/:id', [verificarToken, verificarAdmin_Rol], (req, res) => {
  app.delete('/usuario/:id', (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: false
  }

  Usuario.findByIdAndUpdate(id, cambiarEstado, { new: true }, (err, usuarioBorrado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      })
    }

    if (!usuarioBorrado) {
      return res.status(400).json({
        ok: false,
        err: {
          message: 'El usuario no existe.'
        }
      })
    }

    if (usuarioBorrado.estado === false) {
      return res.status(400).json({
        ok: false,
        err: {
          message: 'El usuario está actualmente borrado.'
        }
      })
    }
    
    res.json({
      ok: true,
      usuario: usuarioBorrado
    })
  })
})

module.exports = app
