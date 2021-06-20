const mongoose = require('mongoose')

let Schema = mongoose.Schema

let diagnosticoSchema = new Schema({
    establecimiento: { type: Schema.Types.ObjectId, ref: 'establecimiento', required: [true, 'El establecimiento es necesario'] },
    formulario: { type: Schema.Types.ObjectId, ref: 'formulario', required: [true, 'El formulario es necesario'] },
    respuesta: { type: Array, required: [true, 'Las respuestas son necesarias'] },
    total: { type: String, default: 0 },
    ejecutadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    estado: { type: Boolean, default: true },
    fecha: { type: Date, default: Date.now() }
})

module.exports = mongoose.model('diagnostico', diagnosticoSchema)