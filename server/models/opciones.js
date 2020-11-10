const mongoose = require('mongoose')

let Schema = mongoose.Schema

let opcionesSchema = new Schema({
    pregunta: { type: Schema.Types.ObjectId, ref: 'pregunta', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'item', required: true },
    check: { type: Boolean, default: true },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('opciones', opcionesSchema)