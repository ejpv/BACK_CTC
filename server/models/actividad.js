const mongoose = require('mongoose')

let Schema = mongoose.Schema

let actividadSchema = new Schema({
    nombre: { type: String, required: [true, 'El Nombre de la actividad es obligatorio'] }
})

module.exports = mongoose.model('actividad', actividadSchema)