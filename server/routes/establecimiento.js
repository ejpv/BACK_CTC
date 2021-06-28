const express = require('express');
const Response = require('../utils/response')
const Establecimiento = require('../models/establecimiento');
const Diagnostico = require('../models/diagnostico');
const Representante = require('../models/representante');
const AreaProtegida = require('../models/areaProtegida');
const Actividad = require('../models/actividad')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication');
const _ = require('underscore');
const app = express();

//crear establecimiento
app.post('/api/establecimiento', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body
    let toDo = 0
    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }
    let establecimiento = new Establecimiento({
        nombre: body.nombre,
        administrador: body.administrador,
        registro: body.registro,
        LUAF: body.LUAF,
        email: body.email,
        nacionalidad: body.nacionalidad,
        web: body.web,
        telefono: body.telefono,
        comunidad: body.comunidad,
        provincia: body.provincia,
        canton: body.canton,
        ciudad: body.ciudad,
        parroquia: body.parroquia,
        lat: body.lat,
        lng: body.lng,
        agua: body.agua,
        saneamiento: body.saneamiento,
        energia: body.energia,
        desechos: body.desechos,
        personal: body.personal,
        areaProtegida: body.areaProtegida,
        representante: body.representante
    })

    //Esto recibe cual es la combinación que se envía desde el cliente
    // ambos ids
    // o solo un, y cual de esos
    if (establecimiento.areaProtegida && establecimiento.representante) { toDo = 3 } else {
        if (establecimiento.areaProtegida) toDo = 2
        if (establecimiento.representante) toDo = 1
    }

    //el switch realiza la acción y comprobaciones de cada una dependiendo de la combinación

    switch (toDo) {
        case 1:
            await Representante.findById(establecimiento.representante).exec(async (err, representanteDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                await Establecimiento.find({ representante: establecimiento.representante }).exec(async (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (establecimientoDB[0]) return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')

                    if (establecimiento.actividad) {
                        for (let i = 0; i < establecimiento.actividad.length; i++) {
                            await Actividad.findById(establecimiento.actividad[i], (err, result) => {
                                if (err) {
                                    errors.err += 1
                                    errors.idErr.push(i)
                                }
                                if (!result) {
                                    errors.notFound += 1
                                    errors.idNotFound.push(i)
                                }
                            })
                        }
                    }

                    if (errors.err == 0 && errors.notFound == 0) {
                        await establecimiento.save(async (err, establecimientoDB) => {
                            if (err) return Response.BadRequest(err, res)

                            await Representante.findByIdAndUpdate(establecimiento.representante, { asignado: true }).exec(async (err) => {

                                if (err) return Response.BadRequest(err, res, 'No se pudo actualizar representante')

                                await Establecimiento.findById(establecimientoDB._id)
                                    .populate({ path: 'areaProtegida', model: 'areaProtegida' })
                                    .populate({ path: 'representante', model: 'representante' })
                                    .populate({ path: 'actividad', model: 'actividad' }).exec((err, establishment) => {
                                        if (err) return Response.BadRequest(err, res)
                                        return Response.GoodRequest(res, establishment)
                                    })
                            })
                        })
                    } else {
                        Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                        return Response.BadRequest(errors, res)
                    }
                })
            })
            break;

        case 2:
            await AreaProtegida.findById(establecimiento.areaProtegida).exec(async (err, areaProtegidaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaProtegidaDB) return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')

                if (establecimiento.actividad) {
                    for (let i = 0; i < establecimiento.actividad.length; i++) {
                        await Actividad.findById(establecimiento.actividad[i], (err, result) => {
                            if (err) {
                                errors.err += 1
                                errors.idErr.push(i)
                            }
                            if (!result) {
                                errors.notFound += 1
                                errors.idNotFound.push(i)
                            }
                        })
                    }
                }

                if (errors.err == 0 && errors.notFound == 0) {
                    await establecimiento.save(async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)

                        await Establecimiento.findById(establecimientoDB._id)
                            .populate({ path: 'areaProtegida', model: 'areaProtegida' })
                            .populate({ path: 'representante', model: 'representante' })
                            .populate({ path: 'actividad', model: 'actividad' }).exec((err, establishment) => {
                                if (err) return Response.BadRequest(err, res)
                                return Response.GoodRequest(res, establishment)
                            })
                    })
                } else {
                    Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                    return Response.BadRequest(errors, res)
                }
            })
            break;

        case 3:
            await AreaProtegida.findById(establecimiento.areaProtegida).exec(async (err, areaProtegidaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaProtegidaDB) return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')
                await Representante.findById(establecimiento.representante).exec(async (err, representanteDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                    if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                    await Establecimiento.find({ representante: establecimiento.representante }).exec(async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (establecimientoDB[0]) return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')

                        if (establecimiento.actividad) {
                            for (let i = 0; i < establecimiento.actividad.length; i++) {
                                await Actividad.findById(establecimiento.actividad[i], (err, result) => {
                                    if (err) {
                                        errors.err += 1
                                        errors.idErr.push(i)
                                    }
                                    if (!result) {
                                        errors.notFound += 1
                                        errors.idNotFound.push(i)
                                    }
                                })
                            }
                        }

                        if (errors.err == 0 && errors.notFound == 0) {
                            await establecimiento.save(async (err, establecimientoDB) => {
                                if (err) return Response.BadRequest(err, res)

                                await Representante.findByIdAndUpdate(establecimiento.representante, { asignado: true }).exec(async (err) => {

                                    if (err) return Response.BadRequest(err, res, 'No se pudo actualizar representante')

                                    await Establecimiento.findById(establecimientoDB._id)
                                        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
                                        .populate({ path: 'representante', model: 'representante' })
                                        .populate({ path: 'actividad', model: 'actividad' }).exec((err, establishment) => {
                                            if (err) return Response.BadRequest(err, res)
                                            return Response.GoodRequest(res, establishment)
                                        })
                                })
                            })
                        } else {
                            Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                            return Response.BadRequest(errors, res)
                        }
                    })
                })
            })
            break;

        default:
            if (establecimiento.actividad) {
                for (let i = 0; i < establecimiento.actividad.length; i++) {
                    await Actividad.findById(establecimiento.actividad[i], (err, result) => {
                        if (err) {
                            errors.err += 1
                            errors.idErr.push(i)
                        }
                        if (!result) {
                            errors.notFound += 1
                            errors.idNotFound.push(i)
                        }
                    })
                }
            }

            if (errors.err == 0 && errors.notFound == 0) {
                await establecimiento.save(async (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)

                    await Establecimiento.findById(establecimientoDB._id)
                        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
                        .populate({ path: 'representante', model: 'representante' })
                        .populate({ path: 'actividad', model: 'actividad' }).exec((err, establishment) => {
                            if (err) return Response.BadRequest(err, res)
                            return Response.GoodRequest(res, establishment)
                        })
                })
            } else {
                Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                return Response.BadRequest(errors, res)
            }
            break;
    }



})

//obtener todos los establecimientos
app.get('/api/establecimientos', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Establecimiento.find({ estado })
        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
        .populate({ path: 'representante', model: 'representante' })
        .populate({ path: 'actividad', model: 'actividad' })
        .exec(async (err, establecimientos) => {
            if (err) return Response.BadRequest(err, res)

            await Establecimiento.countDocuments({ estado }, (err, conteo) => {
                if (err) return Response.BadRequest(err, res)
                Response.GoodRequest(res, establecimientos, conteo)
            })
        })
})

//obtener un establecimiento por id
app.get('/api/establecimiento/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    await Establecimiento.findById(id)
        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
        .populate({ path: 'representante', model: 'representante' })
        .populate({ path: 'actividad', model: 'actividad' })
        .exec((err, establecimientoDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!establecimientoDB) return Response.BadRequest(err, res, 'El establecimiento no existe, id inválido')
            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El establecimiento está actualmente borrado')

            Response.GoodRequest(res, establecimientoDB)
        })
})

//editar un establecimiento por id
app.put('/api/establecimiento/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['nombre', 'administrador', 'registro', 'LUAF', 'email', 'nacionalidad', 'web', 'telefono', 'provincia', 'canton', 'ciudad', 'parroquia', 'lat', 'lng', 'agua', 'saneamiento', 'energia', 'desechos', 'areaProtegida', 'representante', 'personal', 'actividad', 'comunidad'])
    let toDo = 0
    let errors = {
        err: 0,
        idErr: [],
        notFound: 0,
        idNotFound: []
    }

    //Esto recibe cual es la combinación que se envía desde el cliente
    // ambos ids
    // o solo un, y cual de esos
    if (body.areaProtegida && body.representante) { toDo = 3 } else {
        if (body.areaProtegida) { toDo = 2 }
        if (body.representante) { toDo = 1 }
    }

    //el switch realiza la acción y comprobaciones de cada una dependiendo de la combinación

    switch (toDo) {
        case 1:
            await Representante.findById(body.representante).exec(async (err, representanteDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                await Establecimiento.find({ representante: body.representante }).exec(async (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (establecimientoDB[0]) return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')

                    if (body.actividad) {
                        for (let i = 0; i < body.actividad.length; i++) {
                            await Actividad.findById(body.actividad[i], (err, result) => {
                                if (err) {
                                    errors.err += 1
                                    errors.idErr.push(i)
                                }
                                if (!result) {
                                    errors.notFound += 1
                                    errors.idNotFound.push(i)
                                }
                            })
                        }
                    }

                    if (errors.err == 0 && errors.notFound == 0) {
                        await Establecimiento.findById(id, async (err, establecimientoDB) => {
                            if (err) return Response.BadRequest(err, res)
                            if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')
                            await Representante.findByIdAndUpdate(body.representante, { asignado: true }).exec(async (err) => {
                                if (err) return Response.BadRequest(err, res, 'No se pudo actualizar representante')

                                await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                                    if (err) return Response.BadRequest(err, res)
                                    Response.GoodRequest(res)
                                })
                            })
                        })
                    } else {
                        Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                        return Response.BadRequest(errors, res)
                    }
                })
            })
            break;

        case 2:
            await AreaProtegida.findById(body.areaProtegida).exec(async (err, areaProtegidaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaProtegidaDB) return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')

                if (body.actividad) {
                    for (let i = 0; i < body.actividad.length; i++) {
                        await Actividad.findById(body.actividad[i], (err, result) => {
                            if (err) {
                                errors.err += 1
                                errors.idErr.push(i)
                            }
                            if (!result) {
                                errors.notFound += 1
                                errors.idNotFound.push(i)
                            }
                        })
                    }
                }

                if (errors.err == 0 && errors.notFound == 0) {
                    await Establecimiento.findById(id, async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')
                        await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                            if (err) return Response.BadRequest(err, res)
                            Response.GoodRequest(res)
                        })
                    })
                } else {
                    Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                    return Response.BadRequest(errors, res)
                }
            })
            break;

        case 3:
            await AreaProtegida.findById(body.areaProtegida).exec(async (err, areaProtegidaDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!areaProtegidaDB) return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                if (!areaProtegidaDB.estado) return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')

                await Representante.findById(body.representante).exec(async (err, representanteDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!representanteDB) return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                    if (!representanteDB.estado) return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')

                    await Establecimiento.find({ representante: body.representante }).exec(async (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (establecimientoDB[0]) return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')

                        if (body.actividad) {
                            for (let i = 0; i < body.actividad.length; i++) {
                                await Actividad.findById(body.actividad[i], (err, result) => {
                                    if (err) {
                                        errors.err += 1
                                        errors.idErr.push(i)
                                    }
                                    if (!result) {
                                        errors.notFound += 1
                                        errors.idNotFound.push(i)
                                    }
                                })
                            }
                        }

                        if (errors.err == 0 && errors.notFound == 0) {
                            await Establecimiento.findById(id, async (err, establecimientoDB) => {
                                if (err) return Response.BadRequest(err, res)
                                if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                                if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

                                await Representante.findByIdAndUpdate(body.representante, { asignado: true }).exec(async (err) => {
                                    if (err) return Response.BadRequest(err, res, 'No se pudo actualizar representante')

                                    await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                                        if (err) return Response.BadRequest(err, res)
                                        Response.GoodRequest(res)
                                    })
                                })
                            })
                        } else {
                            Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                            return Response.BadRequest(errors, res)
                        }
                    })
                })
            })
            break;

        default:
            if (body.actividad) {
                for (let i = 0; i < body.actividad.length; i++) {
                    await Actividad.findById(body.actividad[i], (err, result) => {
                        if (err) {
                            errors.err += 1
                            errors.idErr.push(i)
                        }
                        if (!result) {
                            errors.notFound += 1
                            errors.idNotFound.push(i)
                        }
                    })
                }
            }

            if (errors.err == 0 && errors.notFound == 0) {
                await Establecimiento.findById(id, async (err, establecimientoDB) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                    if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')
                    await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                        if (err) return Response.BadRequest(err, res)
                        Response.GoodRequest(res)
                    })
                })
            } else {
                Object.assign(errors, { message: '*Error*' + errors.err + ' errores de la Base de datos en las actividades [' + errors.idErr + '] y ' + errors.notFound + ' errores de entidades no encontradas en las actividades [ ' + errors.idNotFound + ']' })
                return Response.BadRequest(errors, res)
            }
            break;
    }
})

//desasignar Representante por id del establecimiento
app.put('/api/establecimiento/removerRepresentante/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id
    let body = {
        representante: null
    }

    await Establecimiento.findById(id, async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

        await Representante.findByIdAndUpdate(establecimientoDB.representante, { asignado: false }).exec(async (err) => {
            if (err) return Response.BadRequest(err, res, 'No se pudo actualizar representante')

            await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
                if (err) return Response.BadRequest(err, res)
                Response.GoodRequest(res)
            })
        })
    })
})

//desasignar AreaProtegida por id del establecimiento
app.put('/api/establecimiento/removerArea/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {

    let id = req.params.id
    let body = {
        areaProtegida: null
    }

    await Establecimiento.findById(id, async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

        await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

//eliminar un establecimiento por id
app.delete('/api/establecimiento/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }
    await Diagnostico.find({ establecimiento: id }).exec(async (err, diagnosticosDB) => {
        if (err) return Response.BadRequest(err, res)
        if (diagnosticosDB[0] != undefined) {
            await Establecimiento.findById(id, async (err, establecimientoDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

                await Establecimiento.findByIdAndUpdate(id, cambiarEstado, (err) => {
                    if (err) return Response.BadRequest(err, res)

                    Response.GoodRequest(res)
                })

            })
        } else {
            await Establecimiento.findById(id, async (err, establecimientoDB) => {
                if (err) return Response.BadRequest(err, res)
                if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')

                await Establecimiento.findByIdAndRemove(id, (err) => {
                    if (err) return Response.BadRequest(err, res)

                    Response.GoodRequest(res)
                })
            })
        }
    })

})

//restaurar un establecimiento
app.put('/api/establecimiento/:id/restaurar', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: true
    }

    await Establecimiento.findById(id, async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
        if (establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento actualmente no está borrado')
        await Establecimiento.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

module.exports = app;