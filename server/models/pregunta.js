const mongoose = require('mongoose')

let Schema = mongoose.Schema

let preguntaSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    tipoPregunta: { type: Schema.Types.ObjectId, ref: 'tipoPregunta', required: true },
    estado: { type: Boolean, default: true }
})


module.exports = mongoose.model('pregunta', preguntaSchema)