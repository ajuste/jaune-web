###*
 * @file Source code Koa application
 * @author Alvaro Juste
###

'use strict'

# 3rd
lodash = require 'lodash'
{extend} = lodash
I18n = require 'i18next'
koa = require 'koa'
http = require 'http'
Https = require 'https'

# jaune
{evaluateName} = require('jaune-util').Reflection
register = require '../context'

# constants
AppName = 'appName'
ConfigHttpSection = 'jaune.http'
ConfigInitSection = 'jaune.init'
ConfigLocaleSection = 'jaune.locale'
ConfigErrorSection = 'jaune.error'
EnvType = 'type'
EnvTypeDev = 'development'

###*
 * @class Represents the server. Handles initialization and finalize.
 * @param {Object} configuration Configuration
###
class KoaServer

  constructor: (@env, @engine) ->

    @httpSettings   = @env.getEnvProperty ConfigHttpSection
    @initSettings   = @env.getEnvProperty ConfigInitSection
    @localeSettings = @env.getEnvProperty ConfigLocaleSection
    @errorSettings  = @env.getEnvProperty ConfigErrorSection

    @app = koa()

  ###*
   * @function Set up session
  ###
  setupSession: ->

    enabled = store = storeArgs = null

    if @httpSettings?.session?
      {enabled, store, storeArgs} = @httpSettings?.session

    return unless enabled is yes

    @app.use evaluateName store, storeArgs, store.context, {@app}

  ###*
   * @function Set up static resource serving
  ###
  setupStatic: ->

    {enabled, path, maxAge} = @httpSettings.static if @httpSettings?.static?

    return unless enabled is yes

    send = require 'koa-send'

    @app.use -> yield send this, @path, {maxAge, root: path}

  ###*
   * @function Set up logger
  ###
  setupLogger: ->
    return unless @env.getProcessProperty(EnvType) isnt EnvTypeDev
    @app.use require('koa-logger')()

  ###*
   * @function Set up custom middlewares
  ###
  setupMiddlewares: ->

    @app.use register.coreMiddleware @app, @engine

    return unless @initSettings?.middlewares?

    @initSettings.middlewares @app, @engine

  ###*
   * @function Set up post middlewares
  ###
  setupPostMiddlewares: ->

    return unless @initSettings?.postMiddlewares?

    @initSettings.postMiddlewares @app, @engine

  ###*
   * @function Set up body parse
  ###
  setupBody: ->

    parse = multipart = strict = uploadPath = null

    if @httpSettings?.body?
      {parse, multipart, strict, uploadPath} = @httpSettings.body

    return unless parse

    koaBody = require 'koa-body'
    settings = {multipart, strict}

    if multipart and uploadPath
      extend settings, formidable: uploadDir: uploadPath

    @app.use koaBody settings

  ###*
   * @function Set up sockets
  ###
  setupSockets: ->

    {sockets} = @httpSettings if @httpSettings?

    return unless sockets

    #needs to be installed by client
    @engine.sockets = new (require('koa-socket'))()
    @engine.sockets.attach @app

  ###*
   * @function Set up web serving
  ###
  setupWeb: ->

    {enabled, html, https} = @httpSettings.web if @httpSettings?.web?

    return unless enabled

    {engine, args, context} = html if html?

    if html?
      @app.use evaluateName engine, args, context, {@app}

  ###*
   * @function Set up http serving
  ###
  setupHttp: ->

    return unless @httpSettings?

    {port, https} = @httpSettings
    appName = @env.getEnvProperty AppName
    port = parseInt port ? 3000, 10

    if https?
      {key, cert} = https
      @app.server = Https.createServer {key, cert}, @app.callback()
    else
      @app.server = http.createServer @app.callback()

    @app.server.listen port, -> console.log "#{appName} web server started"

  ###*
   * @function Set up internazionalization
  ###
  setupI18n: ->

    {enabled} = @httpSettings.i18n if @httpSettings?.i18n?

    return unless enabled is yes

    koaLocale = require 'koa-locale'
    httpUtil = @engine.Http.Util
    localeManager = @engine.Locale.Manager

    koaLocale @app

    @app.use (next) ->

      locale = @getLocaleFromQuery() ?
        @getLocaleFromCookie() ?
        @getLocaleFromHeader() ?
        localeManager.getDefaultCountry()

      if locale?
        locale = yield localeManager.setLocale locale
        @session.locale = locale if @session
        @locale = locale

        httpUtil.setCookieValue this, 'locale', locale.locale, '1year'
      yield next

    I18n.init @localeSettings

  ###*
   * @function Set up routing
  ###
  setupRouting: ->

    {webRoutes} = @initSettings if @initSettings?

    return unless webRoutes?

    @app.use require('koa-routing')(@app)
    webRoutes @app, @engine

  ###*
   * @function Set up routing
  ###
  initDaemons: ->
    return unless @initSettings?.initDeamons?
    @initSettings.initDeamons()

  ###*
   * @function extendNamespace
  ###
  extendNamespace: ->
    return unless @initSettings?.extendNamespace?
    @initSettings.extendNamespace @engine

  ###*
   * @function Sets up error handling
  ###
  setupErrorHandling: ->

    customErrorHandling = @errorSettings?.listener
    env = @env

    @app.use (next) ->

      try
        yield next

      catch error

        return if customErrorHandling? and
          yield customErrorHandling error, this

        yield handleError this, env, error

  ###*
   * @function Sets up modules to be used by the server.
  ###
  setup: ->

    @app.keys = ["some secret hurr"] # TODO: make it configurable

    @extendNamespace()
    @setupMiddlewares()
    @setupErrorHandling()
    @setupLogger()
    @setupSession()
    @setupI18n()
    @setupBody()
    @setupHttp()
    @setupSockets()
    @setupWeb()
    @setupPostMiddlewares()
    @setupRouting()
    @setupStatic()
    @app.use register.respondersMiddleware @app, @engine
    @initDaemons @app, @engine

handleError = (ctx, env, err) ->
  if env.getProcessProperty(EnvType) is EnvTypeDev
    console.log err
    if err.stack
      stack = err
        .stack
        .replace /^[^\(]+?[\n$]/gm, ''
        .replace /^\s+at\s+/gm, ''
        .replace /^Object.<anonymous>\s*\(/gm, '{anonymous}()@'
        .split '\n'
      console.log stack

  switch ctx.accepts 'html', 'json'

    when 'json' then yield ctx.jaune.responder.json.sendError err

    when 'html' then yield ctx.jaune.responder.page.sendError err

    else yield ctx.jaune.responder.http.error err

module.exports = App: KoaServer
