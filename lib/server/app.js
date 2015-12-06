/**
 * @file   Source file application
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _defaults  = require("lodash").defaults;
const _koaServer = require("./koa-server").App;


const ENV_TYPE        = "type";
const ENV_TYPE_DEV    = "development";

/**
 * @class Jaune Application
 */
const JauneApp = function(env, engine) {

  _defaults(process, {env : { type : "production" }});

  this.handlers = {};
  this.env      = env;
  this.engine   = engine;

  this.parseArguments();
  this.startServer();
};

JauneApp.prototype.getEnvironment = function() {
  return this.env;
};

JauneApp.prototype.getEngine = function() {
  return this.engine;
};

JauneApp.prototype.getHandlers = function() {
  return this.handlers;
};

/**
 * @function Parses arguments from command line that are directed to this class.
 */
JauneApp.prototype.parseArguments = function() {
  for(var i = 0; i < process.argv.length; i++) {
    switch(process.argv[i]) {
      case "--develop" :
        this.env.setProcessProperty(ENV_TYPE, ENV_TYPE_DEV)
      break;
    }
  }
};

/**
 * @function Starts the server.
 */
JauneApp.prototype.startServer = function() {
  if (this.server) throw new Error("Already started");
  (this.server = new _koaServer(this.env, this.engine));
};

/**
 * @function Unload application
 */
JauneApp.prototype.unload = function() {
  process.env = null;
  process.app = null;
};

module.exports = {
  App : JauneApp
};
