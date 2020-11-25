const express = require('express')
const Pregunta = require('../models/pregunta')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//crear una pregunta con 3 tipos de preguntas permitidas
app.post('/api/pregunta', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let pregunta = new Pregunta({
        tipo: body.tipo,
        enunciado: body.enunciado,
        estado: body.estado
    })

    if (pregunta.tipo == 'SELECCION' || pregunta.tipo == 'MULTIPLE') {
        if (body.opciones != undefined) {
            pregunta.opciones = body.opciones;
        } else {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Las Opciones de la preguntas, son necesarias'
                }
            })
        }
    } else {
        pregunta.opciones = undefined
    }

    pregunta.save((err, preguntaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            pregunta: preguntaDB
        })
    })
})

//obtener todas las preguntas enviando el estado: true o false
app.get('/api/preguntas/:estado', verificarToken, (req, res) => {
    let estado = req.params.estado;
    Pregunta.find({ estado }).exec((err, preguntas) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        Pregunta.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                total: conteo,
                preguntas
            })
        })
    })
})

//edita la información de una pregunta por id
app.put('/api/pregunta/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['tipo', 'enunciado', 'opciones'])

    if (body.tipo == 'SELECCION' || body.tipo == 'MULTIPLE') {
        if (body.opciones == undefined) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Las Opciones de la preguntas, son necesarias'
                }
            })
        }

        //esto da true cuando opciones no es un array para postman necesita mas de un valor para ser array
        if (body.opciones.includes("")) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se aceptan opciones vacias'
                }
            })
        }
    } else {
        //Si es SN no importa si vienen opciones, las vacia antes de editar
        body.opciones = []
    }

    Pregunta.findByIdAndUpdate(id, body, { new: true, runValidators: true, context: 'query' },
        (err, preguntaDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                pregunta: preguntaDB
            })
        }
    )
})

//eliminar una pregunta, cambiar el estado a false
app.delete('/api/pregunta/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    Pregunta.findByIdAndUpdate(id, cambiarEstado, { new: true }, (err, preguntaEliminada) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        if (!preguntaEliminada) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'La pregunta no existe.'
                }
            })
        }

        if (preguntaEliminada.estado === false) {
            return res.status(400).json({
              ok: false,
              err: {
                message: 'La pregunta está actualmente borrada.'
              }
            })
          }

        res.json({
            ok: true,
            pregunta: preguntaEliminada
        })
    })
})

module.exports = app