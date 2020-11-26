const mongoose = require('mongoose')

let Schema = mongoose.Schema

let lugarSchema = new Schema({
    provincia: { type: String },
    canton: { type: String },
    ciudad: { type: String },
    parroquia: { type: String },
    lat: { type: String },
    lon: { type: String },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('lugar', lugarSchema)