const express = require('express')
const Representante = require('../models/representante')
const Response = require('../utils/response')
const Usuario = require('../models/usuario')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un Representante
app.post('/api/representante', [verificarToken, verificarNotRepresentant], async (req, res) => {
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

        await Usuario.findById({ _id: body.usuario }).exec(async (err, usuarioDB) => {
            if (err) return Response.BadRequest(err, res)

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') return Response.BadRequest(err, res, 'El Usuario no puede ser asignado, no tiene el rol de Representante.')
                if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El Usuario está actualmente borrado.')

            } else {
                return Response.BadRequest(err, res, 'El Usuario no existe, id inválido.')
            }

            //Guardar representante
            await representante.save((err, representanteDB) => {
                if (err) return Response.BadRequest(err, res)

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
app.get('/api/representantes', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Representante.find({ estado }).populate({ path: 'usuario', model: 'usuario' }).exec(async (err, representantes) => {
        if (err) return Response.BadRequest(err, res)

        await Representante.countDocuments({ estado }, (err, conteo) => {
            if (err) return Response.BadRequest(err, res)

            Response.GoodRequest(res, representantes, conteo)
        })
    })
})

//Editar un representante por id
app.put('/api/representante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = _.pickasync(req.body, ['nombre', 'apellido', 'email', 'cedula', 'direccion', 'telefono', 'usuario'])

    if (body.usuario) {
        await Usuario.findById({ _id: body.usuario }).exec(async (err, usuarioDB) => {
            if (err) return Response.BadRequest(err, res)

            //Verificando si existe
            if (usuarioDB) {

                //Verificando si tiene el rol apto
                if (usuarioDB.rol != 'REPRESENTANT_ROLE') {
                    return Response.BadRequest(err, res, 'El Usuario no puede ser asignado, no tiene el rol de Representante')
                }

            } else {
                return Response.BadRequest(err, res, 'El Usuario no existe, id inválido')
            }

            await Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
                (err, representanteDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
                    if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                    Response.GoodRequest(res)
                })
        })
    } else {
        await Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' },
            (err, representanteDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
                if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                Response.GoodRequest(res)
            })
    }

})

//Eliminar un representante por id
app.delete('/api/representante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    await Representante.findByIdAndUpdate(id, cambiarEstado, (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

        Response.GoodRequest(res)
    })
})

//Restaurar un representante por id
app.put('/api/representante/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await Representante.findByIdAndUpdate(id, cambiarEstado, (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante no está Borrado')

        Response.GoodRequest(res)
    })
})

module.exports = app