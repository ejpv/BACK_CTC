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
    peso: body.peso
  })

  if (pregunta.tipo == 'SELECCION' || pregunta.tipo == 'MULTIPLE') {
    if (!body.opciones) return Response.BadRequest(null, res, 'Las Opciones de la preguntas, son necesarias')

    pregunta.opciones = body.opciones

  } else {

    pregunta.opciones = undefined

    if (pregunta.tipo == 'COMPLEX') {
      if (!body.encabezado) return Response.BadRequest(null, res, 'El encabezado de la pregunta, es necesario')
      if (!body.formato) return Response.BadRequest(null, res, 'El formato de la pregunta, es necesario')

      pregunta.encabezado = body.encabezado
      pregunta.formato = body.formato

    }
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

  await Pregunta.find({ estado }).sort({ enunciado: "desc" }).exec(async (err, preguntas) => {
    if (err) return Response.BadRequest(err, res)

    //FUNCION PARA ORDENAR EL ARRAY ALFABETICAMENTE
    preguntas.sort(function (a, b) {
      if (a.enunciado.toLowerCase() > b.enunciado.toLowerCase()) {
        return 1
      }
      if (a.enunciado.toLowerCase() < b.enunciado.toLowerCase()) {
        return -1
      }
      // a must be equal to b
      return 0
    })

    await Pregunta.countDocuments({ estado }, (err, conteo) => {
      if (err) return Response.BadRequest(err, res)
      Response.GoodRequest(res, preguntas, conteo)

    })
  })
})

//edita la información de una pregunta por id
app.put('/api/pregunta/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
  let id = req.params.id
  let body = _.pick(req.body, ['tipo', 'enunciado', 'opciones', 'peso', 'categoria', 'formato', 'encabezado'])

  if (body.tipo == 'SELECCION' || body.tipo == 'MULTIPLE') {
    if (!body.opciones) return Response.BadRequest(err, res, 'Las Opciones de la preguntas, son necesarias')

  } else {
    //Si es SN no importa si vienen opciones, las vacia antes de editar
    body.opciones = undefined

    if (body.tipo == 'COMPLEX') {
      if (!body.encabezado) return Response.BadRequest(err, res, 'El encabezado de la pregunta es necesario')
      if (!body.formato) return Response.BadRequest(err, res, 'El formato de la pregunta es necesario')
    }

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
      await Pregunta.findById(id, async (err, preguntaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!preguntaDB) return Response.BadRequest(err, res, 'La pregunta no existe, id inválido')

        await Pregunta.findByIdAndRemove(id, (err) => {
          if (err) return Response.BadRequest(err, res)

          Response.GoodRequest(res)
        })
      })
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