const express = require('express')
const Response = require('../utils/response')
const bcrypt = require('bcrypt')
const Usuario = require('../models/usuario')
const Representante = require('../models/representante')
const { verificarToken, verificarAdmin_Rol, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()
const jwt = require('jsonwebtoken')

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

  await usuario.save((err, usuarioDB) => {
    if (err) return Response.BadRequest(err, res)
    return Response.GoodRequest(res, usuarioDB)
  })
})

//editar un usuario por id
app.put('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  //_.pick es filtrar y solo elegir esas del body
  let body = _.pick(req.body, ['nombre', 'apellido', 'rol', 'email'])

  await Usuario.findById(id, async (err, usuarioDB) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioDB) return Response.BadRequest(err, res, 'No se encontró al Usuario, id inválido')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El Usuario está actualmente Borrado')

    //Si cambia el email, hay que volver a confirmar el correo
    if (body.email != usuarioDB.email) {
      body.activado = false
    }
    if (body.rol != usuarioDB.rol && usuarioDB.rol === 'REPRESENTANT_ROLE') {
      await Representante.find({ usuario: id }).exec(async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (representanteDB[0]) return Response.BadRequest(err, res, 'El Usuario está actualmente asignado a un Representante')

        await Usuario.findByIdAndUpdate(id, body, { runValidators: true, context: 'query', new: true }, (err, userDB) => {
          if (err) return Response.BadRequest(err, res)
          Response.GoodRequest(res)
        })
      })
    } else {
      await Usuario.findByIdAndUpdate(id, body, { runValidators: true, context: 'query', new: true }, (err, userDB) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
    }
  })
})

//editar el usuario logeado
app.put('/api/usuario', [verificarToken], async (req, res) => {
  //Obteniendo el id del usuario logeado
  let idloged = req.usuario._id

  //_.pick es filtrar y solo elegir esas del body
  let body = _.pick(req.body, ['nombre', 'apellido', 'rol', 'email'])


  await Usuario.findById(idloged, async (err, usuarioDB) => {

    if (err) return Response.BadRequest(err, res)
    if (!usuarioDB) return Response.BadRequest(err, res, 'No se encontró al Usuario, id inválido')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El Usuario está actualmente Borrado')

    //Si cambia el email, hay que volver a confirmar el correo
    if (body.email != usuarioDB.email) {
      body.activado = false
    }

    await Usuario.findByIdAndUpdate(idloged, body, { runValidators: true, context: 'query', new: true }, (err, userDB) => {
      if (err) return Response.BadRequest(err, res)

      //Si el usuario edita su propio perfil, toca renovar el token para que tenga la inf al día
      let token = jwt.sign(
        {
          usuario: userDB
        },
        process.env.SEED_TOKEN,
        { expiresIn: process.env.CADUCIDAD_TOKEN }
      )

      let exp = jwt.decode(token).exp

      res.json({
        ok: true,
        usuario: userDB,
        token,
        expireAt: exp
      })
    })

  })
})

//eliminar un usuario
app.delete('/api/usuario/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: false
  }
  await Usuario.findById(id, async (err, usuarioBorrado) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioBorrado) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioBorrado.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado.')
    await Usuario.findByIdAndUpdate(id, cambiarEstado, (err) => {
      if (err) return Response.BadRequest(err, res)
      Response.GoodRequest(res)
    })
  })
})

//restaurar un usuario
app.put('/api/usuario/:id/restaurar', [verificarToken, verificarAdmin_Rol], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: true
  }
  await Usuario.findById(id, async (err, usuarioRestaurado) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioRestaurado) return Response.BadRequest(err, res, 'El usuario no existe')
    if (usuarioRestaurado.estado) return Response.BadRequest(err, res, 'El usuario no está borrado.')
    await Usuario.findByIdAndUpdate(id, cambiarEstado, (err) => {
      if (err) return Response.BadRequest(err, res)
      Response.GoodRequest(res)
    })
  })
})

//activar un usuario
app.post('/api/usuario/activar', verificarToken, async (req, res) => {
  const token = req.headers.token
  const { password } = req.body
  let id = req.usuario._id
  let activarUsuario = {
    activado: true,
    password: bcrypt.hashSync(password, 10),
    verificacionToken: null
  }

  await Usuario.findById(id).exec(async (err, usuarioDB) => {
    if (!usuarioDB) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado')
    if (token == usuarioDB.verificacionToken) {
      await Usuario.findByIdAndUpdate(id, activarUsuario, (err) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
    } else {
      return Response.BadRequest(null, res, 'El token no es el correcto')
    }
  })
})

//Ruta para solo confirmar el correo elctrónico cuando el usuario ya tiene pass definida
app.post('/api/usuario/confirmarEmail', verificarToken, async (req, res) => {
  const token = req.headers.token
  let id = req.usuario._id
  let activarUsuario = {
    activado: true,
    verificacionToken: null
  }

  await Usuario.findById(id).exec(async (err, usuarioDB) => {
    if (!usuarioDB) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado')
    if (token == usuarioDB.verificacionToken) {
      await Usuario.findByIdAndUpdate(id, activarUsuario, (err) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
    } else {
      return Response.BadRequest(null, res, 'El token no es el correcto')
    }
  })
})

//reestablecer contraseña
app.post('/api/usuario/password', verificarToken, async (req, res) => {
  const token = req.headers.token;
  const { password } = req.body
  let cambiarPass = {
    password: bcrypt.hashSync(password, 10),
    verificacionToken: null
  }
  let id = req.usuario._id

  await Usuario.findById(id).exec(async (err, usuarioDB) => {
    if (!usuarioDB) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado')
    if (token == usuarioDB.verificacionToken) {
      await Usuario.findByIdAndUpdate(id, cambiarPass, (err) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
    } else {
      return Response.BadRequest(null, res, 'El token no es el correcto')
    }
  })
})

//Cambiar la contraseña con el usuario dentro de la app
app.post('/api/usuario/changePass', verificarToken, async (req, res) => {
  const { password } = req.body
  let id = req.usuario._id
  let newPass = {
    password: bcrypt.hashSync(password, 10),
  }

  await Usuario.findById(id).exec(async (err, usuarioDB) => {
    if (err) return Response.BadRequest(err, res)
    if (!usuarioDB) return Response.BadRequest(err, res, 'El usuario no existe')
    if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente borrado')
    await Usuario.findByIdAndUpdate(id, newPass, (err) => {
      if (err) return Response.BadRequest(err, res)
      Response.GoodRequest(res)
    })
  })
})

module.exports = app


