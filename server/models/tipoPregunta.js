const mongoose = require('mongoose')

let Schema = mongoose.Schema

let tipoPreguntaSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('tipoPregunta', tipoPreguntaSchema)