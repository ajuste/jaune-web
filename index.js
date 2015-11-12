"use strict";


// 3rd
const _extend       = require("lodash").extend;

// jaune
const _createEngine = require("jaune-engine").create;
const _contex       = require("./lib/context");
const _responders   = require("./lib/responders");
const _localization = require("./lib/localization");
const _http         = require("./lib/http");
const _server       = require("./lib/server");

module.exports = {
  /**
   * @function Create a new web app based on configuration.
   * @param    {Object} config The configuration
   * @returns  {Object} engine
   */
  create : function(config) {

    const engine   = _createEngine(config);
    const instance = _extend({}, engine);
    const env      = instance.Environment;

    // localization namespace
    _extend(instance, { Locale : _localization });
    _extend(instance, { Locale : { Manager : _localization.Manager(env) }});

    // http namespace
    const _httpUtil     = new _http.Util();
    const _httpEncoding = new _http.ResponseEncoding(env, _httpUtil);
    const _httpCache    = new _http.Cache(env, _httpUtil);

    _extend(instance, { Http : _http });
    _extend(instance, { Http : {
      Util : _httpUtil,
      Encoding: _httpEncoding,
      Cache: _httpCache
    }});

    // responders namespace
    _extend(instance, { Responders : _responders });

    // app namespace
    const _app = new _server.App(env, instance);

    _extend(instance, { App : _app });

    return instance;
  }
};
