const mongoose = require('mongoose')

let tiposValidos = {
    values: ['SN', 'ABIERTA', 'SELECCION', 'MULTIPLE'],
    message: '{VALUE} no es un tipo de pregunta válido'
}

let Schema = mongoose.Schema

let preguntaSchema = new Schema({
    tipo: { type: String, required: [true, 'El Tipo de pregunta es necesario'], enum: tiposValidos },
    enunciado: { type: String, required: [true, 'El Enunciado de la pregunta es necesario'] },
    opciones: { type: Array },
    estado: { type: Boolean, default: true }
})


module.exports = mongoose.model('pregunta', preguntaSchema)