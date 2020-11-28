const express = require('express')
const Response = require('../utils/response')
const Lugar = require('../models/lugar')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un Lugar
app.post('/api/lugar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let lugar = new Lugar({
        provincia: body.provincia,
        canton: body.canton,
        ciudad: body.ciudad,
        parroquia: body.parroquia,
        lat: body.lat,
        lon: body.lon
    })

    lugar.save((err, lugarDB) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        Response.GoodRequest(res, lugarDB)
    })
})

//Ver todos los lugares
app.get('/api/lugares', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Lugar.find({ estado }).exec((err, lugares) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        Lugar.countDocuments({ estado }, (err, total) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            Response.GoodRequest(res, lugares, total)
        })
    })
})

//Editar un lugar por id
app.put('/api/lugar/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['canton', 'provincia', 'parroquia', 'lat', 'lon', 'ciudad'])

    Lugar.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
        (err, lugarDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!lugarDB) {
                return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
            }

            if (lugarDB.estado === false) {
                return Response.BadRequest(err, res, 'El lugar está actualmente borrado.')
            }

            return Response.GoodRequest(res)
        })
})

//Eliminar un lugar por id
app.delete('/api/lugar/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    Lugar.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, lugarDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!lugarDB) {
                return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
            }

            if (lugarDB.estado === false) {
                return Response.BadRequest(err, res, 'El lugar está actualmente borrado.')
            }

            Response.GoodRequest(res)
        })
})

//Restaurar un lugar por id
app.put('/api/lugar/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    Lugar.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, lugarDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!lugarDB) {
                return Response.BadRequest(err, res, 'No existe ese lugar, id inválido')
            }

            if (lugarDB.estado === true) {
                return Response.BadRequest(err, res, 'El lugar actualmente no está borrado.')
            }

            Response.GoodRequest(res)
        })
})

module.exports = app