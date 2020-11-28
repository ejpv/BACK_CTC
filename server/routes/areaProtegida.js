const express = require('express')
const Response = require('../utils/response')
const AreaProtegida = require('../models/areaProtegida')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un AreaProtegida
app.post('/api/areaProtegida', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let areaProtegida = new AreaProtegida({
        tipo: body.tipo,
        nombre: body.nombre
    })

    areaProtegida.save((err, areaProtegidaDB) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        Response.GoodRequest(res, areaProtegidaDB, conteo)
    })
})

//Ver todos los areaProtegidaes
app.get('/api/areasProtegidas', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    AreaProtegida.find({ estado }).exec((err, areasProtegidas) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        AreaProtegida.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return Response.BadRequest(err, res)
            }
            Response.GoodRequest(res, areasProtegidas, conteo)
        })
    })
})

//Editar un areaProtegida por id
app.put('/api/areaProtegida/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['tipo', 'nombre'])

    AreaProtegida.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
        (err, areaProtegidaDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!areaProtegidaDB) {
                return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
            }

            if (areaProtegidaDB.estado === false) {
                return Response.BadRequest(err, res, 'El Area Protegida actualmente está borrada.')
            }

            Response.GoodRequest(res)
        })
})

//Eliminar un areaProtegida por id
app.delete('/api/areaProtegida/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    AreaProtegida.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, areaProtegidaDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!areaProtegidaDB) {
                return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
            }

            if (areaProtegidaDB.estado === false) {
                return Response.BadRequest(err, res, 'El Area Protegida actualmente está borrada.')
            }

            Response.GoodRequest(res)
        })
})

//Restaurar un areaProtegida por id
app.put('/api/areaProtegida/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    AreaProtegida.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, areaProtegidaDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!areaProtegidaDB) {
                return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
            }

            if (areaProtegidaDB.estado === true) {
                return Response.BadRequest(err, res, 'El Area Protegida actualmente no está borrada.')
            }

            Response.GoodRequest(res)
        })
})

module.exports = app