/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _bind          = require("lodash").bind;
const _isString      = require("lodash").isString;
const _isNumber      = require("lodash").isNumber;
const _extend        = require("lodash").extend;
const _chain         = require("lodash").chain;
const _has           = require("lodash").has;

// jaune
const _httpResponder = require("./http-responder");
const _httpCode      = require("../http").HttpCode;

const PAGES_CONFIG_SECTION = "jaune.pages"

const resolveLocalization = function(page, settings) {

  const data          = {};
  const localeManager = this.jaune.engine().Locale.Manager;

  // client localization
  if (settings.localization) {
    const clientLoc = data[settings.localization.property] = [];

    // add default values
    if (page.defaults && settings.defaults) {

      _chain  (page.defaults)
      .keys   ()
      .filter (function(key) { return !!settings.defaults[key]; })
      .map    (function(key) { return {key : key, value : localeManager.getStringResource(settings.defaults[key], true)}; })
      .each   (function(val) { return clientLoc.push(val); })
      .value  ();
    }

    // add page's specific localization
    if (page.localization) {
      if (page.localization.title) {
        data.title = localeManager.getStringResource(page.localization.title);
      }
      if (page.localization.keys) {
        _chain  (page.localization.keys)
        .keys   ()
        .map    (function(key) { return {key : key, value : localeManager.getStringResource(key, true) }; })
        .each   (function(val) { return clientLoc.push(val); })
        .value  ();
      }
    }
  }
  return data;
};
const splitIntoChunks = function(chunkSize, data) {
  (data || (data = {export:{}}));

  const raw         = JSON.stringify(data.export);
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

const resolvePageData = function(page, settings) {

  const data         = this.jaune.data();
  const maxChunkSize = settings.splitDataIntoChunks;

  // localization
  _extend(data, resolveLocalization.call(this, page, settings));

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
const send = function* (name) {

  const settings = this.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  const page     = settings && settings.definitions ? settings.definitions[name] : null;

  if (!page) throw new Error("Page not defined: " + name);

  this.render(page.view, resolvePageData.call(this, page, settings));
};
/**
 * @function Respond with not found
 */
const sendNotFound = function* () {

  const settings = this.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  const page     = _has(settings, "definitions.generic.notFound");

  if (!page) return _httpResponder.notFound.call(this);

  this.render(page.view, resolvePageData.call(this, page, settings));
};
/**
 * @function Respond with error
 */
const sendError = function* () {

  const settings = this.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  const page     = _has(settings, "definitions.generic.error");

  if (!page) return _httpResponder.notFound.call(this);

  this.render(page.view, resolvePageData.call(this, page, settings));
};

module.exports = function(context) {
  return {
    send        : _bind(send, context),
    sendNotFound: _bind(sendNotFound, context),
    sendError   : _bind(sendError, context)
  }
};
