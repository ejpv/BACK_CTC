const express = require('express')
const FormularioRepresentante = require('../models/formularioRepresentante')
const { verificarToken, verificarNotRepresentant } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()

//generar un Lugar
app.post('/api/lugar', [verificarToken, verificarNotRepresentant], (req, res)=>{})

//Ver todos los lugares
app.get('/api/lugares', [verificarToken, verificarNotRepresentant], (req, res)=>{})

//Editar un lugar por id
app.put('/api/lugar/:id', [verificarToken, verificarNotRepresentant], (req, res)=>{})

//Eliminar un lugar por id
app.put('/api/lugar/:id', [verificarToken, verificarNotRepresentant], (req, res)=>{})

//Restaurar un lugar por id
app.put('/api/lugar/:id/restaurar', [verificarToken, verificarNotRepresentant], (req, res)=>{})

module.exports = app