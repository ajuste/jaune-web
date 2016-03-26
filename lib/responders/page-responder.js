
/**
* @file   Source code for Json Responder
* @author Alvaro Juste
 */
"use strict";
var GENERIC_PAGE_404, GENERIC_PAGE_500, PAGES_CONFIG_SECTION, bind, chain, chunk, defaultsDeep, extend, getGenericPageSettings, has, isNumber, isObject, ref, render, resolveLocalization, resolvePageData, send, sendError, sendNotFound, splitIntoChunks;

ref = require('lodash'), bind = ref.bind, isObject = ref.isObject, isNumber = ref.isNumber, extend = ref.extend, chain = ref.chain, has = ref.has, defaultsDeep = ref.defaultsDeep, chunk = ref.chunk;

PAGES_CONFIG_SECTION = 'jaune.pages';

GENERIC_PAGE_404 = 'notFound';

GENERIC_PAGE_500 = 'error';

resolveLocalization = function(page, settings) {
  var clientLoc, format, localeManager, localization, localizations, pageLocalization, ref1;
  localeManager = this.jaune.engine().Locale.Manager;
  localizations = {
    "export": {}
  };
  localization = settings.localization;
  pageLocalization = page.pageLocalization;
  if (localization == null) {
    return localizations;
  }
  clientLoc = localizations[localization.property] = localizations["export"][localization.property] = [];
  format = (ref1 = settings.localization.format) != null ? ref1 : 'array';
  if (page.defaults && has(settings, "localization.defaults")) {
    chain(page.defaults).filter((function(key) {
      return settings.localization.defaults[key] != null;
    })).map((function(key) {
      var setting, value;
      setting = localization.defaults[key];
      if (isObject(settings)) {
        key = setting.key, value = setting.value;
        return {
          key: key,
          value: localeManager.getStringResource(value, true)
        };
      } else {
        return {
          key: setting,
          value: localeManager.getStringResource(setting, true)
        };
      }
    })).each((function(val) {
      return clientLoc.push(val);
    })).value();
  }
  if (pageLocalization != null) {
    if (pageLocalization.title != null) {
      localizations.title = localeManager.getStringResource(pageLocalization.title);
    }
    if (pageLocalization.keys != null) {
      chain(pageLocalization.keys).keys().map((function(key) {
        return {
          key: key,
          value: localeManager.getStringResource(page.localization.keys[key], true)
        };
      })).each((function(val) {
        return clientLoc.push(val);
      })).value();
    }
  }
  switch (format) {
    case 'object':
      localizations[localization.property] = localizations["export"][localization.property] = chain(clientLoc).map(function(e) {
        return [e.key, e.value];
      }).object().value();
  }
  return localizations;
};

splitIntoChunks = function(chunkSize, data) {
  var chunked, raw, ref1;
  if (data == null) {
    data = {
      "export": {}
    };
  }
  raw = JSON.stringify((ref1 = data["export"]) != null ? ref1 : '');
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
  defaultsDeep(data, resolveLocalization.call(this, page, settings));
  if (isNumber(splitDataIntoChunks) && splitDataIntoChunks > 0) {
    extend(data, splitIntoChunks.call(this, splitDataIntoChunks, data));
  }
  return data;
};


/**
* @function Respond with JSON response
* @param    {*} [result.data] Data to be sent to client
* @param    {Number} [result.securityCheck] Security check for request
* @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */

send = function*(name, opts) {
  var page, settings;
  settings = this.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
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
  return (yield render(this, getGenericPageSettings(this, GENERIC_PAGE_404), opts != null ? opts.result : void 0));
};


/**
* @function Respond with error
 */

sendError = function*(err, message) {
  return (yield render(this, getGenericPageSettings(this, GENERIC_PAGE_500), {
    message: message,
    err: err
  }));
};

getGenericPageSettings = function(ctx, name) {
  var ref1, ref2, settings;
  settings = ctx.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  return settings != null ? (ref1 = settings.definitions) != null ? (ref2 = ref1.generic) != null ? ref2[name] : void 0 : void 0 : void 0;
};

render = function*(ctx, page, data) {
  var httpResponder, ref1, settings;
  httpResponder = ctx.jaune.responder.http;
  if (!page) {
    return httpResponder.notFound.call(ctx);
  }
  settings = ctx.jaune.engine().Environment.getEnvProperty(PAGES_CONFIG_SECTION);
  data = (ref1 = data != null ? data : ctx.jaune.data()) != null ? ref1 : '';
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
    sendError: bind(sendError, context)
  };
};
