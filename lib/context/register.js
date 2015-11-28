/**
 * @file   Source code for context middleware
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _isUndefined = require("lodash").isUndefined;
const _extend      = require("lodash").extend;
const _bind        = require("lodash").bind;
const _mapValues   = require("lodash").mapValues;

// jaune
const _responders  = require("../responders");


function Data() {
  this.data = {};
};
Data.prototype.get = function() {
  return this.data;
};
Data.prototype.set = function (val) {
  return (this.data = val);
};
/**
 * @function Get / set data in context
 * @param    {Object} args Native arguments object for the function
 */
Data.prototype.process = function(args) {

    const val = args[0];

    switch(args.length) {
      case 1 :
        return this.set(val);
      case 0 :
        return this.get();
  }
};

/**
 * @function Middleware function that register core references
 */
const coreMiddleware = function(app, engine) {
  return function* (next) {

    const self = this;

    this.jaune = {
      app : function() {
        return app;
      },
      engine : function() {
        return engine;
      }
    };

    // register data
    this.jaune.data = (function() {

      const data = new Data();

      return function() {
        return data.process(arguments);
      };

    })();
    this.jaune.responder = _responders(this);

    yield next;
  };
};

/**
 * @function Middleware function that register responders
 */
const respondersMiddleware = function(app, engine) {
  return function* (next) {

    // register responders binded to context

    yield next;
  };
};

module.exports = {
  coreMiddleware       : coreMiddleware,
  respondersMiddleware : respondersMiddleware
};
