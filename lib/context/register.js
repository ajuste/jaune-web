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

/**
 * @function Get / set data in context
 * @param    {Object} args Native arguments object for the function
 * @param    {Object} data Data for the context
 */
const dataFunc = function(args, data) {

    const key = args[0];
    const val = args[1];

    switch(args.length) {
      case 2 :
        return (data[key] = val);
      case 1 :
        return data[key];
      case 0 :
        return data;
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

      const data = {};

      return function() {
        dataFunc.call(self, arguments, data);
      };

    })();

    yield next;
  };
};

/**
 * @function Middleware function that register responders
 */
const respondersMiddleware = function(app, engine) {
  return function* (next) {

    // register responders binded to context
    this.jaune.responder = _responders(this);

    yield next;
  };
};

module.exports = {
  coreMiddleware       : coreMiddleware,
  respondersMiddleware : respondersMiddleware
};
