const mongoose = require('mongoose')

let Schema = mongoose.Schema

let informeSchema = new Schema({
    diagnostico: [{ type: Schema.Types.ObjectId, ref: 'diagnostico', required: true }],
    conclusion: [{ type: String }],
    recomendacion: [{ type: String }],
    observacion: [{ type: String }],
    realizadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    responsable: { type: Schema.Types.ObjectId, ref: 'usuario', },
    fechaCreacion: { type: String, default: new Date().toLocaleDateString() },
    fechaFinal: { type: String, default: null },
    retroalimentacion: { type: String },
    estado: { type: Boolean, default: null }
})

module.exports = mongoose.model('informe', informeSchema)