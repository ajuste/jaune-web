/**
 * @file Source code for Http utility.
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _bind       = require("lodash").bind;
const _isFunction = require("lodash").isFunction;

// jaune
const _httpCode   = require("../http").HttpCode;

/**
 * @function Get util from context
 * @param    {Object} ctx The context
 */
const util = function(ctx) {
  return ctx.jaune.engine().Http.Util;
};

/**
 * @function Get app
 * @param    {Object} ctx The context
 */
const app = function(ctx) {
  return ctx.jaune.app()
};

/**
 * @function End with anauthorized http code
 */
const unauthorized = function() {

  const handler = app(this).getHandlers().error;

  if (_isFunction(handler)) {
    return handler.call(this, { statusCode : _httpCode.Unauthorized});
  }
  util(this).endWithCode(this, _httpCode.Unauthorized);
};

/**
 * @function End with insufficient trust level http code
 */
const insufficientTrustLevel = function() {
  util(this).endWithCode(this, _httpCode.InsufficientTrustLevel);
};

/**
 * @function End with not found http code
 */
const notFound = function() {
  util(this).endWithCode(this, _httpCode.NotFound);
};

/**
 * @function End bad request http code
 */
const badRequest = function() {
  util(this).endWithCode(this, _httpCode.BadRequest);
};

/**
 * @function End with not modified http code
 */
const notModified = function() {
  util(this).endWithCode(this, _httpCode.NotModified);
};

/**
 * @function End with error http code
 */
const error = function() {
  util(this).endWithCode(this, _httpCode.InternalServerError);
};

/**
 * @function End with ok http code
 */
const ok = function() {
  util(this).endWithCode(this, _httpCode.Ok);
};

module.exports = function(context) {
  return {
    unauthorized          : _bind(unauthorized, context),
    insufficientTrustLevel: _bind(insufficientTrustLevel, context),
    notFound              : _bind(notFound, context),
    notModified           : _bind(notModified, context),
    badRequest            : _bind(badRequest, context),
    error                 : _bind(error, context),
    ok                    : _bind(ok, context)
  }
};
