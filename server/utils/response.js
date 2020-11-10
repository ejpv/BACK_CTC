class Response {
  /**
   * Responder al cliente con Bad Request.
   * @param {*} err
   * @param {*} res
   */
  BadRequest(err, res, status = 400) {
    if (!err || !res) return

    return res.status(status).json({
      ok: false,
      err
    })
  }
}

module.exports = new Response()
