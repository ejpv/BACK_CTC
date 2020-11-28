const express = require('express')
const Response = require('../utils/response')
const bcrypt = require('bcrypt')
const Usuario = require('../models/usuario')
const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//obtener todos los usuarios enviandoles el estado
app.get('/api/usuarios', verificarToken, (req, res) => {

  // el estado por defecto es true, solo acepta estado falso por la url
  const estado = req.query.estado === 'false' ? false : true

  Usuario.find({ estado }, 'nombre apellido email rol estado activado avatar').exec(
    (err, usuarios) => {
      if (err) {
        return Response.BadRequest(err, res)
      }
      Usuario.countDocuments({ estado }, (err, conteo) => {
        if (err) {
          return Response.BadRequest(err, res)
        }
        Response.GoodRequest(res, usuarios, conteo)
      })
    }
  )
})

//ingresar un usuario
app.post('/api/usuario', [verificarToken, verificarAdmin_Rol], (req, res) => {
  let body = req.body

  let usuario = new Usuario({
    nombre: body.nombre,
    apellido: body.apellido,
    email: body.email,
    rol: body.rol
  })

  if (!(body.password === undefined)) {
    usuario.password = bcrypt.hashSync(body.password, 10)
  }

  usuario.save((err, usuarioDB) => {
    if (err) {
      return Response.BadRequest(err, res)
    }

    return Response.GoodRequest(res, usuarioDB)
  })
})

//editar un usuario por id
app.put('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], (req, res) => {
  let id = req.params.id

  //_.pick es filtrar y solo elegir esas del body
  let body = _.pick(req.body, ['nombre', 'apellido', 'rol', 'email'])

  Usuario.findByIdAndUpdate(
    id,
    body,
    { new: true, runValidators: true, context: 'query' },
    (err, usuarioDB) => {
      if (err) {
        return Response.BadRequest(err, res)
      }
      if (!usuarioDB) {
        return Response.BadRequest(err, res, 'No se encontró al usuario, id inválido')
      }
      if (usuarioDB.estado == false) {
        return Response.BadRequest(err, res, 'El usuario está actualmente Borrado')
      }
      Response.GoodRequest(res)
    }
  )
})

//eliminar un usuario
app.delete('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: false
  }

  Usuario.findByIdAndUpdate(id, cambiarEstado, (err, usuarioBorrado) => {
    if (err) {
      return Response.BadRequest(err, res)
    }

    if (!usuarioBorrado) {
      return Response.BadRequest(err, res, 'El usuario no existe')
    }

    if (usuarioBorrado.estado === false) {
      return Response.BadRequest(err, res, 'El usuario está actualmente borrado.')
    }

    Response.GoodRequest(res)
  })
})

//restaurar un usuario
app.put('/api/usuario/:id/restaurar', [verificarToken, verificarAdmin_Rol], (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: true
  }

  Usuario.findByIdAndUpdate(id, cambiarEstado, { new: true }, (err, usuarioRestaurado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      })
    }

    if (!usuarioRestaurado) {
      return res.status(400).json({
        ok: false,
        err: {
          message: 'El usuario no existe.'
        }
      })
    }

    res.status(204).json()
  })
})

//activar un usuario
/*app.put('/api/usuario/:id/activar', (req, res) => {
  let id = req.params.id

  let cambiarActivo = {
    activado: true
  }

  Usuario.findByIdAndUpdate(id, cambiarActivo, { new: true }, (err, usuarioActivado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err
      })
    }

    if (!usuarioActivado) {
      return res.status(400).json({
        ok: false,
        err: {
          message: 'El usuario no existe.'
        }
      })
    }

    res.json({
      ok: true,
      usuario: usuarioActivado
    })
  })
})*/

module.exports = app
