const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let Schema = mongoose.Schema

let establecimientoSchema = new Schema({
  nombre: { type: String, required: [true, 'El Nombre del establecimiento es obligatorio'] },
  representante: { type: Schema.Types.ObjectId, ref: 'Representante', },
  administrador: { type: String, required: [true, 'El Administrador es obligatorio'] },
  lugar: { type: Schema.Types.ObjectId, ref: 'Lugar', required: [true, 'El Lugar es necesario'] },
  registro: { type: String, required: false },
  LUAF: { type: String, required: false },
  email: { type: String, required: false, unique: false },
  nacionalidad: { type: String, required: false },
  web: { type: String, required: false },
  telefono: { type: String, required: false },
  areaProtegida: { type: Schema.Types.ObjectId, ref: 'AreaProtegida', required: false },
  estado: { type: Boolean, default: true }
})

establecimientoSchema.plugin(uniqueValidator, {
  message: '{PATH} debe de ser único'
})

module.exports = mongoose.model('establecimiento', establecimientoSchema)