const express = require('express')
const Response = require('../utils/response')
const Categoria = require('../models/categoria')
const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const _ = require('underscore')
const app = express()


//Generar una categoría
app.post('/api/categoria', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let body = req.body

    let categoria = new Categoria({
        nombre: body.nombre
    })

    await categoria.save((err, categoriaDB) => {
        if (err) return Response.BadRequest(err, res)

        Response.GoodRequest(res, categoriaDB)
    })
})

//Obtener todas las categorías
app.get('/api/categorias', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    await Categoria.find().exec(async (err, categorias) => {
        if (err) return Response.BadRequest(err, res)

        await Categoria.countDocuments((err, conteo) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res, categorias, conteo)
        })
    })
})

//Editar una categoría
app.put('/api/categoria/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id
    let body = _.pick(req.body, ['nombre'])

    await Categoria.findById(id, async (err, categoriaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!categoriaDB) return Response.BadRequest(err, res, 'No existe la Categoría, id inválido')
        await Categoria.findByIdAndUpdate(id, body, { runValidators: true, context: 'query' }, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })

})

//Eliminar una categoría
app.delete('/api/categoria/:id', [verificarToken, verificarAdmin_Rol], async (req, res) => {
    let id = req.params.id

    await Categoria.findById(id, async (err, categoriaDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!categoriaDB) return Response.BadRequest(err, res, 'No existe la categoría, id inválido')
        await Categoria.findByIdAndRemove(id, (err) => {
            if (err) return Response.BadRequest(err, res)
            Response.GoodRequest(res)
        })
    })
})

module.exports = app