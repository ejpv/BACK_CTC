const express = require('express')
const Representante = require('../models/representante')
const Response = require('../utils/response')
const Usuario = require('../models/usuario')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const app = express()

//obtener usuarios por nombre 
app.get('/api/busqueda/usuarios/:termino', verificarToken, async (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    await Usuario.find({ nombre: regex, estado: true }, 'nombre apellido email rol activado avatar').exec(
        async (err, usuarios) => {
            if (err) return Response.BadRequest(err, res)
            if (!usuarios) return Response.BadRequest(err, res, 'No se han encontrado Usuarios.')
            Response.GoodRequest(res, usuarios)
        })
})

//obtener representantes por cédula
app.get('/api/busqueda/representantes/:termino', verificarToken, async (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    await Represenantes.find({ cedula: regex, estado: true }, 'nombre apellido email cedula direccion telefono usuario')
        .populate({ path: 'usuario', model: 'usuario' })
        .exec(
            async (err, representantes) => {
                if (err) return Response.BadRequest(err, res)
                if (!representantes) return Response.BadRequest(err, res, 'No se han encontrado Representantes.')
                Response.GoodRequest(res, represenantes)
            })
})

//obtener preguntas por tipo
app.get('/api/busqueda/preguntas/:termino', verificarToken, async (req, res) => {
    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    await Pregunta.find({ tipo: regex, estado: true }).exec(async (err, preguntas) => {
        if (err) return Response.BadRequest(err, res)
        if (!preguntas) return Response.BadRequest(err, res, 'No se han encontrado preguntas.')
        Response.GoodRequest(res, preguntas)
    })
})

//PREGUNTAR PORQUE CRITERIOS DEBERÍA BUSCAR
module.exports = app