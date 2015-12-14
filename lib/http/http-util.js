/**
 * @file Source code for Http utility.
 * @author Alvaro Juste
 */

"use strict";

// 3rd
const _isString   = require("lodash").isString;
const _isFunction = require("lodash").isFunction;

// constants
const _enums    = {
  /**
   * @enum {Number} Valid HTTP codes.
   */
  HttpCode : {
    /**
     * @constant {Number} Success
     */
    Ok : 200,
    /**
     * @constant {Number} Client must provide a stronger trust level.
     */
    InsufficientTrustLevel : 280,
    /**
     * @constant {Number} Resource has not been modified.
     */
    NotModified : 304,
    /**
     * @constant {Number} Bad request.
     */
    BadRequest : 400,
    /**
     * @constant {Number} Client is not authorized.
     */
    Unauthorized : 401,
    /**
     * @constant {Number} Server refuses to complete request.
     */
    Fobidden : 403,
    /**
     * @constant {Number} Resource not found.
     */
    NotFound : 404,
    /**
     * @constant {Number}Request too big.
     */
    RequestEntityTooLarge : 413,
    /**
     * @constant {Number} Something went wrong inside the server.
     */
    InternalServerError : 500
  }
};
/**
 * @class Class for HTTP utilities.
 */
const HttpUtil = function () {};

/**
 * @function Set cookie's value by name
 * @param    {Obejct} response The response
 * @param    {String} name The name of the cookie
 * @param    {String} value The value of the cookie
 * @param    {Number|Strign} duration The duration of the cookie in ms or as unit <br>1year</br>.
 */
HttpUtil.prototype.setCookieValue = function(response, name, value, duration) {
  duration = _isString(duration) ? Date.getTimeFromEnum(duration) : duration;
  response.cookies.set(name, value, { expires : new Date() + duration, maxAge : duration});
};
/**
 * @function Gets cookie's value by name
 * @param    {Obejct} response The response
 * @param    {String} name The name of the cookie
 * @returns  {String} The value of the cookie
 */
HttpUtil.prototype.getCookieValue = function(response, name) {
  return response.cookies.get(name);
};
/**
 * @function Remove a cookie by name
 * @param    {Obejct} response The response
 * @param    {String} name The name of the cookie
 */
HttpUtil.prototype.removeCookie = function(response, name) {
  this.setCookieValue(response, name, "", { expires : new Date() - 1000, maxAge : 0 });
};
/**
 * @function Parse integer from the request
 * @param    {*} input The input
 * @returns  The parse number
 */
HttpUtil.prototype.parseInteger = function(input) {
  var res = parseInt(new Number(input));
  return isNaN(res) ? null : res;
};
/**
 * @function Gets remote address by handling HTTP redirects by proxy.
 * @param    {Object} req Request
 * @returns  {String} Originator address.
 */
HttpUtil.prototype.getRemoteAddress = function(req) {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
};
/**
 * @function Gets value of a request header.
 * @param    {Object} req Request
 * @param    {String} name Header name.
 * @returns  {String} Header value
 */
HttpUtil.prototype.getRequestHeader = function(req, name) {
  return req.headers[name] || null;
};
/**
 * @function End request with <b>{HttpCode.InsufficientTrustLevel}</b>
 * @param    {Object} response HTTP Response
 */
HttpUtil.prototype.endWithInsufficientTrustLevel = function(response) {
  this.endWithCode(response, _enums.HttpCode.InsufficientTrustLevel);
};
/**
 * @function End request with <b>{HttpCode.Ok}</b>
 * @param    {Object} response HTTP Response
 * @param    {String} body Response body
 */
HttpUtil.prototype.endWithSuccess = function(response, body) {
  this.endWithCode(response, _enums.HttpCode.Ok, body);
};
/**
 * @function End request with specified code and body.
 * @param    {Object} response HTTP Response
 * @param    {String} body Response body
 * @param    {Number} code HTTP code.
 */
HttpUtil.prototype.endWithCode = function(response, code, body) {
  response.body = body;
  response.status = code;
};
/**
 * @function End request with <b>{HttpCode.NotFound}</b>
 * @param    {Object} response HTTP Response
 */
HttpUtil.prototype.endWithNotFound = function(response) {
  this.endWithCode(response, _enums.HttpCode.NotFound);
};
/**
 * @function End request with <b>{HttpCode.InternalServerError}</b>
 * @param    {Object} response HTTP Response
 * @param    {*} [err] Error
 */
HttpUtil.prototype.endWithInternalError = function(response, err) {
  if ("function" === typeof process.app.configuration.error.handler) {
    err = err || {};
    err.statusCode = _enums.HttpCode.InternalServerError;
    process.app.configuration.error.handler(err, undefined, response);
  }
  else {
    this.endWithCode(response, _enums.HttpCode.InternalServerError);
  }
};
/**
 * @function End request with <b>{HttpCode.RequestEntityTooLarge}</b>
 * @param    {Object} response HTTP Response
 */
