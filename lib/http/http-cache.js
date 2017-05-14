/**
 * @file   Source code for Http cache.
 * @author Alvaro Juste
 */

"use strict";

// jaune
const _httpUtil = require("jaune-util").Util;

/**
 * @constant {String} Section name for Http configuration
 */
const CONFIG_SECTION = "jaune.http";

/**
 * @class Http Class
 * @param {Object} env Environment
 * @param {Object} [util
 */
const HttpCache = function(env, util) {
  this.settings = env.getEnvProperty(CONFIG_SECTION, "cache") || {};
  this.util     = util || new _httpUtil();
};

/**
 * @function Process http cache.
 * @param    {Object} opts Options
 * @param    {Object} stat File system status
 */
HttpCache.prototype.process = function(opts, stat) {

  (opts || (opts={}));

  var cache  = this.settings.enabled;
  var etag   = this.util.generateEtag(stat);
  var resend = opts.noCache === true || cache === false || opts.request.headers['if-none-match'] !== etag;

  if (opts.noCache === true) {
    this.util.sendHeaderNoCache(opts.response);
  }
  else if (resend) {
    if (cache) {
      this.util.sendHeaderLastModified(opts.response, stat.mtime);
      this.util.sendHeaderEtag(opts.response, etag);
      this.util.sendHeaderExpires(opts.response, new Date().addDays(opts.longLasting ? 365 : 1));
    }
  }
  else {
    this.util.sendHeaderLastModified(opts.response, stat.mtime);
  }
  return resend;
};

module.exports = {
  Cache : HttpCache
};
