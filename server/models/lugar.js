const mongoose = require('mongoose')

let Schema = mongoose.Schema

let lugarSchema = new Schema({
    provincia: { type: String, required: [true, 'La provincia es necesaria'] },
    canton: { type: String, required: [true, 'El cantón es necesario'] },
    ciudad: { type: String },
    parroquia: { type: String, required: [true, 'La parroquia es necesaria'] },
    lat: { type: String, required: [true, 'La Latitud es necesaria'] },
    lng: { type: String, required: [true, 'La Longitud es necesaria'] },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('lugar', lugarSchema)