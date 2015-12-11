/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _bind          = require("lodash").bind;

// jaune
const _httpCode      = require("../http").HttpCode;
const _httpCache     = require("../http").Cache;
const _readResult    = require("jaune-fs").ReadResult;

const checkCache = function(util, opts, stat) {
  return new _httpCache(this.jaune.app().getEnvironment(), util).process(
    _.extend(opts, {
      response : this,
      request  : this.request
  }, stat));
};

/**
 * @function Responds with a file
 */
const send = function* (fsModule, path, opts) {

  const engine        = this.jaune.engine();
  const filesystem    = engine.Fs.Manager;
  const cache         = engine.Http.Cache;
  const util          = engine.Http.Util;
  const httpResponder = this.jaune.responder.http;
  const result        = yield filesystem.read(fsModule, {
                          request    : this.request,
                          response   : this,
                          path       : path,
                          checkCache : _bind(checkCache, this, util, opts)
                        });

  switch (result.code) {

    case _readResult.Success:
      util.sendHeaderContentType(this, result.stat.getMime());
      this.body = result.stream;
      break;

    case _readResult.NotFound:
      return httpResponder.notFound.call(this);

    case _readResult.InvalidPath:
    case _readResult.InvalidResourceType:
      return httpResponder.badRequest.call(this);

    case _readResult.NotModified:
      return httpResponder.notModified.call(this);

    default :
      throw new Error(`Unsupported read file code "${result.code}"`);
  }
};

module.exports = function(context) {
  return {
    send : _bind(send, context)
  }
};
