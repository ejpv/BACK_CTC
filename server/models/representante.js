const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let Schema = mongoose.Schema

let representanteSchema = new Schema({
  nombre: { type: String, required: [true, 'El nombre es necesario'] },
  apellido: { type: String, required: [true, 'El apellido es necesario'] },
  email: { type: String, unique: true, required: [true, 'El correo es necesario'] },
  cedula: { type: String, required: [true, 'La cédula es obligatoria'], unique: true },
  direccion: { type: String },
  telefono: { type: String, default: 0 },
  usuario: { type: Schema.Types.ObjectId, ref: 'usuario'},
  estado: { type: Boolean, default: true },
})

representanteSchema.plugin(uniqueValidator, {
  message: '{PATH} debe de ser único'
})

module.exports = mongoose.model('representante', representanteSchema)