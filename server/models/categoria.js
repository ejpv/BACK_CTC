const mongoose = require('mongoose')

let Schema = mongoose.Schema

let categoriaSchema = new Schema({
    nombre: { type: String, required: [true, 'El Nombre de la categoría es obligatorio'] }
})

module.exports = mongoose.model('categoria', categoriaSchema)