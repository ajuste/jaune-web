###*
 * @file   Source code for Json Responder
 * @author Alvaro Juste
###
'use strict'

# 3rd
lodash = require 'lodash'
{bind} = lodash
{extend} = lodash
{isNumber} = lodash

# local
{HttpCode} = require '../http'

###*
 * @function Respond with JSON response
 * @param    {*} [result.data] Data to be sent to client
 * @param    {Number} [result.securityCheck] Security check for request
 * @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
###
sendData = (opts = {}) ->

  result = opts.result ? @jaune.data()
  data = JSON.stringify result.data ? ''
  dataAvailable = !!data.length
  {securityCheck} = result
  {http} = @jaune.responder
  {IsGrantedResult} = @jaune.engine().Security

  # check if auth info to give proper response
  if isNumber securityCheck

    switch securityCheck

      when IsGrantedResult.Yes
        break

      when IsGrantedResult.InsufficientTrustLevel
        return http.insufficientTrustLevel.call this

      else
        return http.unauthorized.call this

  # check if NotFound must be sent on no data
  if opts.sendNotFoundOnNoData is yes and not dataAvailable
    return http.notFound.call this

  @body = data
  yield {}

###*
 * @function Respond with an error
 * @param    {Object} err The error that caused this response
###
sendError = (err) ->

  engine = @jaune.engine()
  isArgumentError = err instanceof engine.Error.ArgumentError
  isCodedError = err instanceof engine.Error.UnhandledError
  util = engine.Http.Util
  errorManager = engine.Error.Manager
  logger = @logger
  loggerArgs = @loggerArgs
  code = if isArgumentError then HttpCode.BadRequest else 0

  unless code
    code =
      if isCodedError and err.code
        err.code
      else
        HttpCode.InternalServerError

  err = errorManager.asUnhandledError err # extend with more data

  if logger? and loggerArgs?
    yield errorManager.logErrorOnUnhandledError err, logger, extend(
      loggerArgs, message: err)

  util.endWithCode this, code, if isCodedError then err.message else null

module.exports = (context) ->
  sendData: bind sendData, context
  sendError: bind sendError, context
