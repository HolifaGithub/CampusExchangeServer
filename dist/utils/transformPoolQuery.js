"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _pool = _interopRequireDefault(require("../pool"));

function transformPoolQuery(sql, args) {
  return new Promise(function (resolve, reject) {
    _pool["default"].query(sql, args, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}

var _default = transformPoolQuery;
exports["default"] = _default;