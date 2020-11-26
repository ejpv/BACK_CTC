const express = require('express')
const FormularioRepresentante = require('../models/formularioRepresentante')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//Generar un formulario
app.post('/api/formularioRepresentante', [verificarToken, verificarNotRepresentant], (req, res) => {
    let body = req.body
    //QUE VAINAAAA ME OLVIDE DE LOS ESTABLECIMIENTOS AHHHHHHHH Pero esto ya está, solo falta probarlos
    let formularioRepresentante = new FormularioRepresentante({
        establecimiento: body.establecimiento,
        formulario: body.formulario,
        respuesta: body.respuesta,
        total: body.total,
        ejecutadoPor: req.usuario._id
    })

    formularioRepresentante.save((err, formularioRepreDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            formularioRepresentante: formularioRepreDB
        })
    })
})

//Obtener todos los formularios
app.get('/api/formularioRepresentantes', [verificarToken, verificarNotRepresentant], (req, res) => {})

//Obtener formularios pertenenciente al representante
app.get('/api/formularioRepresentante/:id', verificarToken, (req, res) => {})

//Editar un formulario por id
app.put('/api/formularioRepresentante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {})

//Eliminar un formulario por id
app.delete('/api/formularioRepresentante/:id', [verificarToken, verificarNotRepresentant], (req, res) => {})

module.exports = app