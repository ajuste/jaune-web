
/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
'use strict';
var HttpCode, bind, extend, isNumber, lodash, sendData, sendError;

lodash = require('lodash');

bind = lodash.bind;

extend = lodash.extend;

isNumber = lodash.isNumber;

HttpCode = require('../http').HttpCode;


/**
 * @function Respond with JSON response
 * @param    {*} [result.data] Data to be sent to client
 * @param    {Number} [result.securityCheck] Security check for request
 * @param    {Boolean} [opts.sendNotFoundOnNoData] Sends 404 on no data
 */

sendData = function*(opts) {
  var IsGrantedResult, data, dataAvailable, http, ref, ref1, result, securityCheck;
  if (opts == null) {
    opts = {};
  }
  result = (ref = opts.result) != null ? ref : this.jaune.data();
  data = JSON.stringify((ref1 = result.data) != null ? ref1 : '');
  dataAvailable = !!data.length;
  securityCheck = result.securityCheck;
  http = this.jaune.responder.http;
  IsGrantedResult = this.jaune.engine().Security.IsGrantedResult;
  if (isNumber(securityCheck)) {
    switch (securityCheck) {
      case IsGrantedResult.Yes:
        break;
      case IsGrantedResult.InsufficientTrustLevel:
        return http.insufficientTrustLevel.call(this);
      default:
        return http.unauthorized.call(this);
    }
  }
  if (opts.sendNotFoundOnNoData === true && !dataAvailable) {
    return http.notFound.call(this);
  }
  this.body = data;
  return (yield {});
};


/**
 * @function Respond with an error
 * @param    {Object} err The error that caused this response
 */

sendError = function*(err) {
  var code, engine, errorManager, isArgumentError, isCodedError, logger, loggerArgs, util;
  engine = this.jaune.engine();
  isArgumentError = err instanceof engine.Error.ArgumentError;
  isCodedError = err instanceof engine.Error.UnhandledError;
  util = engine.Http.Util;
  errorManager = engine.Error.Manager;
  logger = this.logger;
  loggerArgs = this.loggerArgs;
  code = isArgumentError ? HttpCode.BadRequest : 0;
  if (!code) {
    code = isCodedError && err.code ? err.code : HttpCode.InternalServerError;
  }
  err = errorManager.asUnhandledError(err);
  if ((logger != null) && (loggerArgs != null)) {
    (yield errorManager.logErrorOnUnhandledError(err, logger, extend(loggerArgs, {
      message: err
    })));
  }
  return util.endWithCode(this, code, isCodedError ? err.message : null);
};

module.exports = function(context) {
  return {
    sendData: bind(sendData, context),
    sendError: bind(sendError, context)
  };
};
