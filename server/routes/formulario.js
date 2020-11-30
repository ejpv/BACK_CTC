const express = require('express');
const Response = require('../utils/response')
const Formulario = require('../models/formulario');
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication');
const _ = require('underscore')
const app = express();

//crear formulario
app.post('/api/formulario', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let formulario = new Formulario({
        tipo: body.tipo,
        pregunta: body.pregunta,
        realizadoPor: req.usuario._id
    })

    formulario.save((err, formularioDB) => {
        if (err) {
            return Response.BadRequest(err, res)
        }
        Response.GoodRequest(res, formularioDB)
    })
})

//obtener todos los formularios
app.get('/api/formularios', [verificarToken, verificarNotRepresentant], (req, res) => {

    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Formulario.find({ estado })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'pregunta', model: 'pregunta' })
        .exec((err, formularios) => {

            if (err) {
                return Response.BadRequest(err, res)
            }

            Formulario.countDocuments({ estado }, (err, conteo) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }

                Response.GoodRequest(res, formularios, conteo)
            })
        })
})

//obtener un formulario por id
app.get('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {

    let id = req.params.id

    Formulario.findById(id)
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'pregunta', model: 'pregunta' })
        .exec((err, formularioDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!formularioDB) {
                return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
            }

            //Si es true no pasa, si es false, llega y da el res
            if (!formularioDB.estado) {
                return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')
            }

            Response.GoodRequest(res, formularioDB)
        })
})

//editar un formulario por id
app.put('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['tipo', 'pregunta', 'realizadoPor'])

    if (body.pregunta == '') {
        return Response.BadRequest(null, res, 'El formulario debe tener preguntas')
    } else {

        Formulario.findByIdAndUpdate(
            id,
            body,
            { runValidators: true, context: 'query' },
            (err, formularioDB) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }

                if (!formularioDB) {
                    return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                }

                if (formularioDB.estado === false) {
                    return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')
                }

                Response.GoodRequest(res)
            }
        )
    }
})

//eliminar un formulario por id
app.delete('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    Formulario.findByIdAndUpdate(id, cambiarEstado, (err, formularioBorrado) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        if (!formularioBorrado) {
            return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
        }

        if (formularioBorrado.estado === false) {
            return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')
        }

        Response.GoodRequest(res)
    })
})

//restaurar un formulario
app.put('/api/formulario/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    Formulario.findByIdAndUpdate(id, cambiarEstado, (err, formularioRestaurado) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        if (!formularioRestaurado) {
            return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
        }

        if (formularioRestaurado.estado === true) {
            return Response.BadRequest(err, res, 'El formulario actualmente no está borrado.')
        }

        Response.GoodRequest(res)
    })
})

module.exports = app;