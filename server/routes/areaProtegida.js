const express = require('express')
const Response = require('../utils/response')
const AreaProtegida = require('../models/areaProtegida')
const Establecimiento = require('../models/establecimiento')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un AreaProtegida
app.post('/api/areaProtegida', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body

    let areaProtegida = new AreaProtegida({
        tipo: body.tipo,
        nombre: body.nombre
    })

    await areaProtegida.save((err, areaProtegidaDB) => {
        if (err) return Response.BadRequest(err, res)

        Response.GoodRequest(res, areaProtegidaDB)
    })
})

//Ver todos los areaProtegidaes
app.get('/api/areasProtegidas', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await AreaProtegida.find({ estado }).exec(async (err, areasProtegidas) => {
        if (err) return Response.BadRequest(err, res)

        await AreaProtegida.countDocuments({ estado }, (err, conteo) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res, areasProtegidas, conteo)
        })
    })
})

//Editar un areaProtegida por id
app.put('/api/areaProtegida/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['tipo', 'nombre'])

    await AreaProtegida.findById(id, async (err, areaProtegidaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!areaProtegidaDB) return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
        if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida actualmente está borrada.')
        await AreaProtegida.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                if (err) return Response.BadRequest(err, res)
                Response.GoodRequest(res)
            })
    })

})

//Eliminar un areaProtegida por id
app.delete('/api/areaProtegida/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    await Establecimiento.findOne({ areaProtegida: id }).exec(async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (establecimientoDB) {
            await AreaProtegida.findById(id, async (err, areaProtegidaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaProtegidaDB) return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
                if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida actualmente está borrada.')
                await AreaProtegida.findByIdAndUpdate(id, cambiarEstado, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res)
                })
            })
        } else {
            await AreaProtegida.findByIdAndRemove(id, (err, areaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaDB) return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
                Response.GoodRequest(res)
            })
        }
    })


})

//Restaurar un areaProtegida por id
app.put('/api/areaProtegida/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await AreaProtegida.findById(id, async (err, areaProtegidaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!areaProtegidaDB) return Response.BadRequest(err, res, 'No existe Area Protegida, id inválido')
        if (areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida actualmente no está borrada.')
        await AreaProtegida.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

module.exports = app