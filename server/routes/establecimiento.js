const express = require('express');
const Response = require('../utils/response')
const Establecimiento = require('../models/establecimiento');
const Lugar = require('../models/lugar');
const Representante = require('../models/representante');
const AreaProtegida = require('../models/areaProtegida');
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication');
const _ = require('underscore');
const app = express();

//crear establecimiento
app.post('/api/establecimiento', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let body = req.body
    let toDo = 0
    let establecimiento = new Establecimiento({
        nombre: body.nombre,
        nombrePropietario: body.nombrePropietario,
        administrador: body.administrador,
        lugar: body.lugar,
        registro: body.registro,
        LUAF: body.LUAF,
        email: body.email,
        nacionalidad: body.nombrePropietario,
        web: body.web,
        telefono: body.telefono,
        areaProtegida: body.areaProtegida,
        representante: body.representante
    })
    if (establecimiento.lugar) {
        await Lugar.findById(establecimiento.lugar).exec(async (err, lugarDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            if (!lugarDB) {
                return Response.BadRequest(err, res, 'Lugar no encontrado, id inválido')
            }

            if (!lugarDB.estado) {
                return Response.BadRequest(err, res, 'El Lugar está actualmente Borrado')
            }

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
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!representanteDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                        }
                        if (!representanteDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                        }
                        await Establecimiento.find({ representante: establecimiento.representante }).exec(async (err, establecimientoDB) => {
                            if (err) {
                                error = true
                                return Response.BadRequest(err, res)
                            }

                            if (establecimientoDB[0]) {
                                error = true
                                return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')
                            }
                            await establecimiento.save((err, establecimientoDB) => {
                                if (err) {
                                    return Response.BadRequest(err, res)
                                }

                                Response.GoodRequest(res, establecimientoDB)
                            })
                        })
                    })
                    break;

                case 2:
                    await AreaProtegida.findById(establecimiento.areaProtegida).exec(async (err, areaProtegidaDB) => {
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!areaProtegidaDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                        }
                        if (!areaProtegidaDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')
                        }

                        await establecimiento.save((err, establecimientoDB) => {
                            if (err) {
                                return Response.BadRequest(err, res)
                            }

                            Response.GoodRequest(res, establecimientoDB)
                        })
                    })
                    break;

                case 3:
                    await AreaProtegida.findById(establecimiento.areaProtegida).exec(async (err, areaProtegidaDB) => {
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!areaProtegidaDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                        }
                        if (!areaProtegidaDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')
                        }
                        await Representante.findById(establecimiento.representante).exec(async (err, representanteDB) => {
                            if (err) {
                                error = true
                                return Response.BadRequest(err, res)
                            }
                            if (!representanteDB) {
                                error = true
                                return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                            }
                            if (!representanteDB.estado) {
                                error = true
                                return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                            }
                            await Establecimiento.find({ representante: establecimiento.representante }).exec(async (err, establecimientoDB) => {
                                if (err) {
                                    error = true
                                    return Response.BadRequest(err, res)
                                }

                                if (establecimientoDB[0]) {
                                    error = true
                                    return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')
                                }

                                await establecimiento.save((err, establecimientoDB) => {
                                    if (err) {
                                        return Response.BadRequest(err, res)
                                    }

                                    Response.GoodRequest(res, establecimientoDB)
                                })
                            })
                        })
                    })
                    break;

                default:
                    await establecimiento.save((err, establecimientoDB) => {
                        if (err) {
                            return Response.BadRequest(err, res)
                        }

                        Response.GoodRequest(res, establecimientoDB)
                    })
                    break;
            }

        })
    } else {
        //esto es para que mande el error si no existe el lugar
        await establecimiento.save((err, establecimientoDB) => {
            if (err) {
                return Response.BadRequest(err, res)
            }
        })
    }
})

//obtener todos los establecimientos
app.get('/api/establecimientos', [verificarToken, verificarNotRepresentant], async (req, res) => {
    // el estado por defecto es true, solo acepta estado falso por la url
    const estado = req.query.estado === 'false' ? false : true

    await Establecimiento.find({ estado })
        .populate({ path: 'lugar', model: 'lugar' })
        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
        .populate({ path: 'representante', model: 'representante' })
        .exec(async (err, establecimientos) => {
            if (err) {
                return Response.BadRequest(err, res)
            }

            await Establecimiento.countDocuments({ estado }, (err, conteo) => {
                if (err) {
                    return Response.BadRequest(err, res)
                }
                Response.GoodRequest(res, establecimientos, conteo)
            })
        })
})

//obtener un establecimiento por id
app.get('/api/establecimiento/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    await Establecimiento.findByIdAndUpdate(id)
        .populate({ path: 'lugar', model: 'lugar' })
        .populate({ path: 'areaProtegida', model: 'areaProtegida' })
        .populate({ path: 'representante', model: 'representante' })
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
    let body = _.pick(req.body, ['nombre','nombrePropietario', 'administrador', 'lugar', 'registro', 'LUAF', 'email', 'nacionalidad', 'web', 'telefono', 'areaProtegida', 'representante'])
    let toDo = 0

    if (body.lugar) {
        await Lugar.findById(body.lugar).exec(async (err, lugarDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!lugarDB) return Response.BadRequest(err, res, 'Lugar no encontrado, id inválido')
            if (!lugarDB.estado) return Response.BadRequest(err, res, 'El Lugar está actualmente Borrado')

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
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!representanteDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                        }
                        if (!representanteDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                        }
                        await Establecimiento.find({ representante: body.representante }).exec(async (err, establecimientoDB) => {
                            if (err) {
                                error = true
                                return Response.BadRequest(err, res)
                            }

                            if (establecimientoDB[0]) {
                                error = true
                                return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')
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
                    })
                    break;

                case 2:
                    await AreaProtegida.findById(body.areaProtegida).exec(async (err, areaProtegidaDB) => {
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!areaProtegidaDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                        }
                        if (!areaProtegidaDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')
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
                    break;

                case 3:
                    await AreaProtegida.findById(body.areaProtegida).exec(async (err, areaProtegidaDB) => {
                        if (err) {
                            error = true
                            return Response.BadRequest(err, res)
                        }
                        if (!areaProtegidaDB) {
                            error = true
                            return Response.BadRequest(err, res, 'Area Protegida no encontrada, id inválido')
                        }
                        if (!areaProtegidaDB.estado) {
                            error = true
                            return Response.BadRequest(err, res, 'El Area Protegida está actualmente Borrada')
                        }
                        await Representante.findById(body.representante).exec(async (err, representanteDB) => {
                            if (err) {
                                error = true
                                return Response.BadRequest(err, res)
                            }
                            if (!representanteDB) {
                                error = true
                                return Response.BadRequest(err, res, 'Representante no encontrado, id inválido')
                            }
                            if (!representanteDB.estado) {
                                error = true
                                return Response.BadRequest(err, res, 'El Representante está actualmente Borrado')
                            }
                            await Establecimiento.find({ representante: body.representante }).exec(async (err, establecimientoDB) => {
                                if (err) {
                                    error = true
                                    return Response.BadRequest(err, res)
                                }

                                if (establecimientoDB[0]) {
                                    error = true
                                    return Response.BadRequest(err, res, 'El Representante ya está asignado a otro establecimiento')
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
                        })
                    })
                    break;

                default:
                    await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err, establecimientoDB) => {
                        if (err) return Response.BadRequest(err, res)
                        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
                        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

                        Response.GoodRequest(res)
                    })
                    break;
            }

        })
    } else {
        //esto es para que mande el error si no existe el lugar
        await Establecimiento.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err, establecimientoDB) => {
            if (err) return Response.BadRequest(err, res)
            if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
            if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')

            Response.GoodRequest(res)
        })
    }
})

//eliminar un establecimiento por id
app.delete('/api/establecimiento/:id', [verificarToken, verificarNotRepresentant], async (req, res) => {
    let id = req.params.id

    let cambiarEstado = {
        estado: false
    }

    await Establecimiento.findById(id, async (err, establecimientoDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!establecimientoDB) return Response.BadRequest(err, res, 'El Establecimiento no existe, id inválido')
        if (!establecimientoDB.estado) return Response.BadRequest(err, res, 'El Establecimiento está actualmente Borrado')
        await Establecimiento.findByIdAndUpdate(id, cambiarEstado, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
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