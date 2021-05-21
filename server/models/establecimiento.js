const mongoose = require('mongoose')

let Schema = mongoose.Schema

let establecimientoSchema = new Schema({
  nombre: { type: String, required: [true, 'El Nombre del establecimiento es obligatorio'] },
  representante: { type: Schema.Types.ObjectId, ref: 'Representante', },
  administrador: { type: String, required: [true, 'El Administrador es obligatorio'] },
  registro: { type: String },
  LUAF: { type: String },
  email: { type: String },
  nacionalidad: { type: String },
  web: { type: String },
  telefono: { type: String },
  provincia: { type: String },
  canton: { type: String },
  ciudad: { type: String },
  parroquia: { type: String },
  lat: { type: String },
  lng: { type: String },
  agua: { type: String },
  saneamiento: { type: String },
  energia: { type: String },
  desechos: { type: String },
  personal: { type: String, default: 0 },
  areaProtegida: { type: Schema.Types.ObjectId, ref: 'AreaProtegida' },
  estado: { type: Boolean, default: true }
})

module.exports = mongoose.model('establecimiento', establecimientoSchema)