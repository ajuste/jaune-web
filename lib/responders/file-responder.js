/**
 * @file   Source code for Json Responder
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _bind          = require("lodash").bind;

// jaune
const _httpResponder = require("./http-responder");
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

  const engine     = this.jaune.app().getEngine();
  const filesystem = engine.FS.Manager;
  const cache      = engine.Http.Cache;
  const util       = engine.Http.Util;
  const result     = yield filesystem.read(fsModule, {
                        request    : this.request,
                        response   : this,
                        path       : path,
                        checkCache : _bind(checkCache, this, util, opts, stat)
                      });

  switch (result.code) {

    case _readResult.Success:
      util.sendHeaderContentType(this, stat.getMime());
      this.body = result.stream;
      break;

    case _readResult.NotFound:
      return _httpResponder.notFound.call(this);

    case _readResult.InvalidPath:
    case _readResult.InvalidResourceType:
      return _httpResponder.badRequest.call(this);

    case _readResult.NotModified:
      return _httpResponder.notModified.call(this);

    default :
      throw new Error(`Unsupported read file code "${result.code}"`);
  }
};

module.exports = {
  send: send
};
