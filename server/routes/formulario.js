const express = require('express');
const Formulario = require('../models/formulario');
const { verificarToken } = require('../middlewares/autentication');
const TipoFormulario = require('../models/tipoFormulario');
const app = express();


module.exports = app;