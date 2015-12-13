/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _bind          = require("lodash").bind;
const _isString      = require("lodash").isString;
const _extend        = require("lodash").extend;
const _isNumber      = require("lodash").isNumber;

// jaune
const _httpCode      = require("../http").HttpCode;

/**
 * @function Respond with JSON response
 * @param    {*} [result.data] Data to be sent to client
 * @param    {Number} [result.securityCheck] Security check for request
 * @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */
const sendData = function* (opts) {

  (opts || (opts = {}));

  const result        = ((opts || {}).result) || this.jaune.data();
  const data          = JSON.stringify(result.data || "");
  const dataAvailable = !!data.length;
  const securityCheck = result.securityCheck;
  const httpResponder = this.jaune.responder.http;

  // check if auth info to give proper response
  if (_isNumber(securityCheck)) {

    switch (securityCheck) {

      case Security.IsGrantedResult.Yes:
        break; // intended

      case Security.IsGrantedResult.InsufficientTrustLevel:
        return httpResponder.insufficientTrustLevel.call(this);

      default:
        return httpResponder.unauthorized.call(this);
    }
  }

  // check if NotFound must be sent on no data
  if (true === opts.sendNotFoundOnNoData && !dataAvailable) {
    return httpResponder.notFound.call(this);
  }
  this.body = data;
};

/**
 * @function Respond with an error
 * @param    {Object} err The error that caused this response
 */
const sendError = function* (err) {

  const engine          = this.jaune.engine();
  const isArgumentError = err instanceof engine.Error.ArgumentError;
  const util            = engine.Http.Util;
  const errorManager    = engine.Error.Manager;

  const logger          = this.logger;
  const loggerArgs      = this.loggerArgs;
  const code            = isArgumentError ? _httpCode.BadRequest : _httpCode.InternalServerError;

  err = errorManager.asUnhandledError(err); // extend with more data

  if (logger && loggerArgs) {
    yield errorManager.logErrorOnUnhandledError(err, logger, _extend(loggerArgs, {message: err}));
  }
  util.endWithCode(this, code, isArgumentError ? err.message : null);
};

module.exports = function(context) {
  return {
    sendData  : _bind(sendData, context),
    sendError : _bind(sendError, context)
  }
};
