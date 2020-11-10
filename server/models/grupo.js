const mongoose = require('mongoose')

let Schema = mongoose.Schema

let grupoSchema = new Schema({
    pregunta: { type: Schema.Types.ObjectId, ref: 'pregunta', required: true },
    formulario: { type: Schema.Types.ObjectId, ref: 'formulario', required: true },
    respuesta: { type: String, default: true },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('grupo', grupoSchema)