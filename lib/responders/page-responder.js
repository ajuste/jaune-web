
/**
* @file   Source code for Json Responder
* @author Alvaro Juste
 */
'use strict';
var GenericPage404, GenericPage500, PagesConfigSection, bind, chunk, defaultsDeep, extend, extendGlobalData, getDefaultLocalization, getGenericPageSettings, has, isNumber, isObject, lodash, render, resolveLocalization, resolvePageData, send, sendError, sendNotFound, splitIntoChunks;

lodash = require('lodash');

bind = lodash.bind;

isObject = lodash.isObject;

isNumber = lodash.isNumber;

extend = lodash.extend;

has = lodash.has;

defaultsDeep = lodash.defaultsDeep;

chunk = lodash.chunk;

PagesConfigSection = 'jaune.pages';

GenericPage404 = 'notFound';

GenericPage500 = 'error';

getDefaultLocalization = function(page, settings, localeManager) {
  var i, key, len, localization, ref, ref1, results, setting, value;
  localization = settings.localization;
  if (!(page.defaults && ((settings != null ? (ref = settings.localization) != null ? ref.defaults : void 0 : void 0) != null))) {
    return;
  }
  ref1 = page.defaults;
  results = [];
  for (i = 0, len = ref1.length; i < len; i++) {
    key = ref1[i];
    if ((setting = localization.defaults[key]) == null) {
      continue;
    }
    if (isObject(settings)) {
      key = setting.key, value = setting.value;
      results.push({
        key: key,
        value: localeManager.getStringResource(value, true)
      });
    } else {
      results.push({
        key: setting,
        value: localeManager.getStringResource(setting, true)
      });
    }
  }
  return results;
};

resolveLocalization = function(page, settings, data) {
  var clientLoc, format, i, key, keys, len, localeManager, localization, localizations, pageLocalization, ref, ref1, result, title, value;
  localeManager = this.jaune.engine().Locale.Manager;
  localizations = {
    "export": {}
  };
  localization = settings.localization;
  pageLocalization = page.localization;
  if (localization == null) {
    return localizations;
  }
  format = (ref = settings.localization.format) != null ? ref : 'array';
  if (pageLocalization != null) {
    keys = pageLocalization.keys, title = pageLocalization.title;
  }
  debugger;
  clientLoc = getDefaultLocalization(page, settings, localeManager);
  if (title != null) {
    localizations.title = localeManager.getStringResource(pageLocalization.title);
  }
  if (keys != null) {
    for (key in pageLocalization.keys) {
      clientLoc.push({
        key: key,
        value: localeManager.getStringResource(page.localization.keys[key], true)
      });
    }
  }
  switch (format) {
    case 'object':
      result = {};
      for (i = 0, len = clientLoc.length; i < len; i++) {
        ref1 = clientLoc[i], key = ref1.key, value = ref1.value;
        result[key] = value;
      }
      localizations[localization.property] = localizations["export"][localization.property] = result;
      break;
    default:
      localizations[localization.property] = localizations["export"][localization.property] = localizations;
  }
  return localizations;
};

splitIntoChunks = function(chunkSize, data) {
  var chunked, raw, ref;
  if (data == null) {
    data = {
      "export": {}
    };
  }
  raw = JSON.stringify((ref = data["export"]) != null ? ref : '');
  chunked = chunks(raw, chunkSize);
  return {
    exported: {
      chunkAvailable: chunked.length > 0,
      chunkCount: chunked.length,
      chunks: chunked
    }
  };
};

resolvePageData = function(page, settings, data) {
  var splitDataIntoChunks;
  splitDataIntoChunks = settings.splitDataIntoChunks;
  if (this._jaune_web_responder_global != null) {
    data = extend(data != null ? data : {}, this._jaune_web_responder_global);
  }
  defaultsDeep(data, resolveLocalization.call(this, page, settings));
  if (isNumber(splitDataIntoChunks) && splitDataIntoChunks > 0) {
    extend(data, splitIntoChunks.call(this, splitDataIntoChunks, data));
  }
  return data;
};


/**
* @function Respond with page response
* @param    {*} [result.data] Data to be sent to client
* @param    {Number} [result.securityCheck] Security check for request
* @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */

send = function*(name, opts) {
  var page, settings;
  settings = this.jaune.engine().Environment.getEnvProperty(PagesConfigSection);
  page = settings != null ? settings.definitions[name] : void 0;
  if (page == null) {
    throw new Error("Page not defined: " + name);
  }
  return (yield render(this, page, opts != null ? opts.result : void 0));
};


/**
* @function Respond with not found
 */

sendNotFound = function*(opts) {
  return (yield render(this, getGenericPageSettings(this, GenericPage404), opts != null ? opts.result : void 0));
};


/**
* @function Respond with error
 */

sendError = function*(err, message) {
  return (yield render(this, getGenericPageSettings(this, GenericPage500), {
    message: message,
    err: err
  }));
};

getGenericPageSettings = function(ctx, name) {
  var ref, ref1, settings;
  settings = ctx.jaune.engine().Environment.getEnvProperty(PagesConfigSection);
  return settings != null ? (ref = settings.definitions) != null ? (ref1 = ref.generic) != null ? ref1[name] : void 0 : void 0 : void 0;
};


/**
* @function Adds data that will be used in page responder to render the page
* @param {Object} ctx Context object
* @param {Object} data Data that extends global
 */

extendGlobalData = function(data) {
  var ref;
  if (data == null) {
    return;
  }
  return this._jaune_web_responder_global = extend((ref = this._jaune_web_responder_global) != null ? ref : {}, data);
};

render = function*(ctx, page, data) {
  var httpResponder, ref, settings;
  httpResponder = ctx.jaune.responder.http;
  if (!page) {
    return httpResponder.notFound.call(ctx);
  }
  settings = ctx.jaune.engine().Environment.getEnvProperty(PagesConfigSection);
  data = (ref = data != null ? data : ctx.jaune.data()) != null ? ref : '';
  if (ctx.render.constructor.name === 'GeneratorFunction') {
    return (yield ctx.render(page.view, resolvePageData.call(ctx, page, settings, data)));
  } else {
    return ctx.render(page.view, resolvePageData.call(ctx, page, settings, data));
  }
};

module.exports = function(context) {
  return {
    send: bind(send, context),
    sendNotFound: bind(sendNotFound, context),
    sendError: bind(sendError, context),
    extendGlobalData: bind(extendGlobalData, context)
  };
};
