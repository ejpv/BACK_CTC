const express = require('express')
const Response = require('../utils/response')
const { verificarToken, verificarNotRepresentant, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const Informe = require('../models/informe')
const Formulario = require('../models/formulario')
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
        formulario: body.formulario,
        realizadoPor: req.usuario._id
    })

    for (let i = 0; i < informe.formulario.length; i++) {
        await Formulario.findById(informe.formulario[i], (err, result) => {
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
})

//Obtener todos los informes
app.get('/api/informes', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Informe.find({ estado })
        .populate({
            path: 'formulario', model: 'formulario',
            populate: {
                path: 'pregunta', model: 'pregunta'
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
            path: 'formulario', model: 'formulario',
            populate: {
                path: 'pregunta', model: 'pregunta'
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
app.get('/api/informe/representante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    
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
    let body = _.pick(req.body, ['formulario', 'conclusion', 'recomendacion', 'observacion'])

    if (body.formulario.includes('')) {
        return Response.BadRequest(null, res, 'No pueden existir formularios vacios o un solo formulario')
    } else {
        for (let i = 0; i < body.formulario.length; i++) {
            await Formulario.findById(body.formulario[i], (err, result) => {
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
            await Informe.findByIdAndUpdate(
                id,
                body,
                { runValidators: true, context: 'query' },
                (err, informeDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                    if (informeDB.estado === false) return Response.BadRequest(err, res, 'El informe actualmente está borrado.')
                    if (informeDB.aprobadoPor) return Response.BadRequest(err, res, 'El Informe ya está aprobado y no se puede editar')
                    Response.GoodRequest(res)
                }
            )
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

    await Informe.findById(id).exec( async (err, informe) => {
        if (!informe.aprobadoPor) {
            await Informe.findByIdAndUpdate(
                id,
                cambiarEstado,
                { runValidators: true, context: 'query' },
                (err, informeDB) => {
                    console.log(informeDB);
                    if (err) return Response.BadRequest(err, res)
                    if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                    if (!informeDB.estado) return Response.BadRequest(err, res, 'El informe está actualmente borrado')
                    Response.GoodRequest(res)
                }
            )
        }else{
            return Response.BadRequest(err, res, 'Un informe aprobado no puede ser borrado.')
        }
    })
})

//Restaurar un informe
app.put('/api/informe/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await Informe.findByIdAndUpdate(
        id,
        cambiarEstado,
        { runValidators: true, context: 'query' },
        (err, informeDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
            if (informeDB.estado) return Response.BadRequest(err, res, 'El informe no está actualmente borrado.')
            Response.GoodRequest(res)
        }
    )
})

//Aprobar un informe
app.put('/api/informe/aprobar/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id

    let aprobar = {
        aprobadoPor: req.usuario._id
    }

    await Informe.findById(id).exec( async (err, informe) => {
        if (informe.estado) {
            await Informe.findByIdAndUpdate(
                id,
                aprobar,
                { runValidators: true, context: 'query' },
                (err, informeDB) => {
                    console.log(informeDB);
                    if (err) return Response.BadRequest(err, res)
                    if (!informeDB) return Response.BadRequest(err, res, 'El informe no existe, id inválido')
                    if (informeDB.aprobadoPor) return Response.BadRequest(err, res, 'El informe ya se encuentra aprobado.')
                    Response.GoodRequest(res)
                }
            )
        }else{
            return Response.BadRequest(err, res, 'Un informe borrado no puede ser aprobado.')
        }
    })
})

module.exports = app