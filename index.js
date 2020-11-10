const fs = require('fs')

// LLamar las variables de entorno.
require('dotenv').config()

// Escuchar el servidor
require('./server/server')

// crear el directorio de sandbox
if (!fs.existsSync(process.env.SANDBOX)) {
  fs.mkdirSync(process.env.SANDBOX)
}
