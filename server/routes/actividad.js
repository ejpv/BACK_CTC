const express = require('express')
const Response = require('../utils/response')
const Actividad = require('../models/actividad')
const Establecimiento = require('../models/establecimiento')
const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()


//Generar una actividad
app.post('/api/actividad', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let body = req.body

    let actividad = new Actividad({
        nombre: body.nombre
    })

    await actividad.save((err, actividadDB) => {
        if (err) return Response.BadRequest(err, res)

        Response.GoodRequest(res, actividadDB)
    })
})

//Obtener todas las actividades
app.get('/api/actividades', [verificarToken], async (req, res) => {
    await Actividad.find().exec(async (err, actividades) => {
        if (err) return Response.BadRequest(err, res)

        await Actividad.countDocuments((err, conteo) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res, actividades, conteo)
        })
    })
})

//Editar una actividad
app.put('/api/actividad/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['nombre'])

    await Actividad.findById(id, async (err, actividadDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!actividadDB) return Response.BadRequest(err, res, 'No existe la Actividad, id inválido')
        await Actividad.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

//Eliminar una actividad
app.delete('/api/actividad/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id

    await Actividad.findById(id, async (err, actividadDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!actividadDB) return Response.BadRequest(err, res, 'No existe la Actividad, id inválido')

        await Establecimiento.find({ actividad: id }).exec(async (err, establecimientos) => {
            if (err) return Response.BadRequest(err, res)
            if (!establecimientos[0]) return Response.BadRequest(err, res, 'Un Establecimiento está usando esa actividad, no puede ser borrada')

            await Actividad.findByIdAndRemove(id, (err) => {
                if (err) return Response.BadRequest(err, res)
                Response.GoodRequest(res)
            })
        })
    })
})

module.exports = app

