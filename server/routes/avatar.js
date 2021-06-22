const express = require('express')
const Usuario = require('../models/usuario')
const Response = require('../utils/response')
const Random = require('../utils/random')
const multer = require('multer')
const { verificarToken } = require('../middlewares/autentication')
const app = express()

// Agregar avatar al usuario
app.post('/api/avatar/usuario/:id', [verificarToken], (req, res) => {
  const id = req.params.id
  Usuario.findById(id, (err, usuarioDB) => {
    if (err) {
      return Response.BadRequest(err, res)
    }

    if (!usuarioDB) {
      return Response.BadRequest(err, res, 'No existe el usuario, id inválido')
    }

    // configuración del almacenamiento
    var storage = multer.diskStorage({
      // destino de la imagen
      destination: function (req, file, cb) {
        cb(null, process.env.SANDBOX)
      },
      // Nombre de la imagen
      filename: function (req, file, cb) {
        cb(null, Random.filename(file.originalname.split('.').pop()))
      }
    })

    const upload = multer({ storage }).single('avatar')

    // actualizar la url del avatar
    upload(req, res, err => {
      if (err) {
        return Response.BadRequest(err, res)
      }

      if (!req.file) {
        return Response.BadRequest(err, res, 'No se pudo encontrar el Archivo')
      }
      const url = process.env.DOMAIN + '/image/' + req.file.filename

      console.log(process.env.DOMAIN);
      console.log(url);

      Usuario.findByIdAndUpdate(
        id,
        { avatar: url },
        { new: true, runValidators: true },
        (err, user) => {
          if (err) {
            return Response.BadRequest(err, res)
          }
          res.json({
            ok: true,
            usuario: user,
            url
          })
        }
      )
    })
  })
})

module.exports = app
