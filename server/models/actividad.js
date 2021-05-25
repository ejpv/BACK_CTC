const mongoose = require('mongoose')

let Schema = mongoose.Schema

let actividaSchema = new Schema({
    nombre: { type: String, required: [true, 'El Nombre de la actividad es obligatorio'] }
})

module.exports = mongoose.model('activida', actividaSchema)