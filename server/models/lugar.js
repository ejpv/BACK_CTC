const mongoose = require('mongoose')

let Schema = mongoose.Schema

let lugarSchema = new Schema({
    provincia: { type: String, required: false },
    canton: { type: String, required: false },
    ciudad: { type: String, required: false },
    parroquia: { type: String, required: false },
    lat: { type: String, required: false },
    lon: { type: String, required: false },
    estado: { type: Boolean, default: true },
})


module.exports = mongoose.model('lugar', lugarSchema)