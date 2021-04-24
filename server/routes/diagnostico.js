const express = require('express')
const Response = require('../utils/response')
const Diagnostico = require('../models/diagnostico')
const Pregunta = require('../models/pregunta')
const Formulario = require('../models/formulario')
const Establecimiento = require('../models/establecimiento')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//Generar un diagnostico
app.post('/api/diagnostico', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body

    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }

    let diagnostico = new Diagnostico({
        ejecutadoPor: req.usuario._id,
    })

    if (!body.respuesta) {
        return Response.BadRequest(null, res, 'El diagnóstico necesita Respuestas, respuesta es necesario')
    } else {
        diagnostico.respuesta = body.respuesta
        for (let i = 0; i < diagnostico.respuesta.length; i++) {
            await Pregunta.findById(diagnostico.respuesta[i].pregunta, (err, result) => {
                if (err) {
                    errors.err += 1
                    errors.idErr.push(i)
                }
                if (!result) {
                    errors.notFound += 1
                    errors.idNotFound.push(i)
                }
            })
        }
        if (errors.err == 0 && errors.notFound == 0) {
            diagnostico.total = body.total

            if (body.formulario && body.establecimiento) {
                diagnostico.formulario = body.formulario

                await Formulario.findById(body.formulario).exec(async (err, formularioDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!formularioDB) return Response.BadRequest(err, res, 'No existe el formulario, id inválido')
                    if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                    if (body.establecimiento) {

                        diagnostico.establecimiento = body.establecimiento

                        await Establecimiento.findById(body.establecimiento).exec(async (err, establecimientoDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!establecimientoDB) return Response.BadRequest(err, res, 'No existe el establecimiento, id inválido')
                            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El establecimiento está actualmente borrado')

                            await diagnostico.save((err, diagnosticoDB) => {
                                if (err) return Response.BadRequest(err, res)
                                Response.GoodRequest(res, diagnosticoDB)
                            })
                        })
                    } else {
                        await diagnostico.save((err) => {
                            if (err) return Response.BadRequest(err, res)
                        })
                    }
                })
            } else {
                await diagnostico.save((err) => {
                    if (err) {
                        return Response.BadRequest(err, res)
                    }
                })
            }
        } else {
            Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos, y' + errors.notFound + ' errores de preguntas no encontradas en las respuestas.' })
            Response.BadRequest(errors, res)
        }
    }
})

//Obtener todos los diagnosticos
app.get('/api/diagnosticos', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Diagnostico.find({ estado })
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
        .exec(async (err, diagnosticos) => {

            if (err) return Response.BadRequest(err, res)

            await Diagnostico.countDocuments({ estado }, (err, conteo) => {
                if (err) return Response.BadRequest(err, res)

                Response.GoodRequest(res, diagnosticos, conteo)
            })
        })
})

//Obtener diagnosticos pertenenciente al representante
app.get('/api/diagnostico/:id', verificarToken, async (req, res) => {
    let id = req.params.id

    await Diagnostico.findById(id)
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
        .exec((err, diagnosticoDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
            if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')
            Response.GoodRequest(res, diagnosticoDB)
        })
})

//Obtener diagnosticos que el usuario ha realizado a un establecimiento
app.get('/api/diagnosticos/:ejecutadoPor/:establecimiento', verificarToken, async (req, res) => {
    let { ejecutadoPor, establecimiento } = req.params
    await Diagnostico.find({ 'ejecutadoPor': ejecutadoPor, 'establecimiento': establecimiento })
        .populate({
            path: 'formulario', model: 'formulario',
            populate: {
                path: 'pregunta', model: 'pregunta'
            }
        })
        .sort({ fecha: -1 })
        .exec((err, diagnosticosDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!diagnosticosDB) return Response.BadRequest(err, res, 'No se han realizado Diagnosticos para este Establecimiento')
            Response.GoodRequest(res, diagnosticosDB)
        })
})
//Editar un diagnostico por id
app.put('/api/diagnostico/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['formulario', 'establecimiento', 'respuesta'])

    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }

    let opc = 0

    if (body.respuesta == '') {
        return Response.BadRequest(null, res, 'El diagnostico debe tener respuestas')
    } else {
        diagnostico.respuesta = body.respuesta
        for (let i = 0; i < diagnostico.respuesta.length; i++) {
            await Pregunta.findById(diagnostico.respuesta[i].pregunta, (err, result) => {
                if (err) {
                    errors.err += 1
                    errors.idErr.push(i)
                }
                if (!result) {
                    errors.notFound += 1
                    errors.idNotFound.push(i)
                }
            })
        }
        if (errors.err == 0 && errors.notFound == 0) {
            if (body.establecimiento && body.diagnostico) { opc = 1 } else {
                if (body.establecimiento) opc = 2
                if (body.diagnostico) opc = 3
            }

            switch (opc) {
                case 1:
                    await Establecimiento.findById(body.establecimiento, async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!establecimientoDB) return Response.BadRequest(err, res, 'El establecimiento no existe, id inválido')
                        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El establecimiento está actualmente borrado')
                        await Formulario.findById(body.formulario, async (err, formularioDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                            if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')

                            await Diagnostico.findById(id, async (err, diagnosticoDB) => {
                                if (err) return Response.BadRequest(err, res)
                                if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
                                if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')

                                await Diagnostico.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                                    if (err) return Response.BadRequest(err, res)
                                    Response.GoodRequest(res)
                                })
                            })
                        })
                    })
                    break;
                case 2:
                    await Establecimiento.findById(body.establecimiento, async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!establecimientoDB) return Response.BadRequest(err, res, 'El establecimiento no existe, id inválido')
                        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El establecimiento está actualmente borrado')
                        await Diagnostico.findById(id, async (err, diagnosticoDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
                            if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')

                            await Diagnostico.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                                if (err) return Response.BadRequest(err, res)
                                Response.GoodRequest(res)
                            })
                        })
                    })
                    break;
                case 3:
                    await Formulario.findById(body.diagnostico, async (err, formularioDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                        if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario está actualmente borrado')
                        await Diagnostico.findById(id, async (err, diagnosticoDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
                            if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')

                            await Diagnostico.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                                if (err) return Response.BadRequest(err, res)
                                Response.GoodRequest(res)
                            })
                        })
                    })
                    break;
                default:
                    await Diagnostico.findById(id, async (err, diagnosticoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
                        if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')

                        await Diagnostico.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                            if (err) return Response.BadRequest(err, res)
                            Response.GoodRequest(res)
                        })
                    })
                    break;
            }
        } else {
            Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos, y' + errors.notFound + ' errores de preguntas no encontradas en las respuestas.' })
            Response.BadRequest(errors, res)
        }

    }
})

//Eliminar un diagnostico por id
app.delete('/api/diagnostico/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    const cambiarEstado = {
        estado: false

    }
    await Diagnostico.findById(id).exec(async (err, diagnosticoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
        if (!diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico está actualmente borrado')
        await Diagnostico.findByIdAndUpdate(id, cambiarEstado).exec((err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

//Restaurar un diagnostico por id
app.put('/api/diagnostico/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    const cambiarEstado = {
        estado: true
    }
    await Diagnostico.findById(id).exec(async (err, diagnosticoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!diagnosticoDB) return Response.BadRequest(err, res, 'El diagnóstico no existe, id inválido')
        if (diagnosticoDB.estado) return Response.BadRequest(err, res, 'El diagnóstico no está borrado')
        await Diagnostico.findByIdAndUpdate(id, cambiarEstado).exec((err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

module.exports = app

