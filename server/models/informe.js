const mongoose = require('mongoose')

let Schema = mongoose.Schema

let informeSchema = new Schema({
    diagnostico: [{ type: Schema.Types.ObjectId, ref: 'diagnostico', required: true }],
    conclusion: [{ type: String }],
    recomendacion: [{ type: String }],
    observacion: [{ type: String }],
    clasificacion: [{ type: String }],
    servicio: [{ type: Boolean }],
    personal: [{ type: Number }],
    actualPersonal: { type: Number, default: 0 },
    actividad: [{ type: String }],
    realizadoPor: { type: Schema.Types.ObjectId, ref: 'usuario', required: true },
    responsable: { type: Schema.Types.ObjectId, ref: 'usuario' },
    fechaCreacion: { type: Date, default: Date.now() },
    fechaFinal: { type: Date, default: null },
    retroalimentacion: { type: String },
    estado: { type: Boolean, default: null }
})

module.exports = mongoose.model('informe', informeSchema)