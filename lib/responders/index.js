const _extend  = require("lodash").extend;
const _exports = {};

_extend(_exports, { http : require("./http-responder") });
_extend(_exports, { json : require("./json-responder") });
_extend(_exports, { file : require("./file-responder") });
_extend(_exports, { page : require("./page-responder") });

module.exports = _exports;
