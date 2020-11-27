const express = require('express')
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
            res.status(400).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            areaProtegida: areaProtegidaDB
        })
    })
})

//Ver todos los areaProtegidaes
app.get('/api/areasProtegidas', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    AreaProtegida.find({ estado }).exec((err, areasProtegidas) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        AreaProtegida.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                total: conteo,
                areasProtegidas
            })
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
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!areaProtegidaDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe el Area Protegida, id inválido'
                    }
                })
            }

            if (areaProtegidaDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Area Protegida está actualmente borrada.'
                    }
                })
            }

            res.status(204).json()
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
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!areaProtegidaDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe el Area Protegida, id inválido'
                    }
                })
            }

            if (areaProtegidaDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Area Protegida está actualmente borrada.'
                    }
                })
            }

            res.status(204).json()
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
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!areaProtegidaDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe el Area Protegida, id inválido'
                    }
                })
            }

            if (areaProtegidaDB.estado === true) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Area Protegida actualmente no está borrada.'
                    }
                })
            }

            res.status(204).json()
        })
})

module.exports = app