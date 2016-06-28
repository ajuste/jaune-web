
/**
 * @file Source code Koa application
 * @author Alvaro Juste
 */
'use strict';
var AppName, ConfigErrorSection, ConfigHttpSection, ConfigInitSection, ConfigLocaleSection, EnvType, EnvTypeDev, I18n, KoaServer, evaluateName, extend, handleError, koa, lodash, pick, register;

lodash = require('lodash');

pick = lodash.pick;

extend = lodash.extend;

I18n = require('i18next');

koa = require('koa');

evaluateName = require('jaune-util').Reflection.evaluateName;

register = require('../context');

AppName = 'appName';

ConfigHttpSection = 'jaune.http';

ConfigInitSection = 'jaune.init';

ConfigLocaleSection = 'jaune.locale';

ConfigErrorSection = 'jaune.error';

EnvType = 'type';

EnvTypeDev = 'development';


/**
 * @class Represents the server. Handles initialization and finalize.
 * @param {Object} configuration Configuration
 */

KoaServer = (function() {
  function KoaServer(env, engine) {
    this.env = env;
    this.engine = engine;
    this.httpSettings = this.env.getEnvProperty(ConfigHttpSection);
    this.initSettings = this.env.getEnvProperty(ConfigInitSection);
    this.localeSettings = this.env.getEnvProperty(ConfigLocaleSection);
    this.errorSettings = this.env.getEnvProperty(ConfigErrorSection);
    this.app = koa();
    this.setup();
  }


  /**
   * @function Set up session
   */

  KoaServer.prototype.setupSession = function() {
    var enabled, ref, ref1, ref2, store, storeArgs;
    if (((ref = this.httpSettings) != null ? ref.session : void 0) != null) {
      ref2 = (ref1 = this.httpSettings) != null ? ref1.session : void 0, enabled = ref2.enabled, store = ref2.store, storeArgs = ref2.storeArgs;
    }
    if (enabled !== true) {
      return;
    }
    return this.app.use(evaluateName(store, storeArgs, store.context, {
      app: this.app
    }));
  };


  /**
   * @function Set up static resource serving
   */

  KoaServer.prototype.setupStatic = function() {
    var enabled, maxAge, path, ref, ref1, send;
    if (((ref = this.httpSettings) != null ? ref["static"] : void 0) != null) {
      ref1 = this.httpSettings["static"], enabled = ref1.enabled, path = ref1.path, maxAge = ref1.maxAge;
    }
    if (enabled !== true) {
      return;
    }
    send = require('koa-send');
    return this.app.use(function*() {
      return (yield send(this, this.path, {
        maxAge: maxAge,
        root: path
      }));
    });
  };


  /**
   * @function Set up logger
   */

  KoaServer.prototype.setupLogger = function() {
    if (this.env.getProcessProperty(EnvType) === EnvTypeDev) {
      return;
    }
    return this.app.use(require('koa-logger')());
  };


  /**
   * @function Set up custom middlewares
   */

  KoaServer.prototype.setupMiddlewares = function() {
    var ref;
    this.app.use(register.coreMiddleware(this.app, this.engine));
    if (((ref = this.initSettings) != null ? ref.middlewares : void 0) == null) {
      return;
    }
    return this.initSettings.middlewares(this.app, this.engine);
  };


  /**
   * @function Set up post middlewares
   */

  KoaServer.prototype.setupPostMiddlewares = function() {
    var ref;
    if (((ref = this.initSettings) != null ? ref.postMiddlewares : void 0) == null) {
      return;
    }
    return this.initSettings.postMiddlewares(this.app, this.engine);
  };


  /**
   * @function Set up body parse
   */

  KoaServer.prototype.setupBody = function() {
    var koaBody, multipart, parse, ref, ref1, settings, strict, uploadPath;
    if (((ref = this.httpSettings) != null ? ref.body : void 0) != null) {
      ref1 = this.httpSettings.body, parse = ref1.parse, multipart = ref1.multipart, strict = ref1.strict, uploadPath = ref1.uploadPath;
    }
    if (!parse) {
      return;
    }
    koaBody = require('koa-body');
    settings = {
      multipart: multipart,
      strict: strict
    };
    if (multipart && uploadPath) {
      extend(settings, {
        formidable: {
          uploadDir: uploadPath
        }
      });
    }
    return this.app.use(koaBody(settings));
  };


  /**
   * @function Set up web serving
   */

  KoaServer.prototype.setupWeb = function() {
    var appName, enabled, html, http, port, ref, ref1;
    if (((ref = this.httpSettings) != null ? ref.web : void 0) != null) {
      ref1 = this.httpSettings.web, enabled = ref1.enabled, port = ref1.port, html = ref1.html;
    }
    if (!enabled) {
      return;
    }
    http = require('http');
    port = parseInt(port != null ? port : 3000, 10);
    appName = this.env.getEnvProperty(AppName);
    if (html != null) {
      this.app.use(evaluateName(html.engine, html.args, html.context, {
        app: this.app
      }));
    }
    return http.createServer(this.app.callback()).listen(port, function() {
      return console.log(appName + " web server started");
    });
  };


  /**
   * @function Set up internazionalization
   */

  KoaServer.prototype.setupI18n = function() {
    var enabled, httpUtil, koaLocale, localeManager, ref;
    if (((ref = this.httpSettings) != null ? ref.i18n : void 0) != null) {
      enabled = this.httpSettings.i18n.enabled;
    }
    if (enabled !== true) {
      return;
    }
    koaLocale = require('koa-locale');
    httpUtil = this.engine.Http.Util;
    localeManager = this.engine.Locale.Manager;
    koaLocale(this.app);
    this.app.use(function*(next) {
      var locale, ref1, ref2, ref3;
      locale = (ref1 = (ref2 = (ref3 = this.getLocaleFromQuery()) != null ? ref3 : this.getLocaleFromCookie()) != null ? ref2 : this.getLocaleFromHeader()) != null ? ref1 : localeManager.getDefaultCountry();
      if (locale != null) {
        locale = (yield localeManager.setLocale(locale));
        if (this.session) {
          this.session.locale = locale;
        }
        httpUtil.setCookieValue(this, 'locale', locale.locale, '1year');
      }
      return (yield next);
    });
    return I18n.init({
      fallbackLng: this.localeSettings.defaultLanguage,
      debug: this.localeSettings.debug
    });
  };


  /**
   * @function Set up routing
   */

  KoaServer.prototype.setupRouting = function() {
    var webRoutes;
    if (this.initSettings != null) {
      webRoutes = this.initSettings.webRoutes;
    }
    if (webRoutes == null) {
      return;
    }
    this.app.use(require('koa-routing')(this.app));
    return webRoutes(this.app, this.engine);
  };


  /**
   * @function Set up routing
   */

  KoaServer.prototype.initDaemons = function() {
    var ref;
    if (((ref = this.initSettings) != null ? ref.initDeamons : void 0) == null) {
      return;
    }
    return this.initSettings.initDeamons();
  };


  /**
   * @function extendNamespace
   */

  KoaServer.prototype.extendNamespace = function() {
    var ref;
    if (((ref = this.initSettings) != null ? ref.extendNamespace : void 0) == null) {
      return;
    }
    return this.initSettings.extendNamespace();
  };


  /**
   * @function Sets up error handling
   */

  KoaServer.prototype.setupErrorHandling = function() {
    var ctx, customErrorHandling, ref;
    customErrorHandling = (ref = this.errorSettings) != null ? ref.listener : void 0;
    ctx = this;
    return this.app.use((function(_this) {
      return function*(next) {
        var err, error;
        try {
          return (yield next);
        } catch (error) {
          err = error;
          if ((customErrorHandling != null) && (yield customErrorHandling(err, ctx))) {
            return;
          }
          return (yield handleError(ctx, err));
        }
      };
    })(this));
  };


  /**
   * @function Sets up modules to be used by the server.
   */

  KoaServer.prototype.setup = function() {
    this.app.keys = ["some secret hurr"];
    this.extendNamespace();
    this.setupErrorHandling();
    this.setupMiddlewares();
    this.setupLogger();
    this.setupSession();
    this.setupI18n();
    this.setupBody();
    this.setupWeb();
    this.setupPostMiddlewares();
    this.setupRouting();
    this.setupStatic();
    this.app.use(register.respondersMiddleware(this.app, this.engine));
    return this.initDaemons(this.app, this.engine);
  };

  return KoaServer;

})();

handleError = function*(ctx, err) {
  var stack;
  if (ctx.env.getProcessProperty(EnvType) === EnvTypeDev) {
    console.log(err);
    if (err.stack) {
      stack = err.stack.replace(/^[^\(]+?[\n$]/gm, '').replace(/^\s+at\s+/gm, '').replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').split('\n');
      console.log(stack);
    }
  }
  switch (ctx.accepts('html', 'json')) {
    case 'json':
      return (yield ctx.jaune.responder.json.sendError(err));
    case 'html':
      return (yield ctx.jaune.responder.page.sendError(err));
    default:
      return (yield ctx.jaune.responder.http.error(err));
  }
};

module.exports = {
  App: KoaServer
};
