const path = require('path')

/*
============================
Puerto
============================
¨*/

process.env.PORT = process.env.PORT || 3000

/*
============================
Entorno
============================
*/
process.env.NODE_ENV = process.env.NODE_ENV || 'dev'

/*
============================
Expiracion token
============================
60 segundos
60 minutos
24 horas
5 días
*/

process.env.CADUCIDAD_TOKEN = process.env.CADUCIDAD_TOKEN || '24h'


/*
============================
Expiración de password
============================
*/

process.env.CADUCIDAD_PASS = process.env.CADUCIDAD_PASS || '10min'

/*
============================
Semilla Token
============================
*/

process.env.SEED_TOKEN = process.env.SEED_TOKEN || 'seed-token-node'

/*
============================
Dominio
============================
*/

process.env.DOMAIN = process.env.DOMAIN || `http://localhost:${process.env.PORT}`

/*
============================
DB
============================
*/

process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ctc'

/*
============================
Almacenamiento
============================
*/
process.env.SANDBOX = process.env.SANDBOX || path.join(__dirname, '../../.sandbox')

/*
=========================
Nombre de usuario email
=========================
*/

process.env.USER_EMAIL = process.env.USER_EMAIL

/*
=========================
Contraseña email
=========================
*/

process.env.PASSWORD = process.env.PASSWORD