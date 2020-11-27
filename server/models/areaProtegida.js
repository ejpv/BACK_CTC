const mongoose = require('mongoose')

let Schema = mongoose.Schema

let areaProtegidaSchema = new Schema({
    tipo: {type: String, required: [true, 'El tipo de Area Protegida, es necesaria'] },
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('areaProtegida', areaProtegidaSchema)