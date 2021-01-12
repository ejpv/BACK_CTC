const express = require('express')
const Response = require('../utils/response')
const { verificarToken, verificarNotRepresentant, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const Informe = require('../models/informe')
const Diagnostico = require('../models/diagnostico')
const Representante = require('../models/representante')
const Establecimiento = require('../models/establecimiento')
const app = express()

//Crear un informe
app.post('/api/informe', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body
    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: [],
        erased: 0,
        idErased: []
    }

    let informe = new Informe({
        conclusion: body.conclusion,
        recomendacion: body.recomendacion,
        observación: body.observación,
        realizadoPor: req.usuario._id
    })
    if (body.diagnostico) {
        informe.diagnostico = body.diagnostico

        for (let i = 0; i < informe.diagnostico.length; i++) {
            await Diagnostico.findById(informe.diagnostico[i], (err, result) => {
                if (err) {
                    errors.err += 1
                    errors.idErr.push(i)
                }
                if (!result) {
                    errors.notFound += 1
                    errors.idNotFound.push(i)
                }
                else {
                    if (result.estado == false) {
                        errors.erased += 1
                        errors.idErased.push(i)
                    }
                }
            })
        }

        if (errors.err == 0 && errors.notFound == 0 && errors.erased == 0) {
            await informe.save((err, informeDB) => {
                if (err) return Response.BadRequest(err, res)
                return Response.GoodRequest(res, informeDB)
            })
        } else {
            Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos, ' + errors.erased + ' errores de entidades borradas, y ' + errors.notFound + ' errores de entidades no encontradas.' })
            Response.BadRequest(errors, res)
        }
    } else {
        return Response.BadRequest(null, res, 'El informe debe contener diagnósticos')
    }

})

//Obtener todos los informes
app.get('/api/informes', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Informe.find({ estado })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'formulario', model: 'formulario', populate: {
                    path: 'pregunta', model: 'pregunta'
                }
            },
            populate: {
                path: 'establecimiento', model: 'establecimiento', populate: {
                    path: 'representante', model: 'representante'
                }
            }
        })
        .populate({ path: 'aprobadoPor', model: 'usuario' })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .exec((err, informes) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            Informe.countDocuments({ estado }, (err, conteo) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }
                Response.GoodRequest(res, informes, conteo)
            })
        })
})

//Obtener un informe
app.get('/api/informe/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    await Informe.findById(id)
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'formulario', model: 'formulario', populate: {
                    path: 'pregunta', model: 'pregunta'
                }
            },
            populate: {
                path: 'establecimiento', model: 'establecimiento', populate: {
                    path: 'representante', model: 'representante'
                }
            }
        })
        .populate({ path: 'aprobadoPor', model: 'usuario' })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .exec((err, informeDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!informeDB) return Response.BadRequest(err, res, 'Informe no ha sido encontrado, id inválido')
            if (informeDB.estado == false) return Response.BadRequest(err, res, 'Informe está actualmente borrado.')
            return Response.GoodRequest(res, informeDB)
        })
})

//Obtener los informes de un representante
app.get('/api/informes/representante/:id', verificarToken, async (req, res) => {
    let id = req.params.id
    //Para ver si el representante ingresado existe o está borrado
    await Representante.findById(id).exec(async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido, o error en establecimiento')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente borrado')

        //Para ver si existe algún establecimiento asignado y si existe, comprobar si está biorrado o no
        await Establecimiento.findOne({ representante: id }).exec(async (err, establecimientoDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!establecimientoDB) return Response.BadRequest(err, res, 'El Representante no está asignado a ningún establecimiento')
            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente borrado')

            //Para verificar si a ese establecimiento se le han realizado los formularios
            await Diagnostico.find({ establecimiento: establecimientoDB._id }).exec(async (err, diagnosticos) => {
                if (err) return Response.BadRequest(err, res)
                if (!diagnosticos[0]) return Response.BadRequest(err, res, 'No se le han tomado diagnósticos al establecimiento')

                //Mapear el resultado y guardar en una bariable llena solo de ids pa la busqueda
                let diagnosticosID = diagnosticos.map(item => {
                    return item._id
                })

                //Utilizar el array lleno de ids y buscar los informes que la contengan
                await Informe.find({ diagnostico: { $in: diagnosticosID } })
                    .populate({
                        path: 'diagnostico', model: 'diagnostico',
                        populate: {
                            path: 'formulario', model: 'formulario', populate: {
                                path: 'pregunta', model: 'pregunta'
                            }
                        },
                        populate: {
                            path: 'establecimiento', model: 'establecimiento', populate: {
                                path: 'representante', model: 'representante'
                            }
                        }
                    })
                    .populate({ path: 'aprobadoPor', model: 'usuario' })
                    .populate({ path: 'realizadoPor', model: 'usuario' })
                    .exec((err, informes) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!informes[0]) return Response.BadRequest(err, res, 'Informes no encontrados, no se han realizado informes para el establecimiento asignado al representante.')
                        return Response.GoodRequest(res, informes)
                    })
            })
        })
    })
})

