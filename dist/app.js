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

var _transformPoolQuery = _interopRequireDefault(require("./utils/transformPoolQuery"));

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
    var isNewUser, isDeleteSuccess, requestBody, code, rawData, signature, encryptedData, iv, requestUrl, result, _result$data, openid, session_key, checkSignatureResult, pc, openData, nickName, gender, country, province, city, avatarUrl, sql1, result1, sql2, result2, sql3, result3;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            isNewUser = true;
            isDeleteSuccess = false;
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context.next = 47;
              break;
            }

            code = requestBody.code, rawData = requestBody.rawData, signature = requestBody.signature, encryptedData = requestBody.encryptedData, iv = requestBody.iv; //通过请求微信小程序的检验code的地址去获取openid和session_key

            requestUrl = "".concat(_wechatServer.authCode2Session);
            _context.next = 8;
            return _index["default"].get(requestUrl, {
              params: {
                appid: _miniProgramInfo.appId,
                secret: _miniProgramInfo.appSecret,
                js_code: code,
                grant_type: 'authorization_code'
              }
            });

          case 8:
            result = _context.sent;
            _result$data = result.data, openid = _result$data.openid, session_key = _result$data.session_key;

            if (!(openid && session_key)) {
              _context.next = 45;
              break;
            }

            //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
            checkSignatureResult = (0, _checkSignature.checkSignature)(signature, rawData, session_key);

            if (!checkSignatureResult) {
              _context.next = 43;
              break;
            }

            //如果签名一致有效，则调用加密数据解密算法解密出用户的开放数据
            pc = new _WXBizDataCrypt.WXBizDataCrypt(_miniProgramInfo.appId, session_key);
            openData = pc.decryptData(encryptedData, iv);
            nickName = openData.nickName, gender = openData.gender, country = openData.country, province = openData.province, city = openData.city, avatarUrl = openData.avatarUrl; // console.log('解密后 data: ', openData)

            _context.prev = 16;
            //1.先去查询数据库是否有该用户的记录，如果没有则是新用户，如果有就是老用户
            sql1 = "select * from user_info where open_id = ?";
            _context.next = 20;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 20:
            result1 = _context.sent;

            if (result1.length === 0) {
              isNewUser = true;
            } else {
              isNewUser = false;
            } //2.如果不是新用户的话就将数据库的先前的用户数据


            if (isNewUser) {
              _context.next = 29;
              break;
            }

            sql2 = "DELETE FROM user_info WHERE open_id = ?";
            _context.next = 26;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 26:
            result2 = _context.sent;
            console.log("result2：", result2);

            if (result2.affectedRows === 1) {
              isDeleteSuccess = true;
            } else {
              isDeleteSuccess = false;
            }

          case 29:
            if (!(!isNewUser && isDeleteSuccess || isNewUser)) {
              _context.next = 35;
              break;
            }

            sql3 = "INSERT INTO user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?)";
            _context.next = 33;
            return (0, _transformPoolQuery["default"])(sql3, [openid, nickName, gender, country, province, city, avatarUrl]);

          case 33:
            result3 = _context.sent;

            if (result3.affectedRows === 1) {
              console.log("\u7528\u6237\uFF1A".concat(nickName, "\u7684\u767B\u5F55\u5F00\u653E\u6570\u636E\u5DF2\u4FDD\u5B58\u5230\u6570\u636E\u5E93\uFF01"));
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                isNewUser: isNewUser
              };
            } else {
              console.log("\u7528\u6237\uFF1A".concat(nickName, "\u7684\u767B\u5F55\u5F00\u653E\u6570\u636E\u4FDD\u5B58\u6570\u636E\u5E93\u5931\u8D25\uFF01"));
              ctx.response.status = _userStatus.statusCodeList.fail;
              ctx.response.body = '数据库操作失败！';
            }

          case 35:
            _context.next = 41;
            break;

          case 37:
            _context.prev = 37;
            _context.t0 = _context["catch"](16);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '数据库操作失败！';

          case 41:
            _context.next = 45;
            break;

          case 43:
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '您的签名signature有误!';

          case 45:
            _context.next = 49;
            break;

          case 47:
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '您请求的用户code有误!';

          case 49:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[16, 37]]);
  }));

  return function login(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

app.use(_koaRoute["default"].post('/login', login));
app.listen(3000);