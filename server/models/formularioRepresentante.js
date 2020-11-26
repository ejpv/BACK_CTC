const mongoose = require('mongoose')

let Schema = mongoose.Schema

let formularioRepresentanteSchema = new Schema({
    establecimiento: { type: Schema.Types.ObjectId, ref: 'establecimiento', required: true },
    formulario: { type: Schema.Types.ObjectId, ref: 'formulario', required: true },
    respuestas: { type: Array, required: true },
    //respuesta: ['verdadero','falso', [1,2,3,4,5,6], 2, 'pambilko', 'Estados Unidos de América']
    total: { type: String, default: 0 },
    ejecutadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    estado: { type: Boolean, default: true },
})

module.exports = mongoose.model('formularioRepresentante', formularioRepresentanteSchema)