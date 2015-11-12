
"use strict";

// 3rd
const _zlib = require("zlib");
const _find = require("lodash").find;

/**
 * @constant {String} Section name for Http configuration
 */
const CONFIG_SECTION = "modules.http";

/**
 * @class Http response encoding
 * @param {Object} env Environment
 * @param {Object} [util
 */
const HttpResponseEncoding = function(env, util) {

  const settings = env.getEnvProperty(CONFIG_SECTION, "compression") || {};

  this.util        = util || new _httpUtil();
  this.compressors = {};

  if (!settings.enabled) return;

  this.compressors = {
    "gzip"    : _zlib.createGzip,
    "deflate" : _zlib.createDeflate
  };
};
/**
 * @function Get compressor
 * @param    [Array] encodings Acceptable encodings
 * @returns  {Object} The compressor or null
 */
HttpResponseEncoding.prototype.getCompressor = function(encodings) {
  return this.compressors[_find(encodings, (e) => { this.compressors[e] })];
};
/**
 * @function Process HTTP encoding.
 * @param    {Object} opts Options
 * @param    {Object} stat File system status
 */
HttpResponseEncoding.prototype.process = function(opts, stream) {

  const compressor = this.getCompressor(this.util.getHeaderAcceptEncodings(opts.request));
  const result = stream;

  if (compressor !== null) {
    result = compressor.compressor();
    this.util.sendHeaderContentEncoding(opts.response, compressor.encoding);
    stream.pipe(result).pipe(opts.response);
  }
  else {
    stream.pipe(opts.response);
  }
  return result;
};
module.exports = {
  ResponseEncoding : HttpResponseEncoding
};
