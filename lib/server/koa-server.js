/**
 * @file Source code Koa application
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _isFunction = require("lodash").isFunction;
const _isObject   = require("lodash").isObject;
const _pick       = require("lodash").pick;
const _extend     = require("lodash").extend;
const _has        = require("lodash").has;
const _i18n       = require("i18next");
const _koa        = require("koa");

// jaune
const _reflection = require("jaune-util").Reflection;
const _register   = require("../context");

// constants
const CONFIG_HTTP_SECTION   = "jaune.http";
const CONFIG_INIT_SECTION   = "jaune.init";
const CONFIG_LOCALE_SECTION = "jaune.locale";
const CONFIG_ERROR_SECTION  = "jaune.error";

const ENV_TYPE        = "type";
const ENV_TYPE_DEV    = "development";

/**
 * @class Represents the server. Handles initialization and finalize.
 * @param {Object} configuration Configuration
 */
const KoaServer = function(env, engine) {
  this.env    = env;
  this.engine = engine;

  this.httpSettings   = env.getEnvProperty(CONFIG_HTTP_SECTION);
  this.initSettings   = env.getEnvProperty(CONFIG_INIT_SECTION);
  this.localeSettings = env.getEnvProperty(CONFIG_LOCALE_SECTION);
  this.errorSettings  = env.getEnvProperty(CONFIG_ERROR_SECTION);

  this.app = _koa();
  this.setup();
};

/**
 * @function Set up session
 */
KoaServer.prototype.setupSession = function() {

  if (!_has(this, "httpSettings.session")) return;
  if (!this.httpSettings.session.enabled) return;

  const settings = this.httpSettings.session;

  this.app.use(_reflection.evaluateName(settings.store, settings.storeArgs, settings.store.context, {app : this.app }));
};

/**
 * @function Set up static resource serving
 */
KoaServer.prototype.setupStatic = function() {

  if (!_has(this, "httpSettings.static")) return;
  if (!this.httpSettings.static.enabled) return;

  const send = require("koa-send");
  const args = {
    root: this.httpSettings.static.path,
    maxAge: this.httpSettings.static.maxAge
  };
  this.app.use(function *(){ yield send(this, this.path, args); });
};

/**
 * @function Set up logger
 */
KoaServer.prototype.setupLogger = function() {
  if (this.env.getProcessProperty(ENV_TYPE) === ENV_TYPE_DEV) {
    this.app.use(require("koa-logger")());
  }
};

/**
 * @function Set up custom middlewares
 */
KoaServer.prototype.setupMiddlewares = function() {

  this.app.use(_register.coreMiddleware(this.app, this.engine));

  if (!_has(this, "initSettings.init.middlewares")) return;
  this.initSettings.init.middlewares(this.app, this.engine);
};

/**
 * @function Set up body parse
 */
KoaServer.prototype.setupBody = function() {
  if (!_has(this, "httpSettings.body")) return;
  if (!this.httpSettings.body.parse) return;

  const koaBody  = require("koa-body");
  const settings = _pick(this.httpSettings.body, "strict", "multipart");

  if (this.httpSettings.body.multipart && this.httpSettings.uploadPath) {
    _extend(settings, { formidable : { uploadDir: this.httpSettings.uploadPath } });
  }
  this.app.use(koaBody(settings));
};

/**
 * @function Set up web serving
 */
KoaServer.prototype.setupWeb = function() {

  if (!_has(this, "httpSettings.web")) return;
  if (!this.httpSettings.web.enabled) return;

  const http    = require("http");
  const port    = parseInt(this.httpSettings.web.port || 3000, 10);
  const html    = this.httpSettings.web.html;
  const appName = this.env.appName;

  if (html) {
    this.app.use(_reflection.evaluateName(html.engine, html.args, html.context, {app : this.app }));
  }
  http.createServer(this.app.callback()).listen(port, function(){
    console.log(appName + " web server started");
  });
};

/**
 * @function Set up internazionalization
 */
KoaServer.prototype.setupI18n = function() {

  if (!_has(this, "httpSettings.i18n")) return;
  if (!this.httpSettings.i18n.enabled) return;

  const koaLocale     = require("koa-locale");
  const httpUtil      = this.engine.Http.Util;
  const localeManager = this.engine.Locale.Manager;

  koaLocale(this.app);

  this.app.use(function* (next) {
    const locale = this.getLocaleFromQuery() || this.getLocaleFromCookie() || this.getLocaleFromHeader() || locale.getDefaultCountry()
    if (locale) {
      this.session.locale = yield localeManager.setLocale(locale);
      httpUtil.setCookieValue(this, "locale", this.session.locale.locale, "1year");
    }
    yield next;
  });
  _i18n.init({
    fallbackLng: this.localeSettings.defaultLanguage,
    debug : this.localeSettings.debug
  });
};

/**
 * @function Set up routing
 */
KoaServer.prototype.setupRouting = function() {
  if (!_has(this, "initSettings.webRoutes")) return;

  this.app.use(require("koa-routing")(this.app));
  this.initSettings.webRoutes(this.app, this.engine);
};

/**
 * @function Set up routing
 */
KoaServer.prototype.initDaemons = function() {
  if (!_has(this, "initSettings.initDeamons")) return;
  this.initSettings.initDeamons();
};

/**
 * @function extendNamespace
 */
KoaServer.prototype.extendNamespace = function() {
  if (!_has(this, "initSettings.extendNamespace")) return;
  this.initSettings.extendNamespace(this.engine);
};

/**
 * @function Sets up error handling
 */
KoaServer.prototype.setupErrorHandling = function() {

  let   customErrorHandling;
  const self = this;

  if (_has(this, "errorSettings.listener")) {
    customErrorHandling = this.errorSettings.listener;
  }

  this.app.use(function *(next) {
    try {
      yield next;
    } catch (err) {
      if (customErrorHandling &&
          (yield customErrorHandling(err, this, this.session))) {
        return;
      }
      yield _handleError(this, err, self);
    }
  });
};

const _handleError = function* (ctx, err, self) {
  if (self.env.getProcessProperty(ENV_TYPE) === ENV_TYPE_DEV) {
    console.log(err);
    if (err.stack) {
      var stack = err.stack.replace(/^[^\(]+?[\n$]/gm, '')
         .replace(/^\s+at\s+/gm, '')
         .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
         .split('\n');
      console.log(stack);
    }
  }
  switch(ctx.accepts('html', 'json')) {
    case 'json' :
      return yield ctx.jaune.responder.json.sendError(err);

    case 'html' :
      return yield ctx.jaune.responder.page.sendError(err);

    default :
      return yield ctx.jaune.responder.http.error(err);
  }
};

/**
 * @function Sets up modules to be used by the server.
 */
KoaServer.prototype.setup = function() {

  this.app.keys = ["some secret hurr"]; // TODO: make it configurable

  this.extendNamespace();
  this.setupErrorHandling();
  this.setupMiddlewares();
  this.setupLogger();
  this.setupSession();
  this.setupI18n();
  this.setupBody();
  this.setupWeb();
  this.setupRouting();
  this.setupStatic();
  this.app.use(_register.respondersMiddleware(this.app, this.engine));
  this.initDaemons(this.app, this.engine);
};

module.exports = {
  App : KoaServer
};
