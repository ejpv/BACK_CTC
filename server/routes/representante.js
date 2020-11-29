const express = require('express')
const Representante = require('../models/representante')
const Response = require('../utils/response')
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
                return Response.BadRequest(err, res)
            }

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') {
                    return Response.BadRequest(err, res, 'El Usuario no puede ser asignado, no tiene el rol de Representante')
                }

            } else {
                return Response.BadRequest(err, res, 'El Usuario no existe, id inválido')
            }

            //Guardar representante
            representante.save((err, representanteDB) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }

                Response.GoodRequest(res, representanteDB)
            })
        })
    } else {
        //Guardar representante
        representante.save((err, representanteDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }
            Response.GoodRequest(res, representanteDB)
        })
    }
})

//Ver todos los representantees
app.get('/api/representantes', [verificarToken, verificarNotRepresentant], (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    Representante.find({ estado }).populate({ path: 'usuario', model: 'usuario' }).exec((err, representantes) => {
        if (err) {
            return Response.BadRequest(err, res)
        }

        Representante.countDocuments({ estado }, (err, conteo) => {
            if (err) {
                return Response.BadRequest(err, res)
            }
            Response.GoodRequest(res, representantes, conteo)
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
                return Response.BadRequest(err, res)
            }

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') {
                    return Response.BadRequest(err, res, 'El Usuario no puede ser asignado, no tiene el rol de Representante')
                }

            } else {
                return Response.BadRequest(err, res, 'El Usuario no existe, id inválido')
            }

            Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                (err, representanteDB) => {
                    if (err) {
                        return Response.BadRequest(err, res)
                    }

                    if (!representanteDB) {
                        return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
                    }

                    if (representanteDB.estado === false) {
                        return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                    }

                    Response.GoodRequest(res)
                })
        })
    } else {
        Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
            (err, representanteDB) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }

                if (!representanteDB) {
                    return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
                }

                if (representanteDB.estado === false) {
                    return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                }

                Response.GoodRequest(res)
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
                return Response.BadRequest(err, res)
            }

            if (!representanteDB) {
                return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
            }

            if (representanteDB.estado === false) {
                return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
            }

            Response.GoodRequest(res)
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
                return Response.BadRequest(err, res)
            }

            if (!representanteDB) {
                return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
            }

            if (representanteDB.estado === true) {
                return Response.BadRequest(err, res, 'El Representante no está Borrado')
            }

            Response.GoodRequest(res)
        })
})

module.exports = app