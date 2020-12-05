const express = require('express')
const Response = require('../utils/response')
const bcrypt = require('bcrypt')
const Usuario = require('../models/usuario')
const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//obtener todos los usuarios enviandoles el estado
app.get('/api/usuarios', verificarToken, async (req, res) => {

  // el estado por defecto es true, solo acepta estado falso por la url
  const estado = req.query.estado === 'false' ? false : true

  await Usuario.find({ estado }, 'nombre apellido email rol estado activado avatar').exec(
    async (err, usuarios) => {
      if (err) return Response.BadRequest(err, res)

      await Usuario.countDocuments({ estado }, (err, conteo) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res, usuarios, conteo)
      })
    }
  )
})

//ingresar un usuario
app.post('/api/usuario', [verificarToken, verificarAdmin_Rol], async (req, res) => {
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

  await usuario.save((err, usuarioDB) => {
    if (err) return Response.BadRequest(err, res)
    return Response.GoodRequest(res, usuarioDB)
  })
})

//editar un usuario por id
app.put('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  //_.pick es filtrar y solo elegir esas del body
  let body = _.pickasync(req.body, ['nombre', 'apellido', 'rol', 'email'])

  await Usuario.findByIdAndUpdate(
    id,
    body,
    { new: true, runValidators: true, context: 'query' },
    (err, usuarioDB) => {
      if (err) return Response.BadRequest(err, res)
      if (!usuarioDB) return Response.BadRequest(err, res, 'No se encontró al usuario, id inválido')
      if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente Borrado')
      Response.GoodRequest(res)
    }
  )
})

//eliminar un usuario
app.delete('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: false
  }

  await Usuario.findByIdAndUpdate(id, cambiarEstado, (err, usuarioBorrado) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioBorrado) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioBorrado.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado.')
    Response.GoodRequest(res)
  })
})

//restaurar un usuario
app.put('/api/usuario/:id/restaurar', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: true
  }

  await Usuario.findByIdAndUpdate(id, cambiarEstado, { new: true }, (err, usuarioRestaurado) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioRestaurado) return Response.BadRequest(err, res, 'El usuario no existe')
    if (usuarioRestaurado.estado) return Response.BadRequest(err, res, 'El usuario no está borrado.')
    
    Response.GoodRequest(res)
  })
})

//activar un usuario
/*app.put('/api/usuario/:id/activar', async (req, res) => {
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
