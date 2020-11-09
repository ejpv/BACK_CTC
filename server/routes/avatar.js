const express = require('express')
const Usuario = require('../models/usuario')
const Response = require('../utils/response')
const Random = require('../utils/random')
const multer = require('multer')
const { verificarToken } = require('../middlewares/autentication')
const app = express()

// Agregar avatar al usuario
app.post('/api/avatar/usuario/:id', [verificarToken], (req, res) => {
  const usuarioId = req.params.id
  Usuario.findById(usuarioId, (err, usuario) => {
    Response.BadRequest(err, res)

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
      Response.BadRequest(err, res)
      const url = process.env.DOMAIN + '/image/' + req.file.filename

      Usuario.findByIdAndUpdate(
        usuarioId,
        { avatar: url },
        { new: true, runValidators: true },
        err => {
          Response.BadRequest(err, res)
          res.json({
            ok: true,
            url
          })
        }
      )
    })
  })
})

module.exports = app
