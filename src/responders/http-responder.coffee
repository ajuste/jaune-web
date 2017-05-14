###*
 * @file Source code for Http utility.
 * @author Alvaro Juste
###

'use strict'

# 3rd
lodash = require 'lodash'
{bind} = lodash
{isFunction} = lodash

# jaune
{HttpCode} = require '../http'
{Unauthorized} = HttpCode
{InsufficientTrustLevel} = HttpCode
{NotFound} = HttpCode
{BadRequest} = HttpCode
{NotModified} = HttpCode
{NotAcceptable} = HttpCode
{InternalServerError} = HttpCode
{Ok} = HttpCode

###*
 * @function Get util from context
 * @param    {Object} ctx The context
###
util = (ctx) -> ctx.jaune.engine().Http.Util

###*
 * @function Get app
 * @param    {Object} ctx The context
###
app = (ctx) -> ctx.jaune.app()

###*
 * @function End with anauthorized http code
###
unauthorized = ->
  {error} = app(this).getHandlers
  error.call this, statusCode: Unauthorized if isFunction error
  util(this).endWithCode this, Unauthorized

###*
 * @function End with insufficient trust level http code
###
insufficientTrustLevel = -> util(this).endWithCode this, InsufficientTrustLevel

###*
 * @function End with not found http code
###
notFound = -> util(this).endWithCode this, NotFound

###*
 * @function End bad request http code
###
badRequest = -> util(this).endWithCode this, BadRequest

###*
 * @function End with not modified http code
###
notModified = -> util(this).endWithCode this, NotModified

###*
 * @function End with not acceptable code
###
notAcceptable = -> util(this).endWithCode this, NotAcceptable

###*
 * @function End with error http code
###
error = -> util(this).endWithCode this, InternalServerError

###*
 * @function End with ok http code
###
ok = -> util(this).endWithCode this, Ok

module.exports = (context) ->
  unauthorized: bind unauthorized, context
  insufficientTrustLevel: bind insufficientTrustLevel, context
  notAcceptable: bind notAcceptable, context
  notFound: bind notFound, context
  notModified: bind notModified, context
  badRequest: bind badRequest, context
  error: bind error, context
  ok: bind ok, context