HttpUtil.prototype.endWithRequestEntityTooLarge = function(response) {
  this.endWithCode(response, _enums.HttpCode.RequestEntityTooLarge);
};
/**
 * @function End request with <b>{HttpCode.Unauthorized}</b>
 * @param    {Object} ctx Koa context
 */
HttpUtil.prototype.endWithUnauthorized = function(ctx) {

  const errorHandler = ctx.jaune.app().getHandlers().error;

  if (_isFunction(errorHandler)) {
    errorHandler.call(ctx, {
      statusCode : _enums.HttpCode.Unauthorized
    }, undefined, response);
  }
  else {
    this.endWithCode(response, _enums.HttpCode.Unauthorized);
  }
};
/**
 * @function End request with <b>{HttpCode.Fobidden}</b>
 * @param    {Object} response HTTP Response
 */
HttpUtil.prototype.endWithForbidden = function(response) {
  this.endWithCode(response, _enums.HttpCode.Fobidden);
};
/**
 * @function End request with <b>{HttpCode.BadRequest}</b>
 * @param    {Object} response HTTP Response
 * @param    {String} [body] The body
 */
HttpUtil.prototype.endWithBadRequest = function(response, body) {
  this.endWithCode(response, _enums.HttpCode.BadRequest, body);
};
/**
 * @function End request with <b>{HttpCode.NotModified}</b>
 * @param {Object} response HTTP Response
 */
HttpUtil.prototype.endWithNotModified = function(response) {
  this.endWithCode(response, _enums.HttpCode.NotModified);
};
/**
 * @function Sends cache headers so the response is not cached. Header sent are
 *           <b>Cache-Control, Expire, Pragma</b>
 * @param    {Object} response HTTP Response
 */
HttpUtil.prototype.sendHeaderNoCache = function(response) {
  response.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  response.set("Expires", new Date(0).toString());
  response.set("Pragma", "no-cache");
};
/**
 * @function Configure response header for expiration. Header sent are <b>Cache-Control,
 *           Expire</b>
 * @param    {Object} response HTTP Response
 * @param    {Date} date When response expires.
 */
HttpUtil.prototype.sendHeaderExpires = function(response, date) {
  response.set("Expires", date.toString());
  response.set("Cache-Control", "public, max-age=" + date.differenceInSeconds(new Date()));
};
/**
 * @function Gets accepted encoding by request by reading <b>accept-encoding</b>
 * @param    {Object} request HTTP Request
 * @returns  {Array} Encodings
 */
HttpUtil.prototype.getHeaderAcceptEncodings = function(request) {
  return (request.headers["accept-encoding"] || "").split(",");
};
/**
 * @function Gets request content type by reading <b>content-type</b>
 * @param    {Object} request HTTP Request
 * @returns  {String} Content type
 */
HttpUtil.prototype.getHeaderContentType = function(request) {
  return request.headers["content-type"] || "";
};
/**
 * @function Gets request accepted language by reading <b>accept-language</b>
 * @param    {Object} request HTTP Request
 * @returns  {String} Accepted languages
 */
HttpUtil.prototype.getHeaderAcceptLanguage = function(request) {
  return request.headers["accept-language"];
};
/**
 * @function Sends <b>Content-Encoding</b> header.
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendHeaderContentEncoding = function(response, encoding) {
  response.set("Content-Encoding", encoding);
};
/**
 * @function Sends <b>Content-Length</b> header.
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendHeaderContentLength = function(response, length) {
  response.set("Content-Length", length);
};
/**
 * @function Sends <b>Last-Modified</b> header.
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendHeaderLastModified = function(response, value) {
  response.set("Last-Modified", value);
};
/**
 * @function Set locale cookie
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendCookieLocale = function(response, value) {
  response.set("Locale", value);
};
/**
 * @function Sends <b>ETag</b> header.
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendHeaderEtag = function(response, value) {
  response.set("ETag", value);
};
/**
 * @function Sends <b>Content-Type</b> header.
 * @param    {Object} response HTTP response.
 * @param    {String} value The value.
 */
HttpUtil.prototype.sendHeaderContentType = function(response, value) {
  response.set("Content-Type", value);
};
/**
 * @function Generates Entity tag.
 * @param    {Object} stat File system status.
 * @returns  {String} The ETag
 */
HttpUtil.prototype.generateEtag = function(stat) {
  return stat.size + "-" + Date.parse(stat.mtime);
};
module.exports = {
  Util : HttpUtil,
  HttpCode : _enums.HttpCode
};