//Editar un informe
app.put('/api/informe/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: [],
        erased: 0,
        idErased: []
    }
    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['diagnostico', 'conclusion', 'recomendacion', 'observacion'])

    if (body.diagnostico.includes('')) {
        return Response.BadRequest(null, res, 'No pueden existir diagnosticos vacios o un solo diagnostico')
    } else {
        for (let i = 0; i < body.diagnostico.length; i++) {
            await Diagnostico.findById(body.diagnostico[i], (err, result) => {
                if (err) {
                    errors.err += 1
                    errors.idErr.push(i)
                }
                if (!result) {
                    errors.notFound += 1
                    errors.idNotFound.push(i)
                }
                else {
                    if (result.estado == false) {
                        errors.erased += 1
                        errors.idErased.push(i)
                    }
                }
            })
        }

        if (errors.err == 0 && errors.notFound == 0 && errors.erased == 0) {
            await Informe.findById(id, async (err, informeDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                if (informeDB.estado === false) return Response.BadRequest(err, res, 'El informe actualmente está borrado.')
                if (informeDB.aprobadoPor) return Response.BadRequest(err, res, 'El Informe ya está aprobado y no se puede editar')
                await Informe.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })

        } else {
            Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos, ' + errors.erased + ' errores de entidades borradas, y ' + errors.notFound + ' errores de entidades no encontradas.' })
            Response.BadRequest(errors, res)
        }
    }
})

//Borrar un informe
app.delete('/api/informe/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    await Informe.findById(id).exec(async (err, informe) => {
        if (informe) {
            if (!informe.aprobadoPor) {
                await Informe.findByI(id, async (err, informeDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                    if (!informeDB.estado) return Response.BadRequest(err, res, 'El informe está actualmente borrado')
                    await Informe.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' }, (err) => {
                        if (err) return Response.BadRequest(err, res)
                        Response.GoodRequest(res)
                    })
                })
            } else {
                return Response.BadRequest(err, res, 'Un informe aprobado no puede ser borrado.')
            }
        } else {
            return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        }

    })
})

//Restaurar un informe
app.put('/api/informe/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }
    await Informe.findById(id, async (err, informeDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        if (informeDB.estado) return Response.BadRequest(err, res, 'El informe no está actualmente borrado.')
        await Informe.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

//Aprobar un informe
app.put('/api/informe/aprobar/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id

    let aprobar = {
        aprobadoPor: req.usuario._id
    }

    await Informe.findById(id).exec(async (err, informe) => {
        if (informe) {
            if (informe.estado) {
                await Informe.findById(id, async (err, informeDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                    if (informeDB.aprobadoPor) return Response.BadRequest(err, res, 'El informe ya se encuentra aprobado.')
                    await Informe.findByIdAndUpdate(id, aprobar, (err) => {
                        if (err) return Response.BadRequest(err, res)
                        Response.GoodRequest(res)
                    })
                })
            } else {
                return Response.BadRequest(err, res, 'Un informe borrado no puede ser aprobado.')
            }
        } else {
            return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        }
    })
})

module.exports = app
