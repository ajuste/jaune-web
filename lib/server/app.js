
/**
 * @file   Source file application
 * @author Alvaro Juste
 */
'use strict';
var App, EnvType, EnvTypeDev, EnvTypeProd, KoaApp, defaults;

defaults = require('lodash').defaults;

KoaApp = require('./koa-server').App;

EnvType = 'type';

EnvTypeDev = 'development';

EnvTypeProd = 'production';


/**
 * @class Jaune Application
 */

App = (function() {

  /**
  * @constructor Builds a new Jaune App.
  * @param {Object} env Environment
  * @param {Object} engine The engine
   */
  function App(env, engine) {
    this.env = env;
    this.engine = engine;
    defaults(process, {
      env: {
        type: EnvTypeProd
      }
    });
    this.handlers = {};
    this.parseArguments();
    this.startServer();
  }


  /**
   * @function Get environment
   */

  App.prototype.getEnvironment = function() {
    return this.env;
  };


  /**
   * @function Get engine
   */

  App.prototype.getEngine = function() {
    return this.engine;
  };


  /**
   * @function Get handlers
   */

  App.prototype.getHandlers = function() {
    return this.handlers;
  };


  /**
   * @function Parses arguments from command line that are directed to this class.
   */

  App.prototype.parseArguments = function() {
    var arg, i, len, ref, results;
    ref = process.argv;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      arg = ref[i];
      switch (arg) {
        case '--develop':
          results.push(this.env.setProcessProperty(EnvType, EnvTypeDev));
          break;
        default:
          results.push(void 0);
      }
    }
    return results;
  };


  /**
   * @function Starts the server.
   */

  App.prototype.startServer = function() {
    if (this.server) {
      throw new Erro('Already started');
    }
    return this.server = new KoaApp(this.env, this.engine);
  };


  /**
   * @function Unload application
   */

  App.prototype.unload = function() {
    process.env = null;
    return process.app = null;
  };

  return App;

})();

module.exports = {
  App: App
};
