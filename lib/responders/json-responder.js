/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _isString      = require("lodash").isString;
const _extend        = require("lodash").extend;

// jaune
const _httpResponder = require("./http-responder");
const _httpCode      = require("../http").HttpCode;

/**
 * @function Respond with JSON response
 * @param    {*} [result.data] Data to be sent to client
 * @param    {Number} [result.securityCheck] Security check for request
 * @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */
const send = function* (opts) {

  (opts || (opts = {}));

  const result        = ((opts || {}).result) || this.jaune.data();
  const data          = JSON.stringify(result.data || "");
  const securityCheck = result.securityCheck;
  const dataAvailable = !!data.length;

  // check if auth info to give proper response
  if (_.isNumber(securityCheck)) {

    switch (securityCheck) {

      case Security.IsGrantedResult.Yes:
        break; // intended

      case Security.IsGrantedResult.InsufficientTrustLevel:
        return _httpResponder.insufficientTrustLevel.call(this);

      default:
        return _httpResponder.unauthorized.call(this);
    }
  }

  // check if NotFound must be sent on no data
  if (true === opts.sendNotFoundOnNoData && !dataAvailable) {
    return _httpResponder.notFound.call(this);
  }
  _httpResponder.send.call(this, data);
};

/**
 * @function Respond with an error
 * @param    {Object} err The error that caused this response
 */
const error = function* (err) {

  const isArgumentError = err instanceof Error.ArgumentError;
  const logger          = this.logger;
  const loggerArgs      = this.loggerArgs;
  const code            = isArgumentError ? _httpCode.BadRequest : _httpCode.InternalServerError;

  err = ErrorManager.asUnhandledError(err); // extend with more data

  if (logger && loggerArgs) {
    yield ErrorManager.logErrorOnUnhandledError(err, logger, _extend(loggerArgs, {message: err}));
  }
  _httpUtil.endWithCode.call(this, code, isArgumentError ? err.message : null);
};

module.exports = {
  send : send,
  error: error
};
