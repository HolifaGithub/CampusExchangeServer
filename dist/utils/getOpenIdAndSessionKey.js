"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _wechatServer = require("../static-name/wechat-server");

var _index = _interopRequireDefault(require("../../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index"));

var _miniProgramInfo = require("../static-name/mini-program-info");

function getOpenIdAndSessionKey(_x) {
  return _getOpenIdAndSessionKey.apply(this, arguments);
}

function _getOpenIdAndSessionKey() {
  _getOpenIdAndSessionKey = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(code) {
    var requestUrl, result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            //通过请求微信小程序的检验code的地址去获取openid和session_key
            requestUrl = "".concat(_wechatServer.authCode2Session);
            _context.next = 3;
            return _index["default"].get(requestUrl, {
              params: {
                appid: _miniProgramInfo.appId,
                secret: _miniProgramInfo.appSecret,
                js_code: code,
                grant_type: 'authorization_code'
              }
            });

          case 3:
            result = _context.sent;
            return _context.abrupt("return", result.data);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getOpenIdAndSessionKey.apply(this, arguments);
}

var _default = getOpenIdAndSessionKey;
exports["default"] = _default;