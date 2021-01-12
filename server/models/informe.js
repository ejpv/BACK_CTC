const mongoose = require('mongoose')

let Schema = mongoose.Schema

let informeSchema = new Schema({
    diagnostico: [{ type: Schema.Types.ObjectId, ref: 'diagnostico', required: true }],
    conclusion: [{ type: String }],
    recomendacion: [{ type: String }],
    observacion: [{ type: String }],
    realizadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    aprobadoPor: { type: Schema.Types.ObjectId, ref: 'usuario',},
    estado: { type: Boolean, default: true }
})

module.exports = mongoose.model('informe', informeSchema)