const express = require('express');
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
            return res.status(400).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            formulario: formularioDB
        })
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
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            Formulario.countDocuments({ estado }, (err, conteo) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    })
                }

                res.json({
                    ok: true,
                    total: conteo,
                    formularios
                })
            })
        })
})

//obtener un formulario por id
app.get('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {

    let id = req.params.id

    Formulario.findById({ _id: id })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'pregunta', model: 'pregunta' })
        .exec((err, formularioDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!formularioDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El id no es válido'
                    }
                })
            }

            if (!formularioDB.estado) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El formulario está actualmente eliminado'
                    }
                })
            }

            res.json({
                ok: true,
                formulario: formularioDB
            })
        })
})

//editar un formulario por id
app.put('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['tipo', 'pregunta', 'realizadoPor'])

    if (body.pregunta == '') {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'El formulario debe tener preguntas'
            }
        })
    }

    Formulario.findByIdAndUpdate(
        id,
        body,
        { runValidators: true, context: 'query' },
        (err, formularioDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (formularioDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El formulario está actualmente borrado.'
                    }
                })
            }

            res.json({
                ok: true,
                formulario: formularioDB
            })
        }
    )
})

//eliminar un formulario por id
app.delete('/api/formulario/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    Formulario.findByIdAndUpdate(id, cambiarEstado, (err, formularioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        if (!formularioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El formulario no existe.'
                }
            })
        }

        if (formularioBorrado.estado === false) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El formulario está actualmente borrado.'
                }
            })
        }

        res.json({
            ok: true,
            formulario: formularioBorrado
        })
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
            return res.status(400).json({
                ok: false,
                err
            })
        }

        if (!formularioRestaurado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El formulario no existe.'
                }
            })
        }

        if (formularioRestaurado.estado === true) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El formulario actualmente no está borrado.'
                }
            })
        }

        res.json({
            ok: true,
            formulario: formularioRestaurado
        })
    })
})

module.exports = app;