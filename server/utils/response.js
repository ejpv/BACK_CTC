const { json } = require("body-parser")

class Response {
  /**
   * Responder al cliente con Bad Request.
   * @param {*} err
   * @param {*} res
   */

  BadRequest(err, res, message) {
    if (message) {
      return res.status(400).json({
        ok: false,
        err: {
          message
        }
      })
    } else {
      if (err) {
        return res.status(400).json({
          ok: false,
          err
        })
      }
    }
  }

  GoodRequest(res, data, total) {
    if (data) {
      if (total) {
        return res.json({
          ok: true,
          total,
          data
        })
      } else {
        return res.json({
          ok: true,
          data
        })
      }
    } else {
      return res.status(204).json()
    }
  }

}

module.exports = new Response()
