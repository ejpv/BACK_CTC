const express = require('express')
const Response = require('../utils/response')
const Lugar = require('../models/lugar')
const Establecimiento = require('../models/establecimiento')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const establecimiento = require('../models/establecimiento')
const app = express()

//generar un Lugar
app.post('/api/lugar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body

    let lugar = new Lugar({
        provincia: body.provincia,
        canton: body.canton,
        ciudad: body.ciudad,
        parroquia: body.parroquia,
        lat: body.lat,
        lon: body.lon
    })

    await lugar.save((err, lugarDB) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res, lugarDB)
    })
})

//Ver todos los lugares
app.get('/api/lugares', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Lugar.find({ estado }).exec(async (err, lugares) => {
        if (err) return Response.BadRequest(err, res)

        await Lugar.countDocuments({ estado }, (err, total) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res, lugares, total)
        })
    })
})

//Editar un lugar por id
app.put('/api/lugar/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['canton', 'provincia', 'parroquia', 'lat', 'lon', 'ciudad'])

    await Lugar.findById(id, async (err, lugarDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!lugarDB) return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
        if (!lugarDB.estado) return Response.BadRequest(err, res, 'El lugar está actualmente borrado.')
        await Lugar.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            return Response.GoodRequest(res)
        })
    })
})

//Eliminar un lugar por id
app.delete('/api/lugar/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }
    await Establecimiento.findOne({ lugar: id }, async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (establecimientoDB) {
            await Lugar.findById(id, async (err, lugarDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!lugarDB) return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
                if (!lugarDB.estado) return Response.BadRequest(err, res, 'El lugar está actualmente borrado.')
                await Lugar.findByIdAndUpdate(id, cambiarEstado, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })


        } else {
            await Lugar.findByIdAndRemove(id, (err, lugarDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!lugarDB) return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')

                Response.GoodRequest(res)
            })
        }

    })

})

//Restaurar un lugar por id
app.put('/api/lugar/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }
    await Lugar.findById(id, async (err, lugarDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!lugarDB) return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
        if (lugarDB.estado) return Response.BadRequest(err, res, 'El lugar actualmente no está borrado.')
        await Lugar.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

module.exports = app