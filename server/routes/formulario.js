const express = require('express');
const Response = require('../utils/response')
const Formulario = require('../models/formulario');
const Diagnostico = require('../models/diagnostico');
const Pregunta = require('../models/pregunta');
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication');
const _ = require('underscore')
const app = express();

//crear formulario
app.post('/api/formulario', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body

    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }

    let formulario = new Formulario({
        nombre: body.nombre,
        pregunta: body.pregunta,
        realizadoPor: req.usuario._id,
        mostrarEnInforme: body.mostrarEnInforme
    })

    for (let i = 0; i < formulario.pregunta.length; i++) {
        await Pregunta.findById(formulario.pregunta[i], (err, result) => {
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
        await formulario.save((err, formularioDB) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res, formularioDB)
        })
    } else {
        Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos en las preguntas [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las preguntas [ ' + errors.idNotFound + ']' })
        Response.BadRequest(errors, res)
    }
})

//obtener todos los formularios
app.get('/api/formularios', [verificarToken, verificarNotRepresentant], async (req, res) => {

    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Formulario.find({ estado })
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'pregunta', model: 'pregunta' })
        .exec(async (err, formularios) => {
            if (err) return Response.BadRequest(err, res)

            await Formulario.countDocuments({ estado }, (err, conteo) => {
                if (err) return Response.BadRequest(err, res)

                return Response.GoodRequest(res, formularios, conteo)
            })
        })
})

//obtener un formulario por id
app.get('/api/formulario/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {

    let id = req.params.id

    await Formulario.findById(id)
        .populate({ path: 'realizadoPor', model: 'usuario' })
        .populate({ path: 'pregunta', model: 'pregunta' })
        .exec((err, formularioDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
            if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')

            Response.GoodRequest(res, formularioDB)
        })
})

//editar un formulario por id
app.put('/api/formulario/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }

    //_.pick es filtrar y solo elegir esas del body
    let body = _.pick(req.body, ['nombre', 'pregunta', 'realizadoPor', 'mostrarEnInforme'])

    body.realizadoPor = req.usuario._id

    if (body.pregunta == '' || !body.pregunta) {
        return Response.BadRequest(null, res, 'El formulario debe tener preguntas')
    } else {
        for (let i = 0; i < body.pregunta.length; i++) {
            await Pregunta.findById(body.pregunta[i], (err, result) => {
                if (err) {
                    errors.err += 1
                    errors.idErr.push(i + 1)
                }
                if (!result) {
                    errors.notFound += 1
                    errors.idNotFound.push(i + 1)
                }
            })
        }

        if (errors.err == 0 && errors.notFound == 0) {
            await Formulario.findById(id, async (err, formularioDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!formularioDB) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                if (!formularioDB.estado) return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')
                await Formulario.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })

        } else {

            Object.assign(errors, { message: 'Se han encontrado ' + errors.err + ' errores de la Base de datos en las preguntas [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las preguntas [ ' + errors.idNotFound + ']' })
            Response.BadRequest(errors, res)
        }
    }
})

//eliminar un formulario por id
app.delete('/api/formulario/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }
    await Diagnostico.findOne({ formulario: id }, async (err, diagnosticoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (diagnosticoDB) {
            await Formulario.findById(id, async (err, formularioBorrado) => {
                if (err) return Response.BadRequest(err, res)
                if (!formularioBorrado) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                if (!formularioBorrado.estado) return Response.BadRequest(err, res, 'El formulario actualmente está borrado.')
                await Formulario.findByIdAndUpdate(id, cambiarEstado, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })

        } else {
            await Formulario.findById(id, async (err, formularioBorrado) => {
                if (err) return Response.BadRequest(err, res)
                if (!formularioBorrado) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
                await Formulario.findByIdAndRemove(id, cambiarEstado, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })
        }

    })
})

//restaurar un formulario
app.put('/api/formulario/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await Formulario.findById(id, async (err, formularioRestaurado) => {
        if (err) return Response.BadRequest(err, res)
        if (!formularioRestaurado) return Response.BadRequest(err, res, 'El formulario no existe, id inválido')
        if (formularioRestaurado.estado) return Response.BadRequest(err, res, 'El formulario actualmente no está borrado.')
        await Formulario.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

module.exports = app;