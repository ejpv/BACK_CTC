const mongoose = require('mongoose')

let Schema = mongoose.Schema

let establecimientoSchema = new Schema({
    nombrePropietario: {type: String, required: [true, 'El Propietario es obligatorio']},
    representante: { type: Schema.Types.ObjectId, ref: 'Representante', required: true },
    administrador: {type: String, required: true},
    lugar: { type: Schema.Types.ObjectId, ref: 'Lugar', required: true },
    registro: {type: String, required: false},
    LUAF: {type:String, required: false},
    email: {type: String, required: [true, 'El email es requerido']},
    nacionalidad: {type: String, required: false},
    web:{ type:String, required: false},
    telefono: {type: String, required: false},
    areaProtegida: {type: Schema.Types.ObjectId, ref: 'AreaProtegida', required: false},
    estado: { type: Boolean, default: true }
})


module.exports = mongoose.model('establecimiento', establecimientoSchema)