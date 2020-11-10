/**
 * Generar una cadena de strings
 * @param length Número de characters
 * @param date Incluir fecha
 */
function randomString(length, date) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let random = ''
  for (let i = 0; i < length; i++) {
    random += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return date ? `${random}.${Date.now()}` : random
}

class Random {
  /**
   * Generar una cadena de strings
   * @param length Número de characteres
   * @param date Incluir fecha
   */
  string(length, date = false) {
    randomString(length, date)
  }

  /**
   * Generar un nombre de archivo
   * @param extension Extension del archivo
   */
  filename(extension) {
    return `${randomString(25, true)}.${extension}`
  }
}
module.exports = new Random()
