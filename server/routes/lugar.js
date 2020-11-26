const express = require('express')
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
            res.status(400).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            message: 'Lugar creado satisfactoriamente',
            lugar: lugarDB
        })
    })
})

//Ver todos los lugares
app.get('/api/lugares', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Lugar.find({ estado }).exec((err, lugares) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        Lugar.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                total: conteo,
                lugares
            })
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
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!lugarDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe ese lugar, id inválido'
                    }
                })
            }

            if (lugarDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El lugar está actualmente borrado.'
                    }
                })
            }

          res.status(204).json({
                ok: true,
                message: 'Lugar borrado correctamente.'
            })
            //res.status(204).json()
        })
})

//Eliminar un lugar por id
app.put('/api/lugar/:id', [verificarToken, verificarNotRepresentant], (req, res) => { })

//Restaurar un lugar por id
app.put('/api/lugar/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    let cambiarEstado = {
        estado: true
    }

    Lugar.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, lugarDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!lugarDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe ese lugar, id inválido'
                    }
                })
            }

            if (lugarDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El lugar está actualmente borrado.'
                    }
                })
            }

            /*res.json({
                ok: true,
                message: 'Lugar borrado correctamente.'
            })*/
            res.status(204)
        })
})

module.exports = app