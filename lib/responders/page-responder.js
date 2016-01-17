/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _bind         = require("lodash").bind;
const _isString     = require("lodash").isString;
const _isObject     = require("lodash").isObject;
const _isNumber     = require("lodash").isNumber;
const _extend       = require("lodash").extend;
const _chain        = require("lodash").chain;
const _has          = require("lodash").has;
const _isEmpty      = require("lodash").isEmpty;
const _fromPairs    = require("lodash").fromPairs;
const _defaultsDeep = require("lodash").defaultsDeep;
const _object       = require("lodash").object;

// jaune
const _httpCode      = require("../http").HttpCode;

const PAGES_CONFIG_SECTION = "jaune.pages";
const GENERIC_PAGE_404     = "notFound";
const GENERIC_PAGE_500     = "error";

const resolveLocalization = function(page, settings) {

  const localeManager = this.jaune.engine().Locale.Manager;
  const localizations = {export:{}};

  // client localization
  if (settings.localization) {
    const clientLoc = localizations[settings.localization.property] = localizations.export[settings.localization.property] = [];
    const format  = settings.localization.format || 'array';

    // add default values
    if (page.defaults && _has(settings, "localization.defaults")) {
      _chain  (page.defaults)
      .filter (function(key) { return !!settings.localization.defaults[key]; })
      .map    (function(key) {
        var setting = settings.localization.defaults[key];
        return {key : _isObject(setting) ? setting.key : setting, value : localeManager.getStringResource(_isObject(setting) ? setting.value : setting, true)}; })
      .each   (function(val) { return clientLoc.push(val); })
      .value  ();
    }

    // add page's specific localization
    if (page.localization) {
      if (page.localization.title) {
        localizations.title = localeManager.getStringResource(page.localization.title);
      }
      if (page.localization.keys) {
        _chain  (page.localization.keys)
        .map    (function(key) { return {key : settings.localization.defaults[key], value : localeManager.getStringResource(key, true) }; })
        .each   (function(val) { return clientLoc.push(val); })
        .value  ();
      }
    }
    switch(format) {
      case 'object' :

        localizations[settings.localization.property] = localizations.export[settings.localization.property] = _chain(clientLoc)
        .map(function(e){ return [e.key, e.value]; })
        .object()
        .value();

        break;
    }
  }
  return localizations;
};
const splitIntoChunks = function(chunkSize, data) {
  (data || (data = {export:{}}));

  const raw         = JSON.stringify(data.export || "");
  const totalChunks = Math.ceil(raw.length / chunkSize);
  const chunks      = [];

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    chunks.push(raw.slice(chunk * chunkSize, (chunk + 1) * chunkSize));
  }
  return {
    exported : {
      chunkAvailable : totalChunks > 0,
      chunkCount     : totalChunks,
      chunks         : chunks
    }
  };
};

const resolvePageData = function(page, settings, data) {

  const maxChunkSize = settings.splitDataIntoChunks;

  // localization
  _defaultsDeep(data, resolveLocalization.call(this, page, settings));

  // split into chunks for browser support
  if (_isNumber(maxChunkSize) && maxChunkSize > 0) {
    _extend(data, splitIntoChunks.call(this, maxChunkSize, data));
  }
  return data;
};
/**
 * @function Respond with JSON response
 * @param    {*} [result.data] Data to be sent to client
 * @param    {Number} [result.securityCheck] Security check for request
 * @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */
const send = function* (name, opts) {

  const settings = this.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  const page = settings && settings.definitions ? settings.definitions[name] : null;

  if (!page) throw new Error("Page not defined: " + name);

  yield render(this, page, opts ? opts.result : null);
};
/**
 * @function Respond with not found
 */
const sendNotFound = function* (opts) {
  yield render(this, getGenericPageSettings(this, GENERIC_PAGE_404), opts ? opts.result : null);
};
/**
 * @function Respond with error
 */
const sendError = function* (err, message) {
  yield render(this, getGenericPageSettings(this, GENERIC_PAGE_500), {message: message, err: err});
};

const getGenericPageSettings = function (ctx, name) {

  const settings = ctx.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);

  return _has(settings, ["definitions.generic", name].join(".")) ?
    settings.definitions.generic[name] : null;
};
const render = function* (ctx, page, data) {

  const httpResponder = ctx.jaune.responder.http;

  if (!page) return httpResponder.notFound.call(ctx);

  const settings      = ctx.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);

  data = data || ctx.jaune.data() || "";

  if(ctx.render.constructor.name === 'GeneratorFunction') {
    yield ctx.render(page.view, resolvePageData.call(ctx, page, settings, data));
  }
  else {
    ctx.render(page.view, resolvePageData.call(ctx, page, settings, data));
  }
};

module.exports = function(context) {
  return {
    send        : _bind(send, context),
    sendNotFound: _bind(sendNotFound, context),
    sendError   : _bind(sendError, context)
  }
};
