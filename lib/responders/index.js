const _extend  = require("lodash").extend;

const _http = require("./http-responder");
const _json = require("./json-responder");
const _file = require("./file-responder");
const _page = require("./page-responder");

module.exports = function(context) {

  const _exports = {};

  _extend(_exports, { http : _http(context)  });
  _extend(_exports, { json : _json(context)  });
  _extend(_exports, { file : _file(context)  });
  _extend(_exports, { page : _page(context)  });

  return _exports;

};
