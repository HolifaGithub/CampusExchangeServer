"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _koa = _interopRequireDefault(require("koa"));

var _koaRoute = _interopRequireDefault(require("koa-route"));

var _koaBodyparser = _interopRequireDefault(require("koa-bodyparser"));

var _index = _interopRequireDefault(require("../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index"));

var _checkSignature = require("./utils/check-signature");

var _WXBizDataCrypt = require("./utils/WXBizDataCrypt");

var _wechatServer = require("./static-name/wechat-server");

var _miniProgramInfo = require("./static-name/mini-program-info");

var _userStatus = require("./static-name/user-status");

var app = new _koa["default"]();
app.use((0, _koaBodyparser["default"])());

var login =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(ctx, next) {
    var requestBody, code, rawData, signature, encryptedData, iv, requestUrl, result, _result$data, openid, session_key, checkSignatureResult, pc, openData;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context.next = 11;
              break;
            }

            code = requestBody.code, rawData = requestBody.rawData, signature = requestBody.signature, encryptedData = requestBody.encryptedData, iv = requestBody.iv; //通过请求微信小程序的检验code的地址去获取openid和session_key

            requestUrl = "".concat(_wechatServer.authCode2Session);
            _context.next = 6;
            return _index["default"].get(requestUrl, {
              params: {
                appid: _miniProgramInfo.appId,
                secret: _miniProgramInfo.appSecret,
                js_code: code,
                grant_type: 'authorization_code'
              }
            });

          case 6:
            result = _context.sent;
            _result$data = result.data, openid = _result$data.openid, session_key = _result$data.session_key;

            if (openid && session_key) {
              //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
              checkSignatureResult = (0, _checkSignature.checkSignature)(signature, rawData, session_key);

              if (checkSignatureResult) {
                //如果签名一致有效，则调用加密数据解密算法解密出用户的开放数据
                pc = new _WXBizDataCrypt.WXBizDataCrypt(_miniProgramInfo.appId, session_key);
                openData = pc.decryptData(encryptedData, iv);
                console.log('解密后 data: ', openData);
                ctx.response.status = _userStatus.statusCodeList.success;
                ctx.response.body = _userStatus.statusList.success;
              } else {
                ctx.response.status = _userStatus.statusCodeList.fail;
                ctx.response.body = '您的签名signature有误!';
              }
            }

            _context.next = 13;
            break;

          case 11:
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '您请求的用户code有误!';

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function login(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

app.use(_koaRoute["default"].post('/login', login));
app.listen(3000);