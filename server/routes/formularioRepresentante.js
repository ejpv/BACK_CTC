const express = require('express')
const Response = require('../utils/response')
const FormularioRepresentante = require('../models/formularioRepresentante')
const Formulario = require('../models/formulario')
const Establecimiento = require('../models/establecimiento')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//Generar un formulario
app.post('/api/formularioRepresentante', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let formularioRepresentante = new FormularioRepresentante({
        ejecutadoPor: req.usuario._id
    })

    if (!body.respuesta) {
        formularioRepresentante.save((err, formularioRepreDB) => {
            if (err) {
                return Response.BadRequest(err, res, 'El formulario necesita Respuestas, respuesta es necesario')
            }
        })
    } else {
        formularioRepresentante.respuesta = body.respuesta

        if (body.formulario && body.establecimiento) {
            formularioRepresentante.formulario = body.formulario

            Formulario.findById(body.formulario).exec((err, formularioDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!formularioDB) return Response.BadRequest(err, res, 'No existe el formulario, id inválido')
                if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                if (body.establecimiento) {

                    formularioRepresentante.establecimiento = body.establecimiento

                    Establecimiento.findById(body.establecimiento).exec((err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!establecimientoDB) return Response.BadRequest(err, res, 'No existe el establecimiento, id inválido')
                        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El establecimiento está actualmente borrado')

                        formularioRepresentante.save((err, formularioRepreDB) => {
                            if (err) return Response.BadRequest(err, res)
                            Response.GoodRequest(res, formularioRepreDB)
                        })
                    })
                } else {
                    formularioRepresentante.save((err, formularioRepreDB) => {
                        if (err) return Response.BadRequest(err, res)
                    })
                }
            })


        } else {
            formularioRepresentante.save((err, formularioRepreDB) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }
            })
        }
    }
})

//Obtener todos los formularios
app.get('/api/formularioRepresentantes', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    FormularioRepresentante.find({ estado })
        .populate({ path: 'ejecutadoPor', model: 'usuario' })
        .populate({
            path: 'establecimiento', model: 'establecimiento',
            populate: {
                path: 'representante', model: 'representante'
            }
        })
        .populate({
            path: 'formulario', model: 'formulario',
            populate: {
                path: 'pregunta', model: 'pregunta'
            }
        })
        .exec((err, formularios) => {

            if (err) return Response.BadRequest(err, res)

            FormularioRepresentante.countDocuments({ estado }, (err, conteo) => {
                if (err) return Response.BadRequest(err, res)

                Response.GoodRequest(res, formularios, conteo)
            })
        })
})

//Obtener formularios pertenenciente al representante
app.get('/api/formularioRepresentante/:id', verificarToken, (req, res) => {
    let id = req.params.id

    FormularioRepresentante.findById(id)
        .populate({ path: 'ejecutadoPor', model: 'usuario' })
        .populate({
            path: 'establecimiento', model: 'establecimiento',
            populate: {
                path: 'representante', model: 'representante'
            }
        })
        .populate({
            path: 'formulario', model: 'formulario',
            populate: {
                path: 'pregunta', model: 'pregunta'
            }
        })
        .exec((err, formularioDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
            if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
            Response.GoodRequest(res, formularioDB)
        })
})

//Editar un formulario por id
app.put('/api/formularioRepresentante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['formulario', 'establecimiento', 'respuesta'])

    if (body.respuesta == '') {
        return Response.BadRequest(null, res, 'El formulario debe tener respuestas')
    } else {
        let opc = 0

        if (body.establecimiento && body.formulario) { opc = 1 } else {
            if (body.establecimiento) opc = 2
            if (body.formulario) opc = 3
        }

        switch (opc) {
            case 1:
                Establecimiento.findById(body.establecimiento, (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!establecimientoDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                    if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                    Formulario.findById(body.formulario, (err, formularioDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                        if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                        FormularioRepresentante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                            (err, formularioRepreDB) => {
                                if (err) return Response.BadRequest(err, res)
                                if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                                if (!formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                                Response.GoodRequest(res)
                            })
                    })
                })
                break;
            case 2:
                Establecimiento.findById(body.establecimiento, (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!establecimientoDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                    if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                    FormularioRepresentante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                        (err, formularioRepreDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                            if (!formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                            Response.GoodRequest(res)
                        })
                })
                break;
            case 3:
                Formulario.findById(body.formulario, (err, formularioDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                    if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                    FormularioRepresentante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                        (err, formularioRepreDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                            if (!formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                            Response.GoodRequest(res)
                        })
                })
                break;
            default:
                FormularioRepresentante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                    (err, formularioRepreDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                        if (!formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                        Response.GoodRequest(res)
                    })
                break;
        }
    }
})

//Eliminar un formulario por id
app.delete('/api/formularioRepresentante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    const cambiarEstado = {
        estado: false

    }
    FormularioRepresentante.findByIdAndUpdate(id, cambiarEstado).exec((err, formularioRepreDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
        if (!formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
        Response.GoodRequest(res)
    })
})

//Restaurar un formulario por id
app.put('/api/formularioRepresentante/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    const cambiarEstado = {
        estado: true
    }
    FormularioRepresentante.findByIdAndUpdate(id, cambiarEstado).exec((err, formularioRepreDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!formularioRepreDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
        if (formularioRepreDB.estado) return Response.BadRequest(err, res, 'El formulario no está borrado')
        Response.GoodRequest(res)
    })
})

module.exports = app