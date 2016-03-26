###*
* @file   Source code for Json Responder
* @author Alvaro Juste
###

"use strict"

# 3rd
{bind, isObject, isNumber, extend, chain, has, defaultsDeep, chunk} = require 'lodash'

# jaune
PAGES_CONFIG_SECTION = 'jaune.pages'
GENERIC_PAGE_404     = 'notFound'
GENERIC_PAGE_500     = 'error'

resolveLocalization = (page, settings, data) ->

  localeManager = @jaune.engine().Locale.Manager;
  localizations = export: {}
  {localization} = settings
  {pageLocalization} = page

  return localizations unless localization?

  # client localization
  clientLoc = localizations[localization.property] = localizations.export[localization.property] = []
  format  = settings.localization.format ? 'array'

  # add default values
  if page.defaults and has settings, "localization.defaults"
    chain   (page.defaults)
    .filter ((key) -> settings.localization.defaults[key]?)
    .map    ((key) ->

      setting = localization.defaults[key]

      if isObject settings
        {key, value} = setting
        {key, value: localeManager.getStringResource value, true}
      else
        key: setting, value: localeManager.getStringResource setting, true
    )
    .each   ((val) -> clientLoc.push val)
    .value()

  # add page's specific localization
  if pageLocalization?
    if pageLocalization.title?
      localizations.title = localeManager.getStringResource pageLocalization.title

    if pageLocalization.keys?
      chain (pageLocalization.keys)
      .keys()
      .map  ((key) -> {key, value : localeManager.getStringResource page.localization.keys[key], true})
      .each ((val) -> clientLoc.push val)
      .value()

  switch format

    when 'object'

      localizations[localization.property] = localizations.export[localization.property] = chain(clientLoc)
      .map((e) -> [e.key, e.value])
      .object()
      .value()

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

  # localization
  defaultsDeep data, resolveLocalization.call(this, page, settings)

  # split into chunks for browser support
  if isNumber(splitDataIntoChunks) and splitDataIntoChunks > 0
    extend data, splitIntoChunks.call(this, splitDataIntoChunks, data)

  data

###*
* @function Respond with JSON response
* @param    {*} [result.data] Data to be sent to client
* @param    {Number} [result.securityCheck] Security check for request
* @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
###
send = (name, opts) ->

  settings = @jaune.engine().Environment.getEnvProperty PAGES_CONFIG_SECTION
  page = settings?.definitions[name]

  throw new Error "Page not defined: #{name}" unless page?

  yield render this, page, opts?.result

###*
* @function Respond with not found
###
sendNotFound = (opts) ->
  yield render(this, getGenericPageSettings(this, GENERIC_PAGE_404), opts?.result)

###*
* @function Respond with error
###
sendError = (err, message) ->
  yield render(this, getGenericPageSettings(this, GENERIC_PAGE_500), {message, err});

getGenericPageSettings = (ctx, name) ->
  settings = ctx.jaune.engine().Environment.getEnvProperty PAGES_CONFIG_SECTION
  settings?.definitions?.generic?[name]

render = (ctx, page, data) ->

  httpResponder = ctx.jaune.responder.http;

  return httpResponder.notFound.call ctx unless page

  settings = ctx.jaune.engine().Environment.getEnvProperty PAGES_CONFIG_SECTION
  data = data ? ctx.jaune.data() ? ''

  if ctx.render.constructor.name is 'GeneratorFunction'
    yield ctx.render page.view, resolvePageData.call(ctx, page, settings, data)
  else
    ctx.render page.view, resolvePageData.call(ctx, page, settings, data)

module.exports = (context) ->
  send        : bind send, context
  sendNotFound: bind sendNotFound, context
  sendError   : bind sendError, context
