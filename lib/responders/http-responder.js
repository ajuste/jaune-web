
/**
 * @file Source code for Http utility.
 * @author Alvaro Juste
 */
'use strict';
var BadRequest, HttpCode, InsufficientTrustLevel, InternalServerError, NotAcceptable, NotFound, NotModified, Ok, Unauthorized, app, badRequest, bind, error, insufficientTrustLevel, isFunction, lodash, notAcceptable, notFound, notModified, ok, unauthorized, util;

lodash = require('lodash');

bind = lodash.bind;

isFunction = lodash.isFunction;

HttpCode = require('../http').HttpCode;

Unauthorized = HttpCode.Unauthorized;

InsufficientTrustLevel = HttpCode.InsufficientTrustLevel;

NotFound = HttpCode.NotFound;

BadRequest = HttpCode.BadRequest;

NotModified = HttpCode.NotModified;

NotAcceptable = HttpCode.NotAcceptable;

InternalServerError = HttpCode.InternalServerError;

Ok = HttpCode.Ok;


/**
 * @function Get util from context
 * @param    {Object} ctx The context
 */

util = function(ctx) {
  return ctx.jaune.engine().Http.Util;
};


/**
 * @function Get app
 * @param    {Object} ctx The context
 */

app = function(ctx) {
  return ctx.jaune.app();
};


/**
 * @function End with anauthorized http code
 */

unauthorized = function() {
  var error;
  error = app(this).getHandlers.error;
  if (isFunction(error)) {
    error.call(this, {
      statusCode: Unauthorized
    });
  }
  return util(this).endWithCode(this, Unauthorized);
};


/**
 * @function End with insufficient trust level http code
 */

insufficientTrustLevel = function() {
  return util(this).endWithCode(this, InsufficientTrustLevel);
};


/**
 * @function End with not found http code
 */

notFound = function() {
  return util(this).endWithCode(this, NotFound);
};


/**
 * @function End bad request http code
 */

badRequest = function() {
  return util(this).endWithCode(this, BadRequest);
};


/**
 * @function End with not modified http code
 */

notModified = function() {
  return util(this).endWithCode(this, NotModified);
};


/**
 * @function End with not acceptable code
 */

notAcceptable = function() {
  return util(this).endWithCode(this, NotAcceptable);
};


/**
 * @function End with error http code
 */

error = function() {
  return util(this).endWithCode(this, InternalServerError);
};


/**
 * @function End with ok http code
 */

ok = function() {
  return util(this).endWithCode(this, Ok);
};

module.exports = function(context) {
  return {
    unauthorized: bind(unauthorized, context),
    insufficientTrustLevel: bind(insufficientTrustLevel, context),
    notAcceptable: bind(notAcceptable, context),
    notFound: bind(notFound, context),
    notModified: bind(notModified, context),
    badRequest: bind(badRequest, context),
    error: bind(error, context),
    ok: bind(ok, context)
  };
};
