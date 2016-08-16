###*
* @file   Source code for Json Responder
* @author Alvaro Juste
###
'use strict'

# 3rd
lodash = require 'lodash'
{bind} = lodash
{isObject} = lodash
{isNumber} = lodash
{extend} = lodash
{has} = lodash
{defaultsDeep} = lodash
{chunk} = lodash

# Configuration section for pages
PagesConfigSection = 'jaune.pages'

# Generic error for 404
GenericPage404     = 'notFound'

# Generic error for 500
GenericPage500     = 'error'

getDefaultLocalization = (page, settings, localeManager)->

  {localization} = settings

  return unless page.defaults and settings?.localization?.defaults?

  for key in page.defaults

    continue unless (setting = localization.defaults[key])?

    if isObject settings
      {key, value} = setting
      {key, value: localeManager.getStringResource value, yes}
    else
      key: setting, value: localeManager.getStringResource setting, yes

resolveLocalization = (page, settings, data) ->

  localeManager = @jaune.engine().Locale.Manager;
  localizations = export: {}
  {localization} = settings
  pageLocalization = page.localization

  return localizations unless localization?

  # client localization
  format  = settings.localization.format ? 'array'
  {keys, title} = pageLocalization if pageLocalization?

  debugger

  # add default values
  clientLoc = getDefaultLocalization page, settings, localeManager

  # add page's specific localization
  localizations.title = localeManager.getStringResource pageLocalization.title if title?

  if keys?
    for key of pageLocalization.keys
      clientLoc.push {key, value : localeManager.getStringResource page.localization.keys[key], true}

  switch format

    when 'object'

      result = {}
      result[key] = value for {key, value} in clientLoc
      localizations[localization.property] = localizations.export[localization.property] = result

    else

      localizations[localization.property] = localizations.export[localization.property] = localizations

  localizations

splitIntoChunks = (chunkSize, data = export: {}) ->

  raw = JSON.stringify data.export ? ''
  chunked = chunks raw, chunkSize

  exported : {
    chunkAvailable : chunked.length > 0,
    chunkCount : chunked.length,
    chunks : chunked
  }

resolvePageData = (page, settings, data) ->

  {splitDataIntoChunks} = settings
  data = extend data ? {}, @_jaune_web_responder_global if @_jaune_web_responder_global?

  # localization
  defaultsDeep data, resolveLocalization.call(this, page, settings)

  # split into chunks for browser support
  if isNumber(splitDataIntoChunks) and splitDataIntoChunks > 0
    extend data, splitIntoChunks.call(this, splitDataIntoChunks, data)

  data

###*
* @function Respond with page response
* @param    {*} [result.data] Data to be sent to client
* @param    {Number} [result.securityCheck] Security check for request
* @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
###
send = (name, opts) ->

  settings = @jaune.engine().Environment.getEnvProperty PagesConfigSection
  page = settings?.definitions[name]

  throw new Error "Page not defined: #{name}" unless page?

  yield render this, page, opts?.result

###*
* @function Respond with not found
###
sendNotFound = (opts) ->
  yield render(this, getGenericPageSettings(this, GenericPage404), opts?.result)

###*
* @function Respond with error
###
sendError = (err, message) ->
  yield render(this, getGenericPageSettings(this, GenericPage500), {message, err});

getGenericPageSettings = (ctx, name) ->
  settings = ctx.jaune.engine().Environment.getEnvProperty PagesConfigSection
  settings?.definitions?.generic?[name]

###*
* @function Adds data that will be used in page responder to render the page
* @param {Object} ctx Context object
* @param {Object} data Data that extends global
###
extendGlobalData = (data) ->
  return unless data?
  @_jaune_web_responder_global = extend @_jaune_web_responder_global ? {}, data

render = (ctx, page, data) ->

  httpResponder = ctx.jaune.responder.http;

  return httpResponder.notFound.call ctx unless page

  settings = ctx.jaune.engine().Environment.getEnvProperty PagesConfigSection
  data = data ? ctx.jaune.data() ? ''

  if ctx.render.constructor.name is 'GeneratorFunction'
    yield ctx.render page.view, resolvePageData.call(ctx, page, settings, data)
  else
    ctx.render page.view, resolvePageData.call(ctx, page, settings, data)

module.exports = (context) ->
  send: bind send, context
  sendNotFound: bind sendNotFound, context
  sendError: bind sendError, context
  extendGlobalData: bind extendGlobalData, context
