const mongoose = require('mongoose')

let Schema = mongoose.Schema

let formularioSchema = new Schema({
    tipo: { type: String, required: true },
    estado: { type: Boolean, default: true },
    realizadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    pregunta: [{ type: Schema.Types.ObjectId, ref: 'Pregunta' }],
})


module.exports = mongoose.model('formulario', formularioSchema)