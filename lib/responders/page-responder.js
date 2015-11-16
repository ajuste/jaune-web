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

// jaune
const _httpResponder = require("./http-responder");
const _httpCode      = require("../http").HttpCode;

const PAGES_CONFIG_SECTION = "pages"

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
    }

    // add page's specific localization
    if (page.localization) {
      if (page.localization.title) {
        data.title = localeManager.getStringResource(page.localization.title);
      }
      if (page.localization.keys) {
        _chain  (page.localization.keys)
        .keys   ()
        .map    (function(key) { return {key : key, value : localeManager.getStringResource(val, true) }; })
        .each   (function(val) { return clientLoc.push(val); })
      }
    }
  }
  return data;
};
const splitIntoChunks = function(chunkSize, data) {

  (opts || (opts = {}));
  (data || (data = {export:{}}));

  const raw         = JSON.stringify(data.export);
  const totalChunks = Math.ceil(raw.length / chunkSize);
  const chunks      = [];

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    chunks.push(raw.slice(chunk * chunkSize, (chunk + 1) * chunkSize));
  }
  return {
    export : {
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

  const settings = this.env.getEnvProperty(PAGES_CONFIG_SECTION);
  const page     = settings && settings.definitions ? settings.definitions[name] : null;

  if (!page) throw new Error("Page not defined: " + name);

  this.render(page.view, resolvePageData.call(this, page, settings));
};

module.exports = function(context) {
  return {
    send  : _bind(send, context)
  }
};
