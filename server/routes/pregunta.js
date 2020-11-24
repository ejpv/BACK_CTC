const express = require('express')
const Pregunta = require('../models/pregunta')
const { verificarToken, verificarNotRepresentant, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

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

app.get('/api/preguntas', [verificarToken, verificarNotRepresentant], (req, res) => {
    Pregunta.find({ estado: true }).exec((err, preguntas) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        Pregunta.countDocuments({ estado: true }, (err, conteo) => {
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

app.put('/api/preguntas', [verificarToken, verificarNotRepresentant], (req, res) => { })

app.delete('/api/preguntas', [verificarToken, verificarNotRepresentant], (req, res) => { })

module.exports = app