const jwt = require('jsonwebtoken')
// ======================
//  Verificar Token
// ======================

let verificarToken = (req, res, next) => {
  let token = req.get('token')
  jwt.verify(token, process.env.SEED_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        ok: false,
        err
      })
    }
    req.usuario = decoded.usuario
    next()
  })
}

let verificarAdmin_Rol = (req, res, next) => {
  let usuario = req.usuario

  if (usuario.rol === ('USER_ROLE' || 'REPRESENTANT_ROLE')) {
    return res.json({
      ok: false,
      err: {
        message: 'El usuario no es administrador'
      }
    })
  } else {
    next()
  }
}

module.exports = {
  verificarToken,
  verificarAdmin_Rol
}
