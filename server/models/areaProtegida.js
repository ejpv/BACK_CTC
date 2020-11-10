const mongoose = require('mongoose')

let Schema = mongoose.Schema

let areaProtegidaSchema = new Schema({
    tipo: {type: Schema.Types.ObjectId, ref: 'TipoArea', required: true },
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('areaProtegida', areaProtegidaSchema)