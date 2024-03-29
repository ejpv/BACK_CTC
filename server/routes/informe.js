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
        idNotFound: []
    }

    let informe = new Informe({
        conclusion: body.conclusion,
        recomendacion: body.recomendacion,
        observacion: body.observacion,
        personal: body.personal,
        clasificacion: body.clasificacion,
        realizadoPor: req.usuario._id,
        servicio: body.servicio,
        actualPersonal: body.actualPersonal
    })

    if (body.actividad) {
        informe.actividad = body.actividad
    }

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
            })
        }

        if (errors.err == 0 && errors.notFound == 0) {
            await informe.save((err, informeDB) => {
                if (err) return Response.BadRequest(err, res)
                return Response.GoodRequest(res, informeDB)
            })
        } else {
            Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las preguntas [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las preguntas [ ' + errors.idNotFound + ']' })
            return Response.BadRequest(errors, res)
        }
    } else {
        return Response.BadRequest(null, res, 'El informe debe contener diagnósticos')
    }

})

//Obtener los informes aprobados de un representante
app.get('/api/informes/representante', verificarToken, async (req, res) => {
    let id = req.usuario._id
    //Para ver si el representante ingresado existe o está borrado
    await Representante.findOne({ usuario: id }).exec(async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido, o error en establecimiento')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente borrado')

        //Para ver si existe algún establecimiento asignado y si existe, comprobar si está biorrado o no
        await Establecimiento.findOne({ representante: representanteDB._id }).exec(async (err, establecimientoDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!establecimientoDB) return Response.BadRequest(err, res, 'El Representante no está asignado a ningún establecimiento')
            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente borrado')

            //Para verificar si a ese establecimiento se le han realizado los diagnosticos
            await Diagnostico.find({ establecimiento: establecimientoDB._id }).exec(async (err, diagnosticos) => {
                if (err) return Response.BadRequest(err, res)
                if (!diagnosticos[0]) return Response.BadRequest(err, res, 'No se le han tomado diagnósticos al establecimiento')

                //Mapear el resultado y guardar en una bariable llena solo de ids pa la busqueda
                let diagnosticosID = diagnosticos.map(item => {
                    return item._id
                })

                //Utilizar el array lleno de ids y buscar los informes que la contengan
                await Informe.find({ diagnostico: { $in: diagnosticosID }, estado: true })
                    .populate({
                        path: 'diagnostico', model: 'diagnostico',
                        populate: {
                            path: 'establecimiento', model: 'establecimiento', populate: {
                                path: 'representante', model: 'representante'
                            }
                        }
                    })
                    .populate({
                        path: 'diagnostico', model: 'diagnostico',
                        populate: {
                            path: 'establecimiento', model: 'establecimiento',
                            populate: {
                                path: 'actividad', model: 'actividad'
                            }
                        }
                    })
                    .populate({
                        path: 'diagnostico', model: 'diagnostico',
                        populate: {
                            path: 'establecimiento', model: 'establecimiento',
                            populate: {
                                path: 'areaProtegida', model: 'areaProtegida'
                            }
                        }
                    })
                    .populate({
                        path: 'diagnostico', model: 'diagnostico',
                        populate: {
                            path: 'formulario', model: 'formulario', populate: {
                                path: 'pregunta', model: 'pregunta'
                            }
                        },
                    })
                    .populate({ path: 'responsable', model: 'usuario' })
                    .populate({ path: 'realizadoPor', model: 'usuario' })
                    .sort({ fechaFinal: -1 })
                    .exec((err, informes) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!informes[0]) return Response.BadRequest(err, res, 'Informes no encontrados, no se han realizado informes para el establecimiento asignado al representante.')
                        return Response.GoodRequest(res, informes)
                    })
            })
        })
    })
})

//Obtener informes dependiendo del estado( null => Pendientes; false => Rechazado; true => Aprobado)
app.get('/api/informes', verificarToken, async (req, res) => {
    const estado = req.query.estado === 'false' ? false : req.query.estado === 'true' ? true : null
    await Informe.find({ estado })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'actividad', model: 'actividad'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'areaProtegida', model: 'areaProtegida'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'representante', model: 'representante'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'formulario', model: 'formulario',
                populate: { path: 'pregunta', model: 'pregunta' }
            }
        })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'responsable', model: 'usuario' })
        .sort(
            estado === null ? { fechaCreacion: -1 } : { fechaFinal: -1 }
        )
        .exec(async (err, informesDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            await Informe.countDocuments({ estado }, (err, conteo) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }
                Response.GoodRequest(res, informesDB, conteo)
            })
        })
})

//Obtener informes realizados por un Tecnico a un establecimiento
app.get('/api/informes/:realizadoPor/:establecimiento', verificarToken, async (req, res) => {
    let { realizadoPor, establecimiento } = req.params

    //Obtiene los informes realizados por el usuario Técnico
    await Informe.find({ realizadoPor: realizadoPor })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'formulario', model: 'formulario',
                populate: {
                    path: 'pregunta', model: 'pregunta'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'actividad', model: 'actividad'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'areaProtegida', model: 'areaProtegida'
                }
            }
        })
        .populate({
            path: 'diagnostico', model: 'diagnostico',
            populate: {
                path: 'establecimiento', model: 'establecimiento',
                populate: {
                    path: 'representante', model: 'representante'
                }
            }
        })
        .populate({ path: 'responsable', model: 'usuario' })
        .populate({ path: 'realizadoPor', model: 'usuario' })

        //ordena descendientemente por la fecha
        .sort({ fechaCreacion: -1 })
        .exec((err, informes) => {
            if (err) return Response.BadRequest(err, res)
            if (!informes[0]) return Response.BadRequest(err, res, 'Informes no encontrados, no se han realizado informes para el establecimiento.')

            //Filtra solo los del establecimiento en el que el usuario está actualmente por el id
            var informesEstablecimiento = informes.filter(v => {
                if (v.diagnostico[0]) {
                    return v.diagnostico[0].establecimiento._id.toString() === establecimiento
                }
            })
            return Response.GoodRequest(res, informesEstablecimiento)
        })
})

//Editar un informe
app.put('/api/informe/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['conclusion', 'recomendacion', 'observacion', 'servicio', 'personal', 'clasificacion'])


    await Informe.findById(id, async (err, informeDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        if (informeDB.estado) return Response.BadRequest(err, res, 'El Informe ya está aprobado y no se puede editar')

        body.estado = null
        await Informe.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            return Response.GoodRequest(res)
        })
    })
})

//Borrar un informe si esta por aprobar o rechazado
app.delete('/api/informe/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    await Informe.findById(id).exec(async (err, informe) => {
        if (err) return Response.BadRequest(err, res)
        if (!informe) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        if (informe.estado) return Response.BadRequest(err, res, 'Un informe aprobado no puede ser borrado.')

        await Informe.findByIdAndRemove(id, (err) => {
            if (err) return Response.BadRequest(err, res)
            return Response.GoodRequest(res)
        })
    })
})

//Cambiar el estado de un informe
app.put('/api/informe/cambiarEstado/:id/:estado', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: '',
        responsable: req.usuario._id,
        fechaFinal: Date.now(),
        retroalimentacion: ''
    }

    cambiarEstado.estado = req.params.estado === 'true' ? true : false

    if (cambiarEstado.estado === false) {
        cambiarEstado.retroalimentacion = req.body.retroalimentacion
    }

    await Informe.findById(id).exec(async (err, informe) => {
        if (err) return Response.BadRequest(err, res)
        if (!informe) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
        if (informe.estado) {
            return Response.BadRequest(err, res, 'El informe está actualmente Aprobado')
        } else {
            if (informe.estado === false) {
                return Response.BadRequest(err, res, 'El informe está actualmente Rechazado')
            }
        }
        await Informe.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})


module.exports = app