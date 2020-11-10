const mongoose = require('mongoose')

let Schema = mongoose.Schema

let formularioRepresentanteSchema = new Schema({
    establecimiento: { type: Schema.Types.ObjectId, ref: 'establecimiento', required: true },
    ejecutadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    formulario: { type: Schema.Types.ObjectId, ref: 'formulario', required: true },
    total: { type: String, default: 0 },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('formularioRepresentante', formularioRepresentanteSchema)