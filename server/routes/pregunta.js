const express = require('express')
const Pregunta = require('../models/pregunta')
const Response = require('../utils/response')
const {
  verificarToken,
  verificarNotRepresentant
} = require('../middlewares/autentication')
const Formulario = require('../models/formulario')
const _ = require('underscore')
const app = express()

//crear una pregunta con 3 tipos de preguntas permitidas
app.post('/api/pregunta', [verificarToken, verificarNotRepresentant], async (req, res) => {
  let body = req.body

  let pregunta = new Pregunta({
    tipo: body.tipo,
    enunciado: body.enunciado,
    estado: body.estado
  })

  if (pregunta.tipo == 'SELECCION' || pregunta.tipo == 'MULTIPLE') {
    if (body.opciones) {
      pregunta.opciones = body.opciones
    } else {
      return Response.BadRequest(err, res, 'Las Opciones de la preguntas, son necesarias')
    }
  } else {
    pregunta.opciones = undefined
  }

  await pregunta.save((err, preguntaDB) => {
    if (err) return Response.BadRequest(err, res)

    return Response.GoodRequest(res, preguntaDB)
  })
})

//obtener todas las preguntas enviando el estado: true o false
app.get('/api/preguntas', verificarToken, async (req, res) => {
  // el estado por defecto es true, solo acepta estado falso por la url
  const estado = req.query.estado === 'false' ? false : true

  await Pregunta.find({ estado }).exec(async (err, preguntas) => {
    if (err) return Response.BadRequest(err, res)

    await Pregunta.countDocuments({ estado }, (err, conteo) => {
      if (err) return Response.BadRequest(err, res)
      Response.GoodRequest(res, preguntas, conteo)

    })
  })
})

//edita la información de una pregunta por id
app.put('/api/pregunta/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
  let id = req.params.id
  let body = _.pick(req.body, ['tipo', 'enunciado', 'opciones'])

  if (body.tipo == 'SELECCION' || body.tipo == 'MULTIPLE') {
    if (body.opciones == undefined) return Response.BadRequest(err, res, 'Las Opciones de la preguntas, son necesarias')

    //esto da true cuando opciones no es un array para postman necesita mas de un valor para ser array
    if (body.opciones.includes("")) return Response.BadRequest(err, res, 'No se aceptan opciones vacias o una sola opción')

  } else {

    //Si es SN no importa si vienen opciones, las vacia antes de editar
    body.opciones = []
  }
  await Pregunta.findById(id, async (err, preguntaDB) => {
    if (err) return Response.BadRequest(err, res)
    if (!preguntaDB) return Response.BadRequest(err, res, 'La pregunta no existe, id inválido')
    if (!preguntaDB.estado) return Response.BadRequest(err, res, 'La pregunta está actualmente borrada.')
    await Pregunta.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
      (err) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
  })
})

//eliminar una pregunta, cambiar el estado a false
app.delete('/api/pregunta/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: false
  }

  await Formulario.find({ pregunta: id }).exec(async (err, formularioDB) => {

    if (err) return Response.BadRequest(err, res)

    if (formularioDB[0] != undefined) {

      await Pregunta.findById(id, async (err, preguntaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!preguntaDB) return Response.BadRequest(err, res, 'La pregunta no existe, id inválido')
        if (!preguntaDB.estado) return Response.BadRequest(err, res, 'La pregunta está actualmente borrada.')
        await Pregunta.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
          })
      })
      
    } else {
      await Pregunta.findByIdAndRemove(id, (err, preguntaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!preguntaDB) return Response.BadRequest(err, res, 'La pregunta no existe, id inválido')

        Response.GoodRequest(res)
      });
    }
  })


})

//restaurar una pregunta cambiada a false
app.put('/api/pregunta/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
  let id = req.params.id

  let cambiarEstado = {
    estado: true
  }

  await Pregunta.findById(id, async (err, preguntaDB) => {
    if (err) return Response.BadRequest(err, res)
    if (!preguntaDB) return Response.BadRequest(err, res, 'La pregunta no existe, id inválido')
    if (preguntaDB.estado) return Response.BadRequest(err, res, 'La pregunta actualmente no está borrada.')
    await Pregunta.findByIdAndUpdate(id, cambiarEstado, (err) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res)
      })
  })
})

module.exports = app