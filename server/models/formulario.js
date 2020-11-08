const mongoose = require('mongoose')

let Schema = mongoose.Schema

let formularioSchema = new Schema({
    tipoFormulario: { type: Schema.Types.ObjectId, ref: 'TipoFormulario', required: true },
    realizadoPor:  { type: Schema.Types.ObjectId, ref: 'Usuario' },
    estado: { type: Boolean, default: true }
})


module.exports = mongoose.model('formulario', formularioSchema)