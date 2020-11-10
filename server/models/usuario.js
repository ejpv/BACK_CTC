const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let rolesValidos = {
  values: ['ADMIN_ROLE', 'TECHNICAL_ROLE', 'REPRESENTANT_ROLE'],
  message: '{VALUE} no es un rol válido'
}

let Schema = mongoose.Schema

let usuarioSchema = new Schema({
  nombre: { type: String, required: [true, 'El nombre es necesario'] },
  apellido: { type: String, required: [true, 'El apellido es necesario'] },
  email: { type: String, unique: true, required: [true, 'El correo es necesario'] },
  password: { type: String, required: [true, 'La contraseña es obligatoria'] },
  avatar: { type: String },
  rol: {
    type: String,
    default: 'TECHNICAL_ROLE',
    required: [true, 'El Rol es necesario'],
    enum: rolesValidos
  },
  estado: { type: Boolean, default: true },
  activado: { type: Boolean, default: false }
})

usuarioSchema.methods.toJSON = function () {
  let user = this
  let userObject = user.toObject()
  delete userObject.password

  return userObject
}

usuarioSchema.plugin(uniqueValidator, {
  message: '{PATH} debe de ser único'
})

module.exports = mongoose.model('usuario', usuarioSchema)
