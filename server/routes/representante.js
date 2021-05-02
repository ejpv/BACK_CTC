const express = require('express')
const Representante = require('../models/representante')
const Response = require('../utils/response')
const Usuario = require('../models/usuario')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const Establecimiento = require('../models/establecimiento')
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

    //Guardar representante
    representante.save((err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        Response.GoodRequest(res, representanteDB)
    })
})

//Ver todos los representantes
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

//Obtener el representante y establecimiento del usuario Logeado
app.get('/api/representante/:id', [verificarToken], async (req, res) => {
    let id = req.params.id

    await Representante.findOne({ usuario: id }).populate().exec(async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, 'El Representante no existe')
        await Establecimiento.findOne({ representante: representanteDB._id })
            .populate({ model: 'areaProtegida', path: 'areaProtegida' })
            .populate({ model: 'lugar', path: 'lugar' })
            .exec((err, establecimientoDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!establecimientoDB) {
                    var objeto = { representante: representanteDB }
                    Response.GoodRequest(res, objeto)
                } else {
                    var objeto = { representante: representanteDB, establecimiento: establecimientoDB }
                    Response.GoodRequest(res, objeto)
                }
            })
    })
})

//Ver todos los representantes no asignados
app.get('/api/representantes/noAsignados', [verificarToken, verificarNotRepresentant], async (req, res) => {
    await Establecimiento.find({ estado: true }).exec(async (err, establecimientosDB) => {
        if (err) return Response.BadRequest(err, res)

        await Representante.find({ estado: true }).populate({ path: 'usuario', model: 'usuario' }).exec(async (err, representantesDB) => {
            if (err) return Response.BadRequest(err, res)
            if (representantesDB[0]) {
                representantesDB = representantesDB.filter(v => v.usuario != undefined || v.usuario != null)
                //Verifico que almenos un establecimiento tenga asignado un representante para poder filtrar
                let existe = false;
                for (let i = 0; i < establecimientosDB.length; i++) {
                    if (establecimientosDB[i].representante) {
                        existe = true
                    }
                }
                //si no hay ninguno, enviará todos los representantes
                if (existe) {
                    let codigosEsta = establecimientosDB.map(v => {
                        return v.representante ? v.representante._id : null
                    })
                    codigosEsta = codigosEsta.filter(v => v != null)
                    // console.log("codigos de representantes en establecimientos");
                    // console.log(codigosEsta);
                    // console.log("representantes en bruto");
                    // console.log(representantesDB);
                    for (let i = 0; i < codigosEsta.length; i++) {
                        //representantesNoAsignados = representantesDB.filter(v => v._id.toString() != codigosEsta[i])
                        //representantesDB.splice(representantesDB.indexOf(codigosEsta[i]), 1); DEFINITIVAMENTE NO SIRVE
                        var contiene = representantesDB.filter(v => v._id.equals(codigosEsta[i]))
                        var indice = representantesDB.indexOf(contiene[0]);
                        representantesDB.splice(indice, 1);
                    }
                    // console.log("representantes no asignados");
                    // console.log(representantesDB);
                    Response.GoodRequest(res, representantesDB)
                } else {
                    Response.GoodRequest(res, representantesDB)
                }
            } else {
                Response.BadRequest(null, res, 'No se encontraron representantes')
            }
        })
    })
})

//Editar un representante por id
app.put('/api/representante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['nombre', 'apellido', 'email', 'cedula', 'direccion', 'telefono'])

    await Representante.findById(id, async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

        await Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })


})

//Eliminar un representante por id
app.delete('/api/representante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false,
        usuario: null
    }

    await Representante.findById(id, async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
        await Representante.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

//Restaurar un representante por id
app.put('/api/representante/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await Representante.findById(id, async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (representanteDB.estado) return Response.BadRequest(err, res, 'El Representante no está Borrado')
        await Representante.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

//Asignar un usuario al representante
app.put('/api/representante/asignar/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {

    let id = req.params.id

    let body = { usuario: req.body.usuario }

    //Buscar el usuario que se está enviando, y verificar que sea de rol de Técnico

    await Usuario.findById({ _id: body.usuario }).exec(async (err, usuarioDB) => {
        if (err) return Response.BadRequest(err, res)

        //Verificando si existe
        if (!usuarioDB) return Response.BadRequest(err, res, 'El Usuario no existe, id inválido.')
        if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El Usuario está actualmente borrado.')
        if (usuarioDB.rol != 'REPRESENTANT_ROLE') return Response.BadRequest(err, res, 'El Usuario no puede ser asignado, no tiene el rol de Representante.')

        //buscando si el usuario ya está asignado
        await Representante.find({ usuario: body.usuario }).exec(async (err, representanteDB) => {
            if (err) return Response.BadRequest(err, res)
            if (representanteDB[0]) return Response.BadRequest(err, res, 'El Usuario ya se encuentra asignado')

            //validando representante
            await Representante.findById(id).exec(async (err, repreDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!repreDB) return Response.BadRequest(err, res, 'No existe el Representante')
                if (!repreDB.estado) return Response.BadRequest(err, res, 'Un representante Borrado no puede ser asignado')

                //editando
                await Representante.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                    if (err) return Response.BadRequest(err, res)
                    Response.GoodRequest(res, usuarioDB)
                })
            })
        })
    })
})

//Quitar asignacion del usuario
app.delete('/api/representante/desasignar/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        usuario: null
    }

    await Representante.findById(id, async (err, representanteDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!representanteDB) return Response.BadRequest(err, res, 'El Representante no existe, id inválido')
        if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

        await Representante.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

//Ver todos los representantes que no tienen usuarios asignados
app.get('/api/usuarios/representantes/noAsignados', [verificarToken, verificarNotRepresentant], async (req, res) => {

    await Representante.find({ estado: true }).populate({ path: 'usuario', model: 'usuario' }).exec(async (err, representantesDB) => {
        if (err) return Response.BadRequest(err, res)

        await Usuario.find({ estado: true, rol: 'REPRESENTANT_ROLE' }).exec((err, usuariosDB) => {
            if (err) return Response.BadRequest(err, res)

            if (representantesDB[0]) {
                let codigosRepre = representantesDB.map(v => {
                    return v.usuario ? v.usuario._id : null
                })
                codigosRepre = codigosRepre.filter(v => v != null)

                var usuariosNoAsignados = {}

                if (usuariosDB[0]) {
                    for (let i = 0; i < codigosRepre.length; i++) {
                        usuariosNoAsignados = usuariosDB.filter(v => v._id.toString() != codigosRepre[i])
                    }
                    Response.GoodRequest(res, usuariosNoAsignados)
                }
            } else {
                Response.GoodRequest(res, usuariosDB)
            }
        })
    })
})

//creo que falta cuando el representante quiera cambiar su propia información, preguntar si debería poder
module.exports = app