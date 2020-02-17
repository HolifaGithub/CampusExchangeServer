"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _koa = _interopRequireDefault(require("koa"));

var _koaRoute = _interopRequireDefault(require("koa-route"));

var _koaBodyparser = _interopRequireDefault(require("koa-bodyparser"));

var _checkSignature = require("./utils/check-signature");

var _WXBizDataCrypt = require("./utils/WXBizDataCrypt");

var _transformPoolQuery = _interopRequireDefault(require("./utils/transformPoolQuery"));

var _getOpenIdAndSessionKey = _interopRequireDefault(require("./utils/getOpenIdAndSessionKey"));

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
    var isNewUser, isDeleteSuccess, requestBody, code, rawData, signature, encryptedData, iv, result, openid, session_key, checkSignatureResult, pc, openData, nickName, gender, country, province, city, avatarUrl, sql1, result1, sql2, result2, sql3, result3;
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

            code = requestBody.code, rawData = requestBody.rawData, signature = requestBody.signature, encryptedData = requestBody.encryptedData, iv = requestBody.iv;
            _context.next = 7;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 7:
            result = _context.sent;
            openid = result.openid, session_key = result.session_key;

            if (!(openid && session_key)) {
              _context.next = 45;
              break;
            }

            //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
            checkSignatureResult = (0, _checkSignature.checkSignature)(signature, rawData, session_key);

            if (!checkSignatureResult) {
              _context.next = 42;
              break;
            }

            //如果签名一致有效，则调用加密数据解密算法解密出用户的开放数据
            pc = new _WXBizDataCrypt.WXBizDataCrypt(_miniProgramInfo.appId, session_key);
            openData = pc.decryptData(encryptedData, iv);
            nickName = openData.nickName, gender = openData.gender, country = openData.country, province = openData.province, city = openData.city, avatarUrl = openData.avatarUrl; // console.log('解密后 data: ', openData)

            _context.prev = 15;
            //1.先去查询数据库是否有该用户的记录，如果没有则是新用户，如果有就是老用户
            sql1 = "select * from user_info where open_id = ?;";
            _context.next = 19;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 19:
            result1 = _context.sent;

            if (result1.length === 0) {
              isNewUser = true;
            } else {
              isNewUser = false;
            } //2.如果不是新用户的话就将数据库的先前的用户数据


            if (isNewUser) {
              _context.next = 27;
              break;
            }

            sql2 = "DELETE FROM user_info WHERE open_id = ?;";
            _context.next = 25;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 25:
            result2 = _context.sent;

            if (result2.affectedRows === 1) {
              isDeleteSuccess = true;
            } else {
              isDeleteSuccess = false;
            }

          case 27:
            if (!(!isNewUser && isDeleteSuccess || isNewUser)) {
              _context.next = 33;
              break;
            }

            sql3 = "INSERT INTO user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?);";
            _context.next = 31;
            return (0, _transformPoolQuery["default"])(sql3, [openid, nickName, gender, country, province, city, avatarUrl]);

          case 31:
            result3 = _context.sent;

            if (result3.affectedRows === 1) {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684\u767B\u5F55\u5F00\u653E\u6570\u636E\u5DF2\u4FDD\u5B58\u5230\u6570\u636E\u5E93\uFF01"));
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                isNewUser: isNewUser
              };
            } else {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684\u767B\u5F55\u5F00\u653E\u6570\u636E\u4FDD\u5B58\u6570\u636E\u5E93\u5931\u8D25\uFF01"));
              ctx.response.status = _userStatus.statusCodeList.fail;
              ctx.response.body = '数据库操作失败！';
            }

          case 33:
            _context.next = 40;
            break;

          case 35:
            _context.prev = 35;
            _context.t0 = _context["catch"](15);
            console.log('/login:数据库操作失败！', _context.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:数据库操作失败！';

          case 40:
            _context.next = 45;
            break;

          case 42:
            console.log('/login:您的签名signature有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您的签名signature有误!';

          case 45:
            _context.next = 50;
            break;

          case 47:
            console.log('/login:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您请求的用户code有误!';

          case 50:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[15, 35]]);
  }));

  return function login(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var register =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(ctx, next) {
    var requestBody, code, selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address, result, openid, sql2, result2;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context2.next = 28;
              break;
            }

            code = requestBody.code, selectedSchool = requestBody.selectedSchool, studentId = requestBody.studentId, education = requestBody.education, grade = requestBody.grade, collage = requestBody.collage, userClass = requestBody.userClass, name = requestBody.name, idCard = requestBody.idCard, phone = requestBody.phone, address = requestBody.address;
            _context2.next = 5;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 5:
            result = _context2.sent;
            openid = result.openid;

            if (!openid) {
              _context2.next = 23;
              break;
            }

            _context2.prev = 8;
            sql2 = "UPDATE user_info SET school = ?," + "id= ?," + "education=?," + "grade=?," + "collage=?," + "class=?," + "user_name=?," + "id_card=?," + "phone=?," + "user_address=?" + "WHERE open_id = ?;";
            _context2.next = 12;
            return (0, _transformPoolQuery["default"])(sql2, [selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address, openid]);

          case 12:
            result2 = _context2.sent;

            if (result2.affectedRows === 1) {
              console.log('/register:用户注册信息插值成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            } else {
              console.log("/register:用户注册信息插值失败！");
              ctx.response.status = _userStatus.statusCodeList.fail;
              ctx.response.body = _userStatus.statusList.fail;
            }

            _context2.next = 21;
            break;

          case 16:
            _context2.prev = 16;
            _context2.t0 = _context2["catch"](8);
            console.log('/register:数据库操作失败！', _context2.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:数据库操作失败！';

          case 21:
            _context2.next = 26;
            break;

          case 23:
            console.log('/register:获取openid失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:获取openid失败！';

          case 26:
            _context2.next = 31;
            break;

          case 28:
            console.log('/register:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:您请求的用户code有误!';

          case 31:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[8, 16]]);
  }));

  return function register(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

app.use(_koaRoute["default"].post('/login', login));
app.use(_koaRoute["default"].post('/register', register));
app.listen(3000);