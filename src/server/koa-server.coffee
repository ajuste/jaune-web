###*
 * @file Source code Koa application
 * @author Alvaro Juste
###

'use strict'

# 3rd
lodash = require 'lodash'
{pick} = lodash
{extend} = lodash
I18n = require 'i18next'
koa = require 'koa'

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

    @app = koa();
    @setup();

  ###*
   * @function Set up session
  ###
  setupSession: ->

    {enabled, store, storeArgs} = @httpSettings?.session if @httpSettings?.session?

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

    {parse, multipart, strict, uploadPath} = @httpSettings.body if @httpSettings?.body?

    return unless parse

    koaBody = require 'koa-body'
    settings = {multipart, strict}

    extend settings, formidable: uploadDir: uploadPath if multipart and uploadPath

    @app.use koaBody settings

  ###*
   * @function Set up web serving
  ###
  setupWeb: ->

    {enabled, port, html} = @httpSettings.web if @httpSettings?.web?

    return unless enabled

    http = require 'http'
    port = parseInt port ? 3000, 10
    appName = @env.getEnvProperty AppName

    if html?
      @app.use evaluateName html.engine, html.args, html.context, {@app}

    http.createServer(@app.callback()).listen port, ->
      console.log "#{appName} web server started"

  ###*
   * @function Set up internazionalization
  ###
  setupI18n: ->

    {enabled} = @httpSettings.i18n if @httpSettings?.i18n?

    return unless enabled is yes

    koaLocale = require 'koa-locale'
    httpUtil = @engine.Http.Util
    localeManager = @engine.Locale.Manager;

    koaLocale @app

    @app.use (next) ->

      locale = @getLocaleFromQuery() ?
        @getLocaleFromCookie() ?
        @getLocaleFromHeader() ?
        localeManager.getDefaultCountry()

      if locale?
        locale = yield localeManager.setLocale locale
        @session.locale = locale if @session

        httpUtil.setCookieValue this, 'locale', locale.locale, '1year'
      yield next

    I18n.init
      fallbackLng: @localeSettings.defaultLanguage,
      debug : @localeSettings.debug

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
    @initSettings.extendNamespace()

  ###*
   * @function Sets up error handling
  ###
  setupErrorHandling: ->

    customErrorHandling = @errorSettings?.listener

    @app.use (next) =>
      try
        yield next;

      catch err

        return if customErrorHandling? and
          (yield customErrorHandling err, this, @session)

        yield handleError this, err

  ###*
   * @function Sets up modules to be used by the server.
  ###
  setup: ->

    @app.keys = ["some secret hurr"] # TODO: make it configurable

    @extendNamespace()
    @setupErrorHandling()
    @setupMiddlewares()
    @setupLogger()
    @setupSession()
    @setupI18n()
    @setupBody()
    @setupWeb()
    @setupPostMiddlewares()
    @setupRouting()
    @setupStatic()
    @app.use register.respondersMiddleware @app, @engine
    @initDaemons @app, @engine

handleError = (ctx, err, self) ->
  if ctx.env.getProcessProperty(EnvType) is EnvTypeDev
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
