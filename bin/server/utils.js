'use strict'

let
  Log = require('./../../lib/core/log').Log,
  log = new Log(process.env.LOG_LEVEL || 'ERROR', 'Server.utils')

function error(err, res) {
  log.error('error processing request', err)
  if('InputError' === err.name || 'SyntaxError' === err.name) {
    res.status(400).json({ error : err.message })
  }
  else {
    res.status(500).json({ error : err.message })
  }
}

function defaults(router) {
  router.use(function(req, res) {
    log.warn('cannot serve %s %s', req.method, req.url)
    res.sendStatus(404)
  })
  router.use(function(err, req, res, next) {
    error(err, res)
  })
}

exports.error = error
exports.defaults = defaults
