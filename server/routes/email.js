const { verificarToken, verificarAdmin_Rol } = require('../middlewares/autentication')
const Response = require('../utils/response')
const Usuario = require('../models/usuario')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const express = require('express')
const _ = require('underscore')
const Path = require("path")
const ejs = require('ejs')
const app = express()

//Correo para la verificación de Email
app.post('/api/email/verifica/', verificarToken, async (req, res) => {
    let { id } = req.body
    const asunto = 'Verificación de email';

    if (!id) {
        return Response.BadRequest(null, res, 'No se ha enviado destinatario')
    }

    await Usuario.findById(id, async (err, usuarioDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!usuarioDB) return Response.BadRequest(err, res, 'No se encuentra destinatario')
        if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El Usuario está actualmente Borrado')

        let token = generarToken(usuarioDB, false)

        let pass = usuarioDB.password ? 'true' : 'false'

        await ejs.renderFile(

            Path.join(__dirname, '../emails/verificar.ejs'),

            {
                nombre: usuarioDB.nombre,
                apellido: usuarioDB.apellido,
                password: pass,
                domain: process.env.PUBLIC_DOMAIN,
                token
            },

            async (err, html) => {
                if (err) return Response.BadRequest(err, res)
                if (!await enviarMensaje(html, usuarioDB.email, asunto)) return Response.BadRequest(err, res, 'No se pudo enviar el correo')
                const agregartoken = {
                    verificacionToken: token
                }
                await Usuario.findByIdAndUpdate(id, agregartoken, (err, usuarioEditado) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!usuarioEditado) return Response.BadRequest(err, res, 'Error al acceder al Usuario')
                    Response.GoodRequest(res)
                })
            })
    })
})

//Correo para restaurar la contraseña
app.post('/api/email/restaura/', async (req, res) => {
    let { email } = req.body
    const asunto = 'Reestablecimiento de contraseña'
    await Usuario.findOne({ email: email }).exec(async (err, usuarioDB) => {
        if (err) return Response.BadRequest(err, res)
        if (!usuarioDB) return Response.BadRequest(err, res, 'No existe el usuario')
        if (!usuarioDB.activado) return Response.BadRequest(err, res, 'El correo no está validado, por favor valide su correo')
        if (!usuarioDB.estado) return Response.BadRequest(err, res, 'El usuario está actualmente Borrado')

        let token = generarToken(usuarioDB, true)

        await ejs.renderFile(

            Path.join(__dirname, '../emails/reestablecer.ejs'),

            {
                nombre: usuarioDB.nombre,
                apellido: usuarioDB.apellido,
                exp: jwt.decode(token).exp,
                domain: process.env.PUBLIC_DOMAIN,
                token
            },

            async (err, html) => {
                if (err) return Response.BadRequest(err, res)
                if (!await enviarMensaje(html, usuarioDB.email, asunto)) return Response.BadRequest(err, res, 'No se pudo enviar el correo')
                const agregartoken = {
                    verificacionToken: token,
                }
                await Usuario.findByIdAndUpdate(usuarioDB._id, agregartoken, (err, usuarioEditado) => {
                    if (err) return Response.BadRequest(err, res)
                    if (!usuarioEditado) return Response.BadRequest(err, res, 'Error al acceder al Usuario')
                    Response.GoodRequest(res)
                })
            })
    })
})


//Método para enviar los correos

async function enviarMensaje(contentHTML, email, asunto) {
    //Preparando el transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    //verificando que exista un correo destino
    if (email) {
        let error = true
        await transporter.sendMail({
            from: `Sistema de Prestadores Turísticos - SPT <${process.env.USER_EMAIL}>`,
            to: email,
            subject: asunto,
            html: contentHTML
        })
            .catch(() => {
                error = false
            })
        return error ? true : false
    } else return false
}

function generarToken(usuarioDB, time) {

    const usuario = {
        _id: usuarioDB.id
    }

    if (time) {
        let token = jwt.sign(
            {
                usuario
            },
            process.env.SEED_TOKEN,
            {
                expiresIn: process.env.CADUCIDAD_PASS
            }
        )
        return token
    } else {
        let token = jwt.sign(
            {
                usuario
            },
            process.env.SEED_TOKEN
        )
        return token
    }
}

module.exports = app