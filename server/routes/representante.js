const express = require('express')
const Representante = require('../models/representante')
const Usuario = require('../models/usuario')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un Representante
app.post('/api/representante', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body

    let representante = new Representante({
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
        cedula: body.cedula,
        direccion: body.direccion,
        telefono: body.telefono
    })

    //Buscar el usuario que se está enviando, y verificar que sea de rol de Técnico
    if (body.usuario) {

        representante.usuario = body.usuario

        Usuario.findById({ _id: body.usuario }).exec((err, usuarioDB) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'El Usuario no puede ser asignado, no tiene el rol de Representante'
                        }
                    })
                }

            } else {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Usuario no existe, id inválido'
                    }
                })
            }

            //Guardar representante
            representante.save((err, representanteDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    })
                }

                res.json({
                    ok: true,
                    representante: representanteDB
                })
            })
        })
    } else {
        //Guardar representante
        representante.save((err, representanteDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                representante: representanteDB
            })
        })
    }
})

//Ver todos los representantees
app.get('/api/representantes', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Representante.find({ estado }).populate({ path: 'usuario', model: 'usuario' }).exec((err, representantes) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        Representante.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            res.json({
                ok: true,
                total: conteo,
                representantes
            })
        })
    })
})

//Editar un representante por id
app.put('/api/representante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['nombre', 'apellido', 'email', 'cedula', 'direccion', 'telefono', 'usuario'])
    
    if (body.usuario) {
        Usuario.findById({ _id: body.usuario }).exec((err, usuarioDB) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'El Usuario no puede ser asignado, no tiene el rol de Representante'
                        }
                    })
                }

            } else {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Usuario no existe, id inválido'
                    }
                })
            }

            Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                (err, representanteDB) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        })
                    }

                    if (!representanteDB) {
                        return res.status(400).json({
                            ok: false,
                            err: {
                                message: 'No existe ese Representante, id inválido'
                            }
                        })
                    }

                    if (representanteDB.estado === false) {
                        return res.status(400).json({
                            ok: false,
                            err: {
                                message: 'El Representante está actualmente borrado.'
                            }
                        })
                    }

                    res.status(204).json()
                })
        })
    } else {
        Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
            (err, representanteDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    })
                }

                if (!representanteDB) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'No existe ese Representante, id inválido'
                        }
                    })
                }

                if (representanteDB.estado === false) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'El Representante está actualmente borrado.'
                        }
                    })
                }

                res.status(204).json()
            })
    }

})

//Eliminar un representante por id
app.delete('/api/representante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    Representante.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, representanteDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!representanteDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe ese Representante, id inválido'
                    }
                })
            }

            if (representanteDB.estado === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Representante está actualmente borrado.'
                    }
                })
            }

            res.status(204).json()
        })
})

//Restaurar un representante por id
app.put('/api/representante/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    Representante.findByIdAndUpdate(id, cambiarEstado, { runValidators: true, context: 'query' },
        (err, representanteDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            }

            if (!representanteDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No existe ese Representante, id inválido'
                    }
                })
            }

            if (representanteDB.estado === true) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El Representante actualmente no está borrado.'
                    }
                })
            }

            res.status(204).json()
        })
})

module.exports = app