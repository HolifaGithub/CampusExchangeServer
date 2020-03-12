"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _koa = _interopRequireDefault(require("koa"));

var _koaRoute = _interopRequireDefault(require("koa-route"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _checkSignature = require("./utils/check-signature");

var _WXBizDataCrypt = require("./utils/WXBizDataCrypt");

var _transformPoolQuery = _interopRequireDefault(require("./utils/transformPoolQuery"));

var _getOpenIdAndSessionKey = _interopRequireDefault(require("./utils/getOpenIdAndSessionKey"));

var _uploadCos = _interopRequireDefault(require("./utils/upload-cos"));

var _searchKeyWord = _interopRequireDefault(require("./utils/search-key-word"));

var _miniProgramInfo = require("./static-name/mini-program-info");

var _userStatus = require("./static-name/user-status");

var _https = _interopRequireDefault(require("https"));

var _ws = _interopRequireDefault(require("ws"));

// import bodyParse from 'koa-bodyparser'
var body = require('koa-body');

var app = new _koa["default"]();

var keyContent = _fs["default"].readFileSync(_path["default"].join(__dirname, '../https/2.key'));

var certContent = _fs["default"].readFileSync(_path["default"].join(__dirname, '../https/1.crt'));

var httpsOption = {
  key: keyContent,
  cert: certContent
}; // const server = http.createServer(app.callback()).listen(3000)

var server = _https["default"].createServer(httpsOption, app.callback()).listen(3000);

var wss = new _ws["default"].Server({
  server: server
});
var connectedUser = [];
wss.on('connection', function connection(ws) {
  console.log('ws连接成功！');
  ws.on('message',
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2["default"])(
    /*#__PURE__*/
    _regenerator["default"].mark(function _callee(msg) {
      var result, openid;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _getOpenIdAndSessionKey["default"])(msg);

            case 2:
              result = _context.sent;
              openid = result.openid;

              if (openid || !ws.openId) {
                ws.openId = openid;
              } // wss.clients.forEach((client) => {
              //     console.log(client.openId)
              //     client.send('kkk')
              // })


            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
});
app.use(body({
  multipart: true
})); // app.use(bodyParse())

var login =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(ctx, next) {
    var isNewUser, isDeleteSuccess, requestBody, code, rawData, signature, encryptedData, iv, result, openid, session_key, checkSignatureResult, pc, openData, nickName, gender, country, province, city, avatarUrl, sql1, result1, sql2, result2, sql3, result3, sql4, result4, sql5, result5, sql6, result6;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            isNewUser = true;
            isDeleteSuccess = false;
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context2.next = 64;
              break;
            }

            code = requestBody.code, rawData = requestBody.rawData, signature = requestBody.signature, encryptedData = requestBody.encryptedData, iv = requestBody.iv;
            _context2.next = 7;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 7:
            result = _context2.sent;
            openid = result.openid, session_key = result.session_key;

            if (!(openid && session_key)) {
              _context2.next = 62;
              break;
            }

            //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
            checkSignatureResult = (0, _checkSignature.checkSignature)(signature, rawData, session_key);

            if (!checkSignatureResult) {
              _context2.next = 59;
              break;
            }

            //如果签名一致有效，则调用加密数据解密算法解密出用户的开放数据
            pc = new _WXBizDataCrypt.WXBizDataCrypt(_miniProgramInfo.appId, session_key);
            openData = pc.decryptData(encryptedData, iv);
            nickName = openData.nickName, gender = openData.gender, country = openData.country, province = openData.province, city = openData.city, avatarUrl = openData.avatarUrl; // console.log('解密后 data: ', openData)

            _context2.prev = 15;
            //1.先去查询数据库是否有该用户的记录，如果没有则是新用户，如果有就是老用户
            sql1 = "select * from user_info where open_id = ?;";
            _context2.next = 19;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 19:
            result1 = _context2.sent;

            if (result1.length === 0) {
              isNewUser = true;
            } else {
              isNewUser = false;
            }

            if (!isNewUser) {
              _context2.next = 32;
              break;
            }

            sql2 = "INSERT INTO user_money(open_id) VALUES (?)";
            _context2.next = 25;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 25:
            result2 = _context2.sent;

            if (result2.affectedRows === 1) {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u5DF2\u63D2\u5165user_money\uFF01"));
            } else {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u63D2\u5165user_money\u5931\u8D25\uFF01"));
            }

            sql3 = "INSERT INTO user_order(open_id) VALUES (?)";
            _context2.next = 30;
            return (0, _transformPoolQuery["default"])(sql3, [openid]);

          case 30:
            result3 = _context2.sent;

            if (result3.affectedRows === 1) {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u5DF2\u63D2\u5165user_order\uFF01"));
            } else {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u63D2\u5165user_order\u5931\u8D25\uFF01"));
            }

          case 32:
            if (isNewUser) {
              _context2.next = 38;
              break;
            }

            sql4 = "UPDATE user_info SET nick_name='',gender=0 ,country='',province='',city='',avatar_url='' WHERE open_id = ?;";
            _context2.next = 36;
            return (0, _transformPoolQuery["default"])(sql4, [openid]);

          case 36:
            result4 = _context2.sent;

            if (result4.affectedRows === 1) {
              isDeleteSuccess = true;
            } else {
              isDeleteSuccess = false;
            }

          case 38:
            if (!(!isNewUser && isDeleteSuccess)) {
              _context2.next = 44;
              break;
            }

            sql5 = "UPDATE  user_info SET nick_name=?,gender=?,country=?,province=?,city=?,avatar_url=? WHERE open_id = ?;";
            _context2.next = 42;
            return (0, _transformPoolQuery["default"])(sql5, [nickName, gender, country, province, city, avatarUrl, openid]);

          case 42:
            result5 = _context2.sent;

            if (result5.affectedRows === 1) {
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

          case 44:
            if (!isNewUser) {
              _context2.next = 50;
              break;
            }

            sql6 = "INSERT INTO  user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?);";
            _context2.next = 48;
            return (0, _transformPoolQuery["default"])(sql6, [openid, nickName, gender, country, province, city, avatarUrl]);

          case 48:
            result6 = _context2.sent;

            if (result6.affectedRows === 1) {
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

          case 50:
            _context2.next = 57;
            break;

          case 52:
            _context2.prev = 52;
            _context2.t0 = _context2["catch"](15);
            console.log('/login:数据库操作失败！', _context2.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:数据库操作失败！';

          case 57:
            _context2.next = 62;
            break;

          case 59:
            console.log('/login:您的签名signature有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您的签名signature有误!';

          case 62:
            _context2.next = 67;
            break;

          case 64:
            console.log('/login:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您请求的用户code有误!';

          case 67:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[15, 52]]);
  }));

  return function login(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

var register =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(ctx, next) {
    var requestBody, code, selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address, result, openid, sql2, result2;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context3.next = 28;
              break;
            }

            code = requestBody.code, selectedSchool = requestBody.selectedSchool, studentId = requestBody.studentId, education = requestBody.education, grade = requestBody.grade, collage = requestBody.collage, userClass = requestBody.userClass, name = requestBody.name, idCard = requestBody.idCard, phone = requestBody.phone, address = requestBody.address;
            _context3.next = 5;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 5:
            result = _context3.sent;
            openid = result.openid;

            if (!openid) {
              _context3.next = 23;
              break;
            }

            _context3.prev = 8;
            sql2 = "UPDATE user_info SET school = ?," + "id= ?," + "education=?," + "grade=?," + "collage=?," + "user_class=?," + "user_name=?," + "id_card=?," + "phone=?," + "user_address=?" + "WHERE open_id = ?;";
            _context3.next = 12;
            return (0, _transformPoolQuery["default"])(sql2, [selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address, openid]);

          case 12:
            result2 = _context3.sent;

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

            _context3.next = 21;
            break;

          case 16:
            _context3.prev = 16;
            _context3.t0 = _context3["catch"](8);
            console.log('/register:数据库操作失败！', _context3.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:数据库操作失败！';

          case 21:
            _context3.next = 26;
            break;

          case 23:
            console.log('/register:获取openid失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:获取openid失败！';

          case 26:
            _context3.next = 31;
            break;

          case 28:
            console.log('/register:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/register:您请求的用户code有误!';

          case 31:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[8, 16]]);
  }));

  return function register(_x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

var releaseGoods =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(ctx, next) {
    var requestBody, typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation, orderId, code, orderStatus, result, openid, sql, poolResult, sql2, poolResult2;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            requestBody = ctx.request.body;
            typeOne = requestBody.typeOne, typeTwo = requestBody.typeTwo, typeThree = requestBody.typeThree, nameInput = requestBody.nameInput, goodsNumber = requestBody.goodsNumber, newAndOldDegree = requestBody.newAndOldDegree, mode = requestBody.mode, objectOfPayment = requestBody.objectOfPayment, payForMePrice = requestBody.payForMePrice, payForOtherPrice = requestBody.payForOtherPrice, wantExchangeGoods = requestBody.wantExchangeGoods, describe = requestBody.describe, picsLocation = requestBody.picsLocation, orderId = requestBody.orderId, code = requestBody.code, orderStatus = requestBody.orderStatus;

            if (!code) {
              _context4.next = 30;
              break;
            }

            _context4.next = 5;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 5:
            result = _context4.sent;
            openid = result.openid;

            if (!openid) {
              _context4.next = 25;
              break;
            }

            sql = "INSERT INTO goods(order_id,order_time,order_status,open_id,type_one,type_two,type_three,name_input,goods_number,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,goods_describe,pics_location) VALUES (?,now(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
            _context4.next = 11;
            return (0, _transformPoolQuery["default"])(sql, [orderId, orderStatus, openid, typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation]);

          case 11:
            poolResult = _context4.sent;

            if (!(poolResult.affectedRows === 1)) {
              _context4.next = 20;
              break;
            }

            sql2 = "update user_order set released = released + 1  where open_id =? ";
            _context4.next = 16;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 16:
            poolResult2 = _context4.sent;

            if (poolResult2.affectedRows === 1) {
              console.log('/releasegoods:用户发布商品成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            } else {
              console.log("/releasegoods:用户订单表发布订单数+1失败！");
              ctx.response.status = _userStatus.statusCodeList.fail;
              ctx.response.body = _userStatus.statusList.fail;
            }

            _context4.next = 23;
            break;

          case 20:
            console.log("/releasegoods:用户发布商品失败！");
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = _userStatus.statusList.fail;

          case 23:
            _context4.next = 28;
            break;

          case 25:
            console.log('/releasegoods:获取openid失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/releasegoods:获取openid失败！';

          case 28:
            _context4.next = 33;
            break;

          case 30:
            console.log('/releasegoods:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/releasegoods:您请求的用户code有误!';

          case 33:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function releaseGoods(_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

var releasegoodspics =
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee5(ctx, next) {
    var orderId, file, upLoadCosResult, location;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            orderId = ctx.request.body.orderId;
            file = ctx.request.files.pic;
            _context5.next = 4;
            return (0, _uploadCos["default"])(file, orderId);

          case 4:
            upLoadCosResult = _context5.sent;

            if (upLoadCosResult.statusCode === 200) {
              //如果状态码是200则说明图片上传cos成功
              location = upLoadCosResult.Location;
              console.log('/releasegoodspics:图片上传腾讯云对象存储成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                location: location
              };
            } else {
              console.log('/releasegoodspics:图片上传腾讯云对象存储失败！');
              ctx.response.status = _userStatus.statusCodeList.fail;
              ctx.response.body = '/releasegoodspics:图片上传腾讯云对象存储失败！';
            } // // 创建可读流 
            // const reader = fs.createReadStream(file.path)
            // let filePath = path.join(__dirname, '../upload') + `/${file.name}`
            // // 创建可写流 
            // const upStream = fs.createWriteStream(filePath);
            // // 可读流通过管道写入可写流 
            // reader.pipe(upStream);
            // ctx.response.body = "上传成功";


          case 6:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function releasegoodspics(_x8, _x9) {
    return _ref5.apply(this, arguments);
  };
}();

var getGoodsInfo =
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee6(ctx, next) {
    var _ctx$request$query, code, orderId, result, openid, sql1, poolResult1, salerOpenId, sql2, poolResult2, _poolResult2$, nick_name, avatar_url, school, sql3, poolResult3, _poolResult3$, order_id, order_time, order_status, type_one, type_two, type_three, name_input, goods_number, new_and_old_degree, mode, object_of_payment, pay_for_me_price, pay_for_other_price, want_exchange_goods, goods_describe, pics_location, sql4, poolResult4, isCare, isCollect, isMe, sql5, poolResult5, sql6, poolResult6, _result, _openid, _sql, _poolResult, _poolResult$, _nick_name, _avatar_url, _school, _sql2, _poolResult2, _poolResult2$2, _order_id, _order_time, _order_status, _type_one, _type_two, _type_three, _name_input, _goods_number, _new_and_old_degree, _mode, _object_of_payment, _pay_for_me_price, _pay_for_other_price, _want_exchange_goods, _goods_describe, _pics_location;

    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _ctx$request$query = ctx.request.query, code = _ctx$request$query.code, orderId = _ctx$request$query.orderId;

            if (!(code && orderId.length > 0)) {
              _context6.next = 53;
              break;
            }

            _context6.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context6.sent;
            openid = result.openid;
            _context6.prev = 6;
            sql1 = "SELECT open_id FROM goods WHERE order_id = ?";
            _context6.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 10:
            poolResult1 = _context6.sent;

            if (!(poolResult1.length === 1)) {
              _context6.next = 44;
              break;
            }

            salerOpenId = poolResult1[0].open_id;
            sql2 = "SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;";
            _context6.next = 16;
            return (0, _transformPoolQuery["default"])(sql2, [salerOpenId]);

          case 16:
            poolResult2 = _context6.sent;

            if (!(poolResult2.length === 1)) {
              _context6.next = 44;
              break;
            }

            _poolResult2$ = poolResult2[0], nick_name = _poolResult2$.nick_name, avatar_url = _poolResult2$.avatar_url, school = _poolResult2$.school;
            sql3 = "SELECT * FROM goods WHERE order_id =?";
            _context6.next = 22;
            return (0, _transformPoolQuery["default"])(sql3, [orderId]);

          case 22:
            poolResult3 = _context6.sent;

            if (!(poolResult3.length === 1)) {
              _context6.next = 44;
              break;
            }

            _poolResult3$ = poolResult3[0], order_id = _poolResult3$.order_id, order_time = _poolResult3$.order_time, order_status = _poolResult3$.order_status, type_one = _poolResult3$.type_one, type_two = _poolResult3$.type_two, type_three = _poolResult3$.type_three, name_input = _poolResult3$.name_input, goods_number = _poolResult3$.goods_number, new_and_old_degree = _poolResult3$.new_and_old_degree, mode = _poolResult3$.mode, object_of_payment = _poolResult3$.object_of_payment, pay_for_me_price = _poolResult3$.pay_for_me_price, pay_for_other_price = _poolResult3$.pay_for_other_price, want_exchange_goods = _poolResult3$.want_exchange_goods, goods_describe = _poolResult3$.goods_describe, pics_location = _poolResult3$.pics_location;
            sql4 = "SELECT * FROM user_care WHERE open_id = ? AND concerned_open_id = ?";
            _context6.next = 28;
            return (0, _transformPoolQuery["default"])(sql4, [openid, salerOpenId]);

          case 28:
            poolResult4 = _context6.sent;
            isCare = false;
            isCollect = false;
            isMe = false;

            if (poolResult4.length === 1) {
              isCare = true;
            }

            if (openid === salerOpenId) {
              isMe = true;
            }

            sql5 = "SELECT * FROM user_collect WHERE open_id = ? AND collect_order_id = ?";
            _context6.next = 37;
            return (0, _transformPoolQuery["default"])(sql5, [openid, orderId]);

          case 37:
            poolResult5 = _context6.sent;

            if (poolResult5.length === 1) {
              isCollect = true;
            }

            sql6 = "UPDATE goods SET watched_people = watched_people +1 WHERE order_id = ?";
            _context6.next = 42;
            return (0, _transformPoolQuery["default"])(sql6, [orderId]);

          case 42:
            poolResult6 = _context6.sent;

            if (poolResult6.affectedRows === 1) {
              console.log('/getgoodsinfo:获取商品详情成功！');
              ctx.response.body = {
                status: _userStatus.statusList.success,
                orderId: order_id,
                orderTime: order_time,
                orderStatus: order_status,
                typeOne: type_one,
                typeTwo: type_two,
                typeThree: type_three,
                nameInput: name_input,
                goodsNumber: goods_number,
                newAndOldDegree: new_and_old_degree,
                mode: mode,
                objectOfPayment: object_of_payment,
                payForMePrice: pay_for_me_price,
                payForOtherPrice: pay_for_other_price,
                wantExchangeGoods: want_exchange_goods,
                describe: goods_describe,
                picsLocation: pics_location,
                nickName: nick_name,
                avatarUrl: avatar_url,
                school: school,
                isCare: isCare,
                isCollect: isCollect,
                isMe: isMe
              };
              ctx.response.statusCode = _userStatus.statusCodeList.success;
            }

          case 44:
            _context6.next = 51;
            break;

          case 46:
            _context6.prev = 46;
            _context6.t0 = _context6["catch"](6);
            console.log('/getgoodsinfo:数据库操作失败！', _context6.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getgoodsinfo:数据库操作失败！';

          case 51:
            _context6.next = 82;
            break;

          case 53:
            if (!(code && orderId.length === 0)) {
              _context6.next = 79;
              break;
            }

            _context6.next = 56;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 56:
            _result = _context6.sent;
            _openid = _result.openid;
            _context6.prev = 58;
            _sql = "SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;";
            _context6.next = 62;
            return (0, _transformPoolQuery["default"])(_sql, [_openid]);

          case 62:
            _poolResult = _context6.sent;

            if (!(_poolResult.length === 1)) {
              _context6.next = 70;
              break;
            }

            _poolResult$ = _poolResult[0], _nick_name = _poolResult$.nick_name, _avatar_url = _poolResult$.avatar_url, _school = _poolResult$.school;
            _sql2 = "SELECT * FROM goods WHERE order_id =?";
            _context6.next = 68;
            return (0, _transformPoolQuery["default"])(_sql2, [orderId]);

          case 68:
            _poolResult2 = _context6.sent;

            if (_poolResult2.length === 1) {
              _poolResult2$2 = _poolResult2[0], _order_id = _poolResult2$2.order_id, _order_time = _poolResult2$2.order_time, _order_status = _poolResult2$2.order_status, _type_one = _poolResult2$2.type_one, _type_two = _poolResult2$2.type_two, _type_three = _poolResult2$2.type_three, _name_input = _poolResult2$2.name_input, _goods_number = _poolResult2$2.goods_number, _new_and_old_degree = _poolResult2$2.new_and_old_degree, _mode = _poolResult2$2.mode, _object_of_payment = _poolResult2$2.object_of_payment, _pay_for_me_price = _poolResult2$2.pay_for_me_price, _pay_for_other_price = _poolResult2$2.pay_for_other_price, _want_exchange_goods = _poolResult2$2.want_exchange_goods, _goods_describe = _poolResult2$2.goods_describe, _pics_location = _poolResult2$2.pics_location;
              console.log('/getgoodsinfo:获取商品详情成功！');
              ctx.response.body = {
                status: _userStatus.statusList.success,
                orderId: _order_id,
                orderTime: _order_time,
                orderStatus: _order_status,
                typeOne: _type_one,
                typeTwo: _type_two,
                typeThree: _type_three,
                nameInput: _name_input,
                goodsNumber: _goods_number,
                newAndOldDegree: _new_and_old_degree,
                mode: _mode,
                objectOfPayment: _object_of_payment,
                payForMePrice: _pay_for_me_price,
                payForOtherPrice: _pay_for_other_price,
                wantExchangeGoods: _want_exchange_goods,
                describe: _goods_describe,
                picsLocation: _pics_location,
                nickName: _nick_name,
                avatarUrl: _avatar_url,
                school: _school,
                isMe: true
              };
              ctx.response.statusCode = _userStatus.statusCodeList.success;
            }

          case 70:
            _context6.next = 77;
            break;

          case 72:
            _context6.prev = 72;
            _context6.t1 = _context6["catch"](58);
            console.log('/getgoodsinfo:数据库操作失败！', _context6.t1);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getgoodsinfo:数据库操作失败！';

          case 77:
            _context6.next = 82;
            break;

          case 79:
            console.log('/getgoodsinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getgoodsinfo:您请求的用户code有误!';

          case 82:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[6, 46], [58, 72]]);
  }));

  return function getGoodsInfo(_x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}();

var getUserInfo =
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(ctx, next) {
    var _ctx$request$query2, code, orderId, result, openid, sql1, poolResult1, _poolResult1$, nick_name, gender, country, province, city, avatar_url, school, id, education, grade, collage, user_class, user_name, id_card, phone, user_address;

    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _ctx$request$query2 = ctx.request.query, code = _ctx$request$query2.code, orderId = _ctx$request$query2.orderId;

            if (!(code && !orderId)) {
              _context7.next = 21;
              break;
            }

            _context7.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context7.sent;
            openid = result.openid;
            _context7.prev = 6;
            sql1 = "SELECT * FROM user_info WHERE open_id = ? ";
            _context7.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context7.sent;

            if (poolResult1.length === 1) {
              _poolResult1$ = poolResult1[0], nick_name = _poolResult1$.nick_name, gender = _poolResult1$.gender, country = _poolResult1$.country, province = _poolResult1$.province, city = _poolResult1$.city, avatar_url = _poolResult1$.avatar_url, school = _poolResult1$.school, id = _poolResult1$.id, education = _poolResult1$.education, grade = _poolResult1$.grade, collage = _poolResult1$.collage, user_class = _poolResult1$.user_class, user_name = _poolResult1$.user_name, id_card = _poolResult1$.id_card, phone = _poolResult1$.phone, user_address = _poolResult1$.user_address;
              console.log("/getuserinfo:获取用户信息成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                nickName: nick_name,
                gender: gender,
                country: country,
                province: province,
                city: city,
                avatarUrl: avatar_url,
                school: school,
                id: id,
                education: education,
                grade: grade,
                collage: collage,
                userClass: user_class,
                userName: user_name,
                idCard: id_card,
                phone: phone,
                userAddress: user_address
              };
            }

            _context7.next = 19;
            break;

          case 14:
            _context7.prev = 14;
            _context7.t0 = _context7["catch"](6);
            console.log('/getuserinfo:数据库操作失败！', _context7.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getuserinfo:数据库操作失败！';

          case 19:
            _context7.next = 24;
            break;

          case 21:
            console.log('/getuserinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getuserinfo:您请求的用户code有误!';

          case 24:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[6, 14]]);
  }));

  return function getUserInfo(_x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();

var getMoney =
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(ctx, next) {
    var code, result, openid, sql1, poolResult1, balance;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            code = ctx.request.query.code;

            if (!code) {
              _context8.next = 21;
              break;
            }

            _context8.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context8.sent;
            openid = result.openid;
            _context8.prev = 6;
            sql1 = "SELECT * FROM user_money WHERE open_id = ?";
            _context8.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context8.sent;

            if (poolResult1.length === 1) {
              balance = poolResult1[0].balance;
              console.log("/getmoney:获取用户余额成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                balance: balance
              };
            }

            _context8.next = 19;
            break;

          case 14:
            _context8.prev = 14;
            _context8.t0 = _context8["catch"](6);
            console.log('/getmoney:数据库操作失败！', _context8.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:数据库操作失败！';

          case 19:
            _context8.next = 24;
            break;

          case 21:
            console.log('/getmoney:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:您请求的用户code有误!';

          case 24:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[6, 14]]);
  }));

  return function getMoney(_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();

var getOrderInfo =
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee9(ctx, next) {
    var code, result, openid, sql1, poolResult1, _poolResult1$2, released, _trading, bougth, saled;

    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            code = ctx.request.query.code;

            if (!code) {
              _context9.next = 21;
              break;
            }

            _context9.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context9.sent;
            openid = result.openid;
            _context9.prev = 6;
            sql1 = "SELECT * FROM user_order WHERE open_id = ?";
            _context9.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context9.sent;

            if (poolResult1.length === 1) {
              _poolResult1$2 = poolResult1[0], released = _poolResult1$2.released, _trading = _poolResult1$2.trading, bougth = _poolResult1$2.bougth, saled = _poolResult1$2.saled;
              console.log("/getorderinfo:获取用户订单信息成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                released: released,
                trading: _trading,
                bougth: bougth,
                saled: saled
              };
            }

            _context9.next = 19;
            break;

          case 14:
            _context9.prev = 14;
            _context9.t0 = _context9["catch"](6);
            console.log('/getorderinfo:数据库操作失败！', _context9.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:数据库操作失败！';

          case 19:
            _context9.next = 24;
            break;

          case 21:
            console.log('/getorderinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getorderinfo:您请求的用户code有误!';

          case 24:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[6, 14]]);
  }));

  return function getOrderInfo(_x16, _x17) {
    return _ref9.apply(this, arguments);
  };
}();

var getWaterFall =
/*#__PURE__*/
function () {
  var _ref10 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee11(ctx, next) {
    var _ctx$request$query3, code, page, startIndex, returnDatas, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _ctx$request$query3 = ctx.request.query, code = _ctx$request$query3.code, page = _ctx$request$query3.page;
            startIndex = (page - 1) * 4;
            returnDatas = [];

            if (!code) {
              _context11.next = 31;
              break;
            }

            _context11.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context11.sent;
            openid = result.openid;
            _context11.prev = 8;
            sql1 = "SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE open_id != ? AND order_status = 'released' LIMIT ?,4;";
            _context11.next = 12;
            return (0, _transformPoolQuery["default"])(sql1, [openid, startIndex]);

          case 12:
            poolResult1 = _context11.sent;

            if (!(poolResult1.length > 0)) {
              _context11.next = 19;
              break;
            }

            if (poolResult1.length % 2 !== 0) {
              poolResult1.pop();
            }

            _context11.next = 17;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref11 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee10(data) {
                  var sql2, poolResult2, topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          sql2 = "SELECT nick_name,avatar_url from user_info WHERE open_id =?";
                          _context10.next = 3;
                          return (0, _transformPoolQuery["default"])(sql2, [data.open_id]);

                        case 3:
                          poolResult2 = _context10.sent;

                          if (poolResult2.length === 1) {
                            len = data.pics_location.length;

                            if (len === 0) {
                              topPicSrc = '';
                            } else {
                              topPicSrc = 'https://' + data.pics_location.split(';')[0];
                            }

                            returnDatas.push({
                              orderId: data.order_id,
                              nameInput: data.name_input,
                              newAndOldDegree: data.new_and_old_degree,
                              mode: data.mode,
                              objectOfPayment: data.object_of_payment,
                              payForMePrice: data.pay_for_me_price,
                              payForOtherPrice: data.pay_for_other_price,
                              wantExchangeGoods: data.want_exchange_goods,
                              topPicSrc: topPicSrc,
                              watchedPeople: data.watched_people,
                              nickName: poolResult2[0].nick_name,
                              avatarUrl: poolResult2[0].avatar_url
                            });
                          }

                          if (returnDatas.length === poolResult1.length) {
                            resolve();
                          }

                        case 6:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee10);
                }));

                return function (_x20) {
                  return _ref11.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/getwaterfall:获取waterfall成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: returnDatas
              };
            });

          case 17:
            _context11.next = 22;
            break;

          case 19:
            console.log("/getwaterfall:获取waterfall成功，但无数据！");
            ctx.response.statusCode = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: _userStatus.statusList.success,
              returnDatas: returnDatas
            };

          case 22:
            _context11.next = 29;
            break;

          case 24:
            _context11.prev = 24;
            _context11.t0 = _context11["catch"](8);
            console.log('/getwaterfall:数据库操作失败！', _context11.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getwaterfall:数据库操作失败！';

          case 29:
            _context11.next = 34;
            break;

          case 31:
            console.log('/getwaterfall:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getwaterfall:您请求的用户code有误!';

          case 34:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, null, [[8, 24]]);
  }));

  return function getWaterFall(_x18, _x19) {
    return _ref10.apply(this, arguments);
  };
}();

var pay =
/*#__PURE__*/
function () {
  var _ref12 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee12(ctx, next) {
    var _ctx$request$body, code, orderId, payForMePrice, payForOtherPrice, result, openid, sql1, poolResult1, balance, sql2, poolResult2, sql3, poolResult3, salerOpenId, sql4, poolResult4, sql5, poolResult5, sql6, poolResult6, _sql3, _poolResult3, _salerOpenId, _sql4, _poolResult4, _balance, _sql5, _poolResult5, _sql6, _poolResult6, _sql7, _poolResult7, _sql8, _poolResult8;

    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _ctx$request$body = ctx.request.body, code = _ctx$request$body.code, orderId = _ctx$request$body.orderId, payForMePrice = _ctx$request$body.payForMePrice, payForOtherPrice = _ctx$request$body.payForOtherPrice; // console.log(payForMePrice,payForMePrice===0,payForOtherPrice,payForOtherPrice===0)

            if (!code) {
              _context12.next = 94;
              break;
            }

            _context12.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context12.sent;
            openid = result.openid;
            _context12.prev = 6;

            if (!(payForMePrice !== 0)) {
              _context12.next = 46;
              break;
            }

            //查询买家的余额
            sql1 = "SELECT balance FROM user_money WHERE open_id =?";
            _context12.next = 11;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 11:
            poolResult1 = _context12.sent;

            if (!(poolResult1.length === 1)) {
              _context12.next = 46;
              break;
            }

            balance = poolResult1[0].balance;

            if (!(balance >= payForMePrice)) {
              _context12.next = 46;
              break;
            }

            //买家的余额减去商品的价格，支付的总额加上买的商品的价格
            sql2 = "UPDATE  user_money SET balance = balance - ?,pay=pay + ?  where open_id =? ";
            _context12.next = 18;
            return (0, _transformPoolQuery["default"])(sql2, [payForMePrice, payForMePrice, openid]);

          case 18:
            poolResult2 = _context12.sent;

            if (!(poolResult2.affectedRows === 1)) {
              _context12.next = 43;
              break;
            }

            //通过order_id查询卖家的open_id
            sql3 = "SELECT open_id FROM goods WHERE order_id =?";
            _context12.next = 23;
            return (0, _transformPoolQuery["default"])(sql3, [orderId]);

          case 23:
            poolResult3 = _context12.sent;

            if (!(poolResult3.length === 1)) {
              _context12.next = 41;
              break;
            }

            salerOpenId = poolResult3[0].open_id; //更新商品表设置商品的状态为tarding，设置买家的open_id

            sql4 = "UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?";
            _context12.next = 29;
            return (0, _transformPoolQuery["default"])(sql4, ['trading', openid, orderId]);

          case 29:
            poolResult4 = _context12.sent;

            if (!(poolResult4.affectedRows === 1)) {
              _context12.next = 41;
              break;
            }

            //更新买家order表的trading数量+1
            sql5 = "UPDATE user_order SET trading = trading +1 WHERE open_id =?";
            _context12.next = 34;
            return (0, _transformPoolQuery["default"])(sql5, [openid]);

          case 34:
            poolResult5 = _context12.sent;

            if (!(poolResult5.affectedRows === 1)) {
              _context12.next = 41;
              break;
            }

            //更新卖家order表released数量-1，trading数量+1
            sql6 = "UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?";
            _context12.next = 39;
            return (0, _transformPoolQuery["default"])(sql6, [salerOpenId]);

          case 39:
            poolResult6 = _context12.sent;

            if (poolResult6.affectedRows === 1) {
              console.log('/pay:支付成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 41:
            _context12.next = 46;
            break;

          case 43:
            console.log('/pay:余额不足，支付失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail,
              msg: '支付失败！您的余额不足，请充值！'
            };

          case 46:
            if (!(payForOtherPrice !== 0)) {
              _context12.next = 85;
              break;
            }

            //查询卖家的open_id
            _sql3 = "SELECT open_id FROM goods WHERE order_id =?";
            _context12.next = 50;
            return (0, _transformPoolQuery["default"])(_sql3, [orderId]);

          case 50:
            _poolResult3 = _context12.sent;

            if (!(_poolResult3.length === 1)) {
              _context12.next = 85;
              break;
            }

            _salerOpenId = _poolResult3[0].open_id; //查询卖家money表的余额

            _sql4 = "SELECT balance FROM user_money WHERE open_id =?";
            _context12.next = 56;
            return (0, _transformPoolQuery["default"])(_sql4, [_salerOpenId]);

          case 56:
            _poolResult4 = _context12.sent;

            if (!(_poolResult4.length === 1)) {
              _context12.next = 85;
              break;
            }

            _balance = _poolResult4[0].balance;

            if (!(_balance >= payForOtherPrice)) {
              _context12.next = 82;
              break;
            }

            //如果余额大于要支付给买家的钱的话就将其余额减去给买家的钱，支付总额加上给买家的钱
            _sql5 = "UPDATE user_money SET balance = balance - ? ,pay = pay + ? WHERE open_id = ?";
            _context12.next = 63;
            return (0, _transformPoolQuery["default"])(_sql5, [payForOtherPrice, payForOtherPrice, _salerOpenId]);

          case 63:
            _poolResult5 = _context12.sent;

            if (!(_poolResult5.affectedRows === 1)) {
              _context12.next = 80;
              break;
            }

            //更新商品表设置商品状态为trading，设置买家的open_id
            _sql6 = "UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?";
            _context12.next = 68;
            return (0, _transformPoolQuery["default"])(_sql6, ['trading', openid, orderId]);

          case 68:
            _poolResult6 = _context12.sent;

            if (!(_poolResult6.affectedRows === 1)) {
              _context12.next = 80;
              break;
            }

            //更新买家order表的trading数量+1
            _sql7 = "UPDATE user_order SET trading = trading +1 WHERE open_id =?";
            _context12.next = 73;
            return (0, _transformPoolQuery["default"])(_sql7, [openid]);

          case 73:
            _poolResult7 = _context12.sent;

            if (!(_poolResult7.affectedRows === 1)) {
              _context12.next = 80;
              break;
            }

            //更新卖家order表released数量-1，trading数量+1
            _sql8 = "UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?";
            _context12.next = 78;
            return (0, _transformPoolQuery["default"])(_sql8, [_salerOpenId]);

          case 78:
            _poolResult8 = _context12.sent;

            if (_poolResult8.affectedRows === 1) {
              console.log('/pay:支付成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 80:
            _context12.next = 85;
            break;

          case 82:
            console.log('/pay:余额不足，支付失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail,
              msg: '交易失败，对方的余额不足以支付给您！'
            };

          case 85:
            _context12.next = 92;
            break;

          case 87:
            _context12.prev = 87;
            _context12.t0 = _context12["catch"](6);
            console.log('/pay:数据库操作失败！', _context12.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/pay:数据库操作失败！';

          case 92:
            _context12.next = 97;
            break;

          case 94:
            console.log('/pay:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/pay:您请求的用户code有误!';

          case 97:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, null, [[6, 87]]);
  }));

  return function pay(_x21, _x22) {
    return _ref12.apply(this, arguments);
  };
}();

var trading =
/*#__PURE__*/
function () {
  var _ref13 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee13(ctx, next) {
    var orderId, sql1, poolResult1, openId, buyOpenId, sql2, poolResult2, salederPhone, salederAddress, sql3, poolResult3, buierPhone, buierAddress, buierAvatarUrl, buierNickName, orderCode;
    return _regenerator["default"].wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            orderId = ctx.request.query.orderId;

            if (!orderId) {
              _context13.next = 31;
              break;
            }

            _context13.prev = 2;
            sql1 = "SELECT open_id,buy_open_id,pay_for_me_price,pay_for_other_price FROM goods WHERE order_id = ?";
            _context13.next = 6;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 6:
            poolResult1 = _context13.sent;

            if (!(poolResult1.length === 1)) {
              _context13.next = 22;
              break;
            }

            openId = poolResult1[0].open_id;
            buyOpenId = poolResult1[0].buy_open_id;
            sql2 = "SELECT phone,user_address FROM user_info WHERE open_id = ?";
            _context13.next = 13;
            return (0, _transformPoolQuery["default"])(sql2, [openId]);

          case 13:
            poolResult2 = _context13.sent;

            if (!(poolResult2.length === 1)) {
              _context13.next = 22;
              break;
            }

            salederPhone = poolResult2[0].phone;
            salederAddress = poolResult2[0].user_address;
            sql3 = "SELECT phone,user_address,avatar_url,nick_name FROM user_info WHERE open_id = ?";
            _context13.next = 20;
            return (0, _transformPoolQuery["default"])(sql3, [buyOpenId]);

          case 20:
            poolResult3 = _context13.sent;

            if (poolResult3.length === 1) {
              buierPhone = poolResult3[0].phone;
              buierAddress = poolResult3[0].user_address;
              buierAvatarUrl = poolResult3[0].avatar_url;
              buierNickName = poolResult3[0].nick_name;
              orderCode = orderId;
              console.log('/trading:交易成功');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                salederPhone: salederPhone,
                salederAddress: salederAddress,
                buierPhone: buierPhone,
                buierAddress: buierAddress,
                buierAvatarUrl: buierAvatarUrl,
                buierNickName: buierNickName,
                orderCode: orderCode
              };
            }

          case 22:
            _context13.next = 29;
            break;

          case 24:
            _context13.prev = 24;
            _context13.t0 = _context13["catch"](2);
            console.log('/trading:数据库操作失败！', _context13.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/trading:数据库操作失败！';

          case 29:
            _context13.next = 34;
            break;

          case 31:
            console.log('/trading:您请求的用户orderId有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/trading:您请求的用户orderId有误!';

          case 34:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, null, [[2, 24]]);
  }));

  return function trading(_x23, _x24) {
    return _ref13.apply(this, arguments);
  };
}();

var search =
/*#__PURE__*/
function () {
  var _ref14 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee15(ctx, next) {
    var _ctx$request$query4, value, page, searchStart, startIndex, returnDatas, valueArray, sql1, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArray, poolResult1, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, row, searchResult, sql2, poolResult2;

    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _ctx$request$query4 = ctx.request.query, value = _ctx$request$query4.value, page = _ctx$request$query4.page, searchStart = _ctx$request$query4.searchStart;
            startIndex = (page - 1) * 6;
            returnDatas = [];

            if (!(value.length > 0)) {
              _context15.next = 56;
              break;
            }

            valueArray = value.split(" ");
            _context15.prev = 5;
            sql1 = "SELECT type_one,type_two,type_three,name_input FROM goods";
            typeOneNameArray = [];
            typeTwoNameArray = [];
            typeThreeNameArray = [];
            nameInputArray = [];
            _context15.next = 13;
            return (0, _transformPoolQuery["default"])(sql1, []);

          case 13:
            poolResult1 = _context15.sent;

            if (!(poolResult1.length > 0)) {
              _context15.next = 47;
              break;
            }

            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context15.prev = 18;

            for (_iterator = poolResult1[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              row = _step.value;

              if (row.type_one) {
                typeOneNameArray.push(row.type_one);
              }

              if (row.type_two) {
                typeTwoNameArray.push(row.type_two);
              }

              if (row.type_three) {
                typeThreeNameArray.push(row.type_three);
              }

              if (row.name_input) {
                nameInputArray.push(row.name_input);
              }
            } // console.log(typeOneNameArray,typeTwoNameArray,typeThreeNameArray,nameInputArray)


            _context15.next = 26;
            break;

          case 22:
            _context15.prev = 22;
            _context15.t0 = _context15["catch"](18);
            _didIteratorError = true;
            _iteratorError = _context15.t0;

          case 26:
            _context15.prev = 26;
            _context15.prev = 27;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 29:
            _context15.prev = 29;

            if (!_didIteratorError) {
              _context15.next = 32;
              break;
            }

            throw _iteratorError;

          case 32:
            return _context15.finish(29);

          case 33:
            return _context15.finish(26);

          case 34:
            searchResult = (0, _searchKeyWord["default"])(valueArray, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArray, searchStart);

            if (!searchResult) {
              _context15.next = 44;
              break;
            }

            sql2 = "SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE ".concat(searchResult.col, " = ? AND order_status = 'released' LIMIT ?,6;");
            _context15.next = 39;
            return (0, _transformPoolQuery["default"])(sql2, [searchResult.value, startIndex]);

          case 39:
            poolResult2 = _context15.sent;
            _context15.next = 42;
            return new Promise(function (resolve, reject) {
              poolResult2.map(
              /*#__PURE__*/
              function () {
                var _ref15 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee14(data) {
                  var sql3, poolResult3, topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee14$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          sql3 = "SELECT nick_name,avatar_url from user_info WHERE open_id =?";
                          _context14.next = 3;
                          return (0, _transformPoolQuery["default"])(sql3, [data.open_id]);

                        case 3:
                          poolResult3 = _context14.sent;

                          if (poolResult3.length === 1) {
                            len = data.pics_location.length;

                            if (len === 0) {
                              topPicSrc = '';
                            } else {
                              topPicSrc = 'https://' + data.pics_location.split(';')[0];
                            }

                            returnDatas.push({
                              orderId: data.order_id,
                              nameInput: data.name_input,
                              newAndOldDegree: data.new_and_old_degree,
                              mode: data.mode,
                              objectOfPayment: data.object_of_payment,
                              payForMePrice: data.pay_for_me_price,
                              payForOtherPrice: data.pay_for_other_price,
                              wantExchangeGoods: data.want_exchange_goods,
                              topPicSrc: topPicSrc,
                              watchedPeople: data.watched_people,
                              nickName: poolResult3[0].nick_name,
                              avatarUrl: poolResult3[0].avatar_url
                            });
                          }

                          if (returnDatas.length === poolResult2.length) {
                            resolve();
                          }

                        case 6:
                        case "end":
                          return _context14.stop();
                      }
                    }
                  }, _callee14);
                }));

                return function (_x27) {
                  return _ref15.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/search:搜索成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: returnDatas
              };
            });

          case 42:
            _context15.next = 47;
            break;

          case 44:
            console.log('/search:搜索结果为空！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail,
              msg: ' /search:搜索结果为空！'
            };

          case 47:
            _context15.next = 54;
            break;

          case 49:
            _context15.prev = 49;
            _context15.t1 = _context15["catch"](5);
            console.log('/search:数据库操作失败！', _context15.t1);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/search:数据库操作失败！';

          case 54:
            _context15.next = 59;
            break;

          case 56:
            console.log('/search:用户的搜索词为空!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/search:用户的搜索词为空!';

          case 59:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15, null, [[5, 49], [18, 22, 26, 34], [27,, 29, 33]]);
  }));

  return function search(_x25, _x26) {
    return _ref14.apply(this, arguments);
  };
}();

var orderList =
/*#__PURE__*/
function () {
  var _ref16 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee19(ctx, next) {
    var _ctx$request$query5, code, orderStatus, orderInfo, page, startIndex, orderListReturnDatas, result, openid, sql1, poolResult1, _sql9, _poolResult9, _sql10, _poolResult10;

    return _regenerator["default"].wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _ctx$request$query5 = ctx.request.query, code = _ctx$request$query5.code, orderStatus = _ctx$request$query5.orderStatus, orderInfo = _ctx$request$query5.orderInfo, page = _ctx$request$query5.page;
            startIndex = (page - 1) * 7;
            orderListReturnDatas = [];

            if (!code) {
              _context19.next = 57;
              break;
            }

            _context19.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context19.sent;
            openid = result.openid;
            _context19.prev = 8;

            if (!(orderInfo == 'released' || orderInfo == 'saled')) {
              _context19.next = 22;
              break;
            }

            sql1 = "SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE open_id = ? AND order_status = ? LIMIT ?,7 ";
            _context19.next = 13;
            return (0, _transformPoolQuery["default"])(sql1, [openid, orderStatus, startIndex]);

          case 13:
            poolResult1 = _context19.sent;

            if (!(poolResult1.length > 0)) {
              _context19.next = 19;
              break;
            }

            _context19.next = 17;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref17 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee16(data) {
                  var topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee16$(_context16) {
                    while (1) {
                      switch (_context16.prev = _context16.next) {
                        case 0:
                          len = data.pics_location.length;

                          if (len === 0) {
                            topPicSrc = '';
                          } else {
                            topPicSrc = 'https://' + data.pics_location.split(';')[0];
                          }

                          orderListReturnDatas.push({
                            orderId: data.order_id,
                            nameInput: data.name_input,
                            newAndOldDegree: data.new_and_old_degree,
                            topPicSrc: topPicSrc,
                            typeOne: data.type_one,
                            typeTwo: data.type_two,
                            typeThree: data.type_three,
                            goodsNumber: data.goods_number
                          });

                          if (orderListReturnDatas.length === poolResult1.length) {
                            resolve();
                          }

                        case 4:
                        case "end":
                          return _context16.stop();
                      }
                    }
                  }, _callee16);
                }));

                return function (_x30) {
                  return _ref17.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/orderlist:获取orderlist成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: orderListReturnDatas,
                orderStatus: orderStatus,
                orderInfo: orderInfo
              };
            });

          case 17:
            _context19.next = 22;
            break;

          case 19:
            console.log('/orderlist:该用户此状态下无订单！');
            ctx.response.status = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: 'success',
              returnDatas: orderListReturnDatas,
              orderStatus: orderStatus,
              orderInfo: orderInfo
            };

          case 22:
            if (!(orderInfo == 'trading')) {
              _context19.next = 35;
              break;
            }

            _sql9 = "SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE (buy_open_id = ? OR open_id = ?)AND order_status = ?";
            _context19.next = 26;
            return (0, _transformPoolQuery["default"])(_sql9, [openid, openid, orderStatus]);

          case 26:
            _poolResult9 = _context19.sent;

            if (!(_poolResult9.length > 0)) {
              _context19.next = 32;
              break;
            }

            _context19.next = 30;
            return new Promise(function (resolve, reject) {
              _poolResult9.map(
              /*#__PURE__*/
              function () {
                var _ref18 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee17(data) {
                  var topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee17$(_context17) {
                    while (1) {
                      switch (_context17.prev = _context17.next) {
                        case 0:
                          len = data.pics_location.length;

                          if (len === 0) {
                            topPicSrc = '';
                          } else {
                            topPicSrc = 'https://' + data.pics_location.split(';')[0];
                          }

                          orderListReturnDatas.push({
                            orderId: data.order_id,
                            nameInput: data.name_input,
                            newAndOldDegree: data.new_and_old_degree,
                            topPicSrc: topPicSrc,
                            typeOne: data.type_one,
                            typeTwo: data.type_two,
                            typeThree: data.type_three,
                            goodsNumber: data.goods_number
                          });

                          if (orderListReturnDatas.length === _poolResult9.length) {
                            resolve();
                          }

                        case 4:
                        case "end":
                          return _context17.stop();
                      }
                    }
                  }, _callee17);
                }));

                return function (_x31) {
                  return _ref18.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/orderlist:获取orderlist成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: orderListReturnDatas,
                orderStatus: orderStatus,
                orderInfo: orderInfo
              };
            });

          case 30:
            _context19.next = 35;
            break;

          case 32:
            console.log('/orderlist:该用户此状态下无订单！');
            ctx.response.status = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: 'success',
              returnDatas: orderListReturnDatas
            };

          case 35:
            if (!(orderInfo == 'bougth')) {
              _context19.next = 48;
              break;
            }

            _sql10 = "SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE buy_open_id = ? AND order_status = ?";
            _context19.next = 39;
            return (0, _transformPoolQuery["default"])(_sql10, [openid, orderStatus]);

          case 39:
            _poolResult10 = _context19.sent;

            if (!(_poolResult10.length > 0)) {
              _context19.next = 45;
              break;
            }

            _context19.next = 43;
            return new Promise(function (resolve, reject) {
              _poolResult10.map(
              /*#__PURE__*/
              function () {
                var _ref19 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee18(data) {
                  var topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee18$(_context18) {
                    while (1) {
                      switch (_context18.prev = _context18.next) {
                        case 0:
                          len = data.pics_location.length;

                          if (len === 0) {
                            topPicSrc = '';
                          } else {
                            topPicSrc = 'https://' + data.pics_location.split(';')[0];
                          }

                          orderListReturnDatas.push({
                            orderId: data.order_id,
                            nameInput: data.name_input,
                            newAndOldDegree: data.new_and_old_degree,
                            topPicSrc: topPicSrc,
                            typeOne: data.type_one,
                            typeTwo: data.type_two,
                            typeThree: data.type_three,
                            goodsNumber: data.goods_number
                          });

                          if (orderListReturnDatas.length === _poolResult10.length) {
                            resolve();
                          }

                        case 4:
                        case "end":
                          return _context18.stop();
                      }
                    }
                  }, _callee18);
                }));

                return function (_x32) {
                  return _ref19.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/orderlist:获取orderlist成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: orderListReturnDatas,
                orderStatus: orderStatus,
                orderInfo: orderInfo
              };
            });

          case 43:
            _context19.next = 48;
            break;

          case 45:
            console.log('/orderlist:该用户此状态下无订单！');
            ctx.response.status = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: 'success',
              returnDatas: orderListReturnDatas
            };

          case 48:
            _context19.next = 55;
            break;

          case 50:
            _context19.prev = 50;
            _context19.t0 = _context19["catch"](8);
            console.log('/orderlist:数据库操作失败！', _context19.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/orderlist:数据库操作失败！';

          case 55:
            _context19.next = 60;
            break;

          case 57:
            console.log('/orderlist:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/orderlist:您请求的用户code有误!';

          case 60:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19, null, [[8, 50]]);
  }));

  return function orderList(_x28, _x29) {
    return _ref16.apply(this, arguments);
  };
}();

var recharge =
/*#__PURE__*/
function () {
  var _ref20 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee20(ctx, next) {
    var _ctx$request$body2, code, value, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _ctx$request$body2 = ctx.request.body, code = _ctx$request$body2.code, value = _ctx$request$body2.value;

            if (!code) {
              _context20.next = 21;
              break;
            }

            _context20.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context20.sent;
            openid = result.openid;
            _context20.prev = 6;
            sql1 = "UPDATE user_money SET balance = balance + ? WHERE open_id =? ";
            _context20.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [value, openid]);

          case 10:
            poolResult1 = _context20.sent;

            if (poolResult1.affectedRows === 1) {
              console.log("/recharge:充值成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

            _context20.next = 19;
            break;

          case 14:
            _context20.prev = 14;
            _context20.t0 = _context20["catch"](6);
            console.log('/recharge:数据库操作失败！', _context20.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/recharge:数据库操作失败！';

          case 19:
            _context20.next = 24;
            break;

          case 21:
            console.log('/recharge:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/recharge:您请求的用户code有误!';

          case 24:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20, null, [[6, 14]]);
  }));

  return function recharge(_x33, _x34) {
    return _ref20.apply(this, arguments);
  };
}();

var care =
/*#__PURE__*/
function () {
  var _ref21 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee21(ctx, next) {
    var _ctx$request$body3, code, orderId, result, openid, sql1, poolResult1, concernedOpenId, sql2, poolResult2, sql3, poolResult3, sql4, poolResult4;

    return _regenerator["default"].wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _ctx$request$body3 = ctx.request.body, code = _ctx$request$body3.code, orderId = _ctx$request$body3.orderId;

            if (!code) {
              _context21.next = 39;
              break;
            }

            _context21.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context21.sent;
            openid = result.openid;
            _context21.prev = 6;
            sql1 = "SELECT open_id FROM goods WHERE order_id = ?";
            _context21.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 10:
            poolResult1 = _context21.sent;

            if (!(poolResult1.length === 1)) {
              _context21.next = 30;
              break;
            }

            concernedOpenId = poolResult1[0].open_id;
            sql2 = "SELECT * FROM user_care WHERE open_id = ? AND concerned_open_id = ?";
            _context21.next = 16;
            return (0, _transformPoolQuery["default"])(sql2, [openid, concernedOpenId]);

          case 16:
            poolResult2 = _context21.sent;

            if (!(poolResult2.length === 1)) {
              _context21.next = 25;
              break;
            }

            sql3 = "DELETE FROM user_care WHERE open_id = ? AND concerned_open_id = ?";
            _context21.next = 21;
            return (0, _transformPoolQuery["default"])(sql3, [openid, concernedOpenId]);

          case 21:
            poolResult3 = _context21.sent;

            if (poolResult3.affectedRows === 1) {
              console.log("/care:取消关注成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

            _context21.next = 30;
            break;

          case 25:
            sql4 = "INSERT INTO user_care(open_id,concerned_open_id,concerned_order_id) VALUES (?,?,?)";
            _context21.next = 28;
            return (0, _transformPoolQuery["default"])(sql4, [openid, concernedOpenId, orderId]);

          case 28:
            poolResult4 = _context21.sent;

            if (poolResult4.affectedRows === 1) {
              console.log("/care:关注成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 30:
            _context21.next = 37;
            break;

          case 32:
            _context21.prev = 32;
            _context21.t0 = _context21["catch"](6);
            console.log('/care:数据库操作失败！', _context21.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/care:数据库操作失败！';

          case 37:
            _context21.next = 42;
            break;

          case 39:
            console.log('/care:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/care:您请求的用户code有误!';

          case 42:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21, null, [[6, 32]]);
  }));

  return function care(_x35, _x36) {
    return _ref21.apply(this, arguments);
  };
}();

var getCareList =
/*#__PURE__*/
function () {
  var _ref22 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee23(ctx, next) {
    var _ctx$request$query6, code, page, startIndex, returnDatas, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _ctx$request$query6 = ctx.request.query, code = _ctx$request$query6.code, page = _ctx$request$query6.page;
            startIndex = (page - 1) * 8;
            returnDatas = [];

            if (!code) {
              _context23.next = 30;
              break;
            }

            _context23.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context23.sent;
            openid = result.openid;
            _context23.prev = 8;
            sql1 = "SELECT concerned_open_id,concerned_order_id FROM user_care WHERE open_id = ?";
            _context23.next = 12;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 12:
            poolResult1 = _context23.sent;

            if (!(poolResult1.length > 0)) {
              _context23.next = 18;
              break;
            }

            _context23.next = 16;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref23 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee22(data, index) {
                  var concernedOpenId, concernedOrderId, sql2, poolResult2;
                  return _regenerator["default"].wrap(function _callee22$(_context22) {
                    while (1) {
                      switch (_context22.prev = _context22.next) {
                        case 0:
                          concernedOpenId = data.concerned_open_id;
                          concernedOrderId = data.concerned_order_id;
                          sql2 = "SELECT avatar_url,nick_name,collage,user_class FROM user_info WHERE open_id = ? LIMIT ?,8";
                          _context22.next = 5;
                          return (0, _transformPoolQuery["default"])(sql2, [concernedOpenId, startIndex]);

                        case 5:
                          poolResult2 = _context22.sent;

                          if (poolResult2.length === 1) {
                            returnDatas.push({
                              nickName: poolResult2[0].nick_name,
                              avatarUrl: poolResult2[0].avatar_url,
                              collage: poolResult2[0].collage,
                              userClass: poolResult2[0].user_class,
                              concernedOrderId: concernedOrderId
                            });
                          }

                          if (returnDatas.length === poolResult1.length) {
                            resolve();
                          }

                        case 8:
                        case "end":
                          return _context22.stop();
                      }
                    }
                  }, _callee22);
                }));

                return function (_x39, _x40) {
                  return _ref23.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/getCareList:查询关注列表成功");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: returnDatas
              };
            });

          case 16:
            _context23.next = 21;
            break;

          case 18:
            console.log("/getCareList:查询关注列表成功，但无数据！");
            ctx.response.statusCode = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: _userStatus.statusList.success
            };

          case 21:
            _context23.next = 28;
            break;

          case 23:
            _context23.prev = 23;
            _context23.t0 = _context23["catch"](8);
            console.log('/getCareList:数据库操作失败！', _context23.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getCareList:数据库操作失败！';

          case 28:
            _context23.next = 33;
            break;

          case 30:
            console.log('/getCareList:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getCareList:您请求的用户code有误!';

          case 33:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23, null, [[8, 23]]);
  }));

  return function getCareList(_x37, _x38) {
    return _ref22.apply(this, arguments);
  };
}();

var collect =
/*#__PURE__*/
function () {
  var _ref24 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee24(ctx, next) {
    var _ctx$request$body4, code, orderId, result, openid, sql1, poolResult1, sql2, poolResult2, sql3, poolResult3;

    return _regenerator["default"].wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _ctx$request$body4 = ctx.request.body, code = _ctx$request$body4.code, orderId = _ctx$request$body4.orderId;

            if (!code) {
              _context24.next = 33;
              break;
            }

            _context24.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context24.sent;
            openid = result.openid;
            _context24.prev = 6;
            sql1 = "SELECT * FROM user_collect WHERE open_id = ? AND collect_order_id = ?";
            _context24.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid, orderId]);

          case 10:
            poolResult1 = _context24.sent;

            if (!(poolResult1.length === 1)) {
              _context24.next = 19;
              break;
            }

            sql2 = "DELETE FROM user_collect WHERE open_id = ? AND collect_order_id = ?";
            _context24.next = 15;
            return (0, _transformPoolQuery["default"])(sql2, [openid, orderId]);

          case 15:
            poolResult2 = _context24.sent;

            if (poolResult2.affectedRows === 1) {
              console.log("/collect:取消收藏成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

            _context24.next = 24;
            break;

          case 19:
            sql3 = "INSERT INTO user_collect(open_id,collect_order_id) VALUES (?,?)";
            _context24.next = 22;
            return (0, _transformPoolQuery["default"])(sql3, [openid, orderId]);

          case 22:
            poolResult3 = _context24.sent;

            if (poolResult3.affectedRows === 1) {
              console.log("/collect:收藏成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 24:
            _context24.next = 31;
            break;

          case 26:
            _context24.prev = 26;
            _context24.t0 = _context24["catch"](6);
            console.log('/collect:数据库操作失败！', _context24.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/collect:数据库操作失败！';

          case 31:
            _context24.next = 36;
            break;

          case 33:
            console.log('/collect:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/collect:您请求的用户code有误!';

          case 36:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24, null, [[6, 26]]);
  }));

  return function collect(_x41, _x42) {
    return _ref24.apply(this, arguments);
  };
}();

var getCollectList =
/*#__PURE__*/
function () {
  var _ref25 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee26(ctx, next) {
    var _ctx$request$query7, code, page, startIndex, returnDatas, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _ctx$request$query7 = ctx.request.query, code = _ctx$request$query7.code, page = _ctx$request$query7.page;
            startIndex = (page - 1) * 8;
            returnDatas = [];

            if (!code) {
              _context26.next = 30;
              break;
            }

            _context26.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context26.sent;
            openid = result.openid;
            _context26.prev = 8;
            sql1 = "SELECT collect_order_id FROM user_collect WHERE open_id = ?";
            _context26.next = 12;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 12:
            poolResult1 = _context26.sent;

            if (!(poolResult1.length > 0)) {
              _context26.next = 18;
              break;
            }

            _context26.next = 16;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref26 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee25(data, index) {
                  var collectOrderId, sql2, poolResult2, topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee25$(_context25) {
                    while (1) {
                      switch (_context25.prev = _context25.next) {
                        case 0:
                          collectOrderId = data.collect_order_id;
                          sql2 = "SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE order_id = ? LIMIT ?,8";
                          _context25.next = 4;
                          return (0, _transformPoolQuery["default"])(sql2, [collectOrderId, startIndex]);

                        case 4:
                          poolResult2 = _context25.sent;

                          if (poolResult2.length === 1) {
                            len = poolResult2[0].pics_location.length;

                            if (len === 0) {
                              topPicSrc = '';
                            } else {
                              topPicSrc = 'https://' + poolResult2[0].pics_location.split(';')[0];
                            }

                            returnDatas.push({
                              orderId: poolResult2[0].order_id,
                              nameInput: poolResult2[0].name_input,
                              newAndOldDegree: poolResult2[0].new_and_old_degree,
                              topPicSrc: topPicSrc,
                              typeOne: poolResult2[0].type_one,
                              typeTwo: poolResult2[0].type_two,
                              typeThree: poolResult2[0].type_three,
                              goodsNumber: poolResult2[0].goods_number
                            });
                          }

                          if (returnDatas.length === poolResult1.length) {
                            resolve();
                          }

                        case 7:
                        case "end":
                          return _context25.stop();
                      }
                    }
                  }, _callee25);
                }));

                return function (_x45, _x46) {
                  return _ref26.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/getCareList:查询收藏列表成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: returnDatas
              };
            });

          case 16:
            _context26.next = 21;
            break;

          case 18:
            console.log("/getCollectList:查询收藏列表成功，但无数据！");
            ctx.response.statusCode = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: _userStatus.statusList.success
            };

          case 21:
            _context26.next = 28;
            break;

          case 23:
            _context26.prev = 23;
            _context26.t0 = _context26["catch"](8);
            console.log('/getCollectList:数据库操作失败！', _context26.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getCollectList:数据库操作失败！';

          case 28:
            _context26.next = 33;
            break;

          case 30:
            console.log('/getCollectList:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getCollectList:您请求的用户code有误!';

          case 33:
          case "end":
            return _context26.stop();
        }
      }
    }, _callee26, null, [[8, 23]]);
  }));

  return function getCollectList(_x43, _x44) {
    return _ref25.apply(this, arguments);
  };
}();

var tradingScanCode =
/*#__PURE__*/
function () {
  var _ref27 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee27(ctx, next) {
    var _ctx$request$body5, code, scanResult, result, openid, sql1, poolResult1, openId, orderId, buyOpenId, payForMePrice, payForOtherPrice, sql2, poolResult2, sql3, poolResult3, sql4, poolResult4, sql5, poolResult5, sql6, poolResult6;

    return _regenerator["default"].wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            _ctx$request$body5 = ctx.request.body, code = _ctx$request$body5.code, scanResult = _ctx$request$body5.scanResult;

            if (!code) {
              _context27.next = 61;
              break;
            }

            _context27.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context27.sent;
            openid = result.openid;
            _context27.prev = 6;
            sql1 = "SELECT open_id,order_id,buy_open_id,pay_for_me_price,pay_for_other_price FROM goods WHERE order_id = ? ";
            _context27.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [scanResult]);

          case 10:
            poolResult1 = _context27.sent;

            if (!(poolResult1.length === 1)) {
              _context27.next = 52;
              break;
            }

            openId = poolResult1[0].open_id;
            orderId = poolResult1[0].order_id;
            buyOpenId = poolResult1[0].buy_open_id;
            payForMePrice = poolResult1[0].pay_for_me_price;
            payForOtherPrice = poolResult1[0].pay_for_other_price;

            if (!(openid === openId || openid === buyOpenId)) {
              _context27.next = 49;
              break;
            }

            //如果扫码的是卖家或者买家才能完成交易，否则报错
            sql2 = "UPDATE goods SET order_status = ? WHERE order_id = ?";
            _context27.next = 21;
            return (0, _transformPoolQuery["default"])(sql2, ['completed', orderId]);

          case 21:
            poolResult2 = _context27.sent;

            if (!(poolResult2.affectedRows === 1)) {
              _context27.next = 47;
              break;
            }

            sql3 = 'UPDATE user_order SET bougth = bougth +1,trading = trading - 1 WHERE open_id =?';
            _context27.next = 26;
            return (0, _transformPoolQuery["default"])(sql3, [buyOpenId]);

          case 26:
            poolResult3 = _context27.sent;

            if (!(poolResult3.affectedRows === 1)) {
              _context27.next = 47;
              break;
            }

            sql4 = "UPDATE user_order SET saled = saled +1,trading = trading - 1  WHERE open_id =?";
            _context27.next = 31;
            return (0, _transformPoolQuery["default"])(sql4, [openId]);

          case 31:
            poolResult4 = _context27.sent;

            if (!(poolResult4.affectedRows === 1)) {
              _context27.next = 47;
              break;
            }

            if (!(payForMePrice != 0)) {
              _context27.next = 41;
              break;
            }

            sql5 = "UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id = ? ";
            _context27.next = 37;
            return (0, _transformPoolQuery["default"])(sql5, [payForMePrice, payForMePrice, openId]);

          case 37:
            poolResult5 = _context27.sent;

            if (poolResult5.affectedRows === 1) {
              wss.clients.forEach(function (client) {
                if (client.openId === openId || client.openId === buyOpenId) {
                  console.log('/tradingscancode:扫码交易成功！');
                  client.send(JSON.stringify({
                    status: _userStatus.statusList.success
                  }));
                  ctx.response.status = _userStatus.statusCodeList.success;
                  ctx.response.body = {
                    status: _userStatus.statusList.success,
                    data: '/tradingscancode:扫码交易成功！'
                  };
                }
              });
            }

            _context27.next = 47;
            break;

          case 41:
            if (!(payForOtherPrice != 0)) {
              _context27.next = 47;
              break;
            }

            sql6 = "UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id = ? ";
            _context27.next = 45;
            return (0, _transformPoolQuery["default"])(sql6, [payForOtherPrice, payForOtherPrice, buyOpenId]);

          case 45:
            poolResult6 = _context27.sent;

            if (poolResult6.affectedRows === 1) {
              wss.clients.forEach(function (client) {
                if (client.openId === openId || client.openId === buyOpenId) {
                  console.log('/tradingscancode:扫码交易成功！');
                  client.send(JSON.stringify({
                    status: _userStatus.statusList.success
                  }));
                  ctx.response.status = _userStatus.statusCodeList.success;
                  ctx.response.body = {
                    status: _userStatus.statusList.success,
                    data: '/tradingscancode:扫码交易成功！'
                  };
                }
              });
            }

          case 47:
            _context27.next = 52;
            break;

          case 49:
            console.log('/tradingscancode:扫码失败，该用户不是该订单的交易人！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail,
              msg: '/tradingscancode:扫码失败，该用户不是该订单的交易人！'
            };

          case 52:
            _context27.next = 59;
            break;

          case 54:
            _context27.prev = 54;
            _context27.t0 = _context27["catch"](6);
            console.log('/tradingscancode:数据库操作失败！', _context27.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/tradingscancode:数据库操作失败！';

          case 59:
            _context27.next = 64;
            break;

          case 61:
            console.log('/tradingscancode:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/tradingscancode:您请求的用户code有误!';

          case 64:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27, null, [[6, 54]]);
  }));

  return function tradingScanCode(_x47, _x48) {
    return _ref27.apply(this, arguments);
  };
}();

var getChatInfo =
/*#__PURE__*/
function () {
  var _ref28 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee28(ctx, next) {
    var _ctx$request$query8, code, orderId, getChatInfoStartTime, otherOpenId, result, openid, sql1, poolResult1, _poolResult1$3, open_id, pay_for_me_price, pay_for_other_price, goods_number, new_and_old_degree, want_exchange_goods, name_input, pics_location, topPicSrc, len, goodsInfo, chatInfo, chooseOtherOpenId, sql2, poolResult2, i, sendOpenId, chatTime, content, type, _sql11, _poolResult11, _i, _sendOpenId, _chatTime, _content, _type, sql3, poolResult3, chatNickName, chatAvatarUrl, sql4, poolResult4, myAvatarUrl, sql5, poolResult5, sql6, poolResult6;

    return _regenerator["default"].wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            _ctx$request$query8 = ctx.request.query, code = _ctx$request$query8.code, orderId = _ctx$request$query8.orderId, getChatInfoStartTime = _ctx$request$query8.getChatInfoStartTime, otherOpenId = _ctx$request$query8.otherOpenId;

            if (!code) {
              _context28.next = 66;
              break;
            }

            _context28.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context28.sent;
            openid = result.openid;
            _context28.prev = 6;
            sql1 = "SELECT open_id,pay_for_me_price,pay_for_other_price,goods_number,new_and_old_degree,want_exchange_goods,pics_location,name_input FROM goods WHERE order_id = ?";
            _context28.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 10:
            poolResult1 = _context28.sent;

            if (!(poolResult1.length === 1)) {
              _context28.next = 57;
              break;
            }

            _poolResult1$3 = poolResult1[0], open_id = _poolResult1$3.open_id, pay_for_me_price = _poolResult1$3.pay_for_me_price, pay_for_other_price = _poolResult1$3.pay_for_other_price, goods_number = _poolResult1$3.goods_number, new_and_old_degree = _poolResult1$3.new_and_old_degree, want_exchange_goods = _poolResult1$3.want_exchange_goods, name_input = _poolResult1$3.name_input, pics_location = _poolResult1$3.pics_location;
            len = pics_location.split(';').length;

            if (len === 0) {
              topPicSrc = '';
            } else {
              topPicSrc = 'https://' + pics_location.split(';')[0];
            }

            goodsInfo = {
              payForMePrice: pay_for_me_price,
              payForOtherPrice: pay_for_other_price,
              goodsNumber: goods_number,
              newAndOldDegree: new_and_old_degree,
              wantExchangeGoods: want_exchange_goods,
              nameInput: name_input,
              topPicSrc: topPicSrc,
              orderId: orderId
            };
            chatInfo = [];
            chooseOtherOpenId = '';

            if (orderId && otherOpenId === 'undefined') {
              chooseOtherOpenId = open_id;
            } else if (orderId && otherOpenId !== 'undefined') {
              chooseOtherOpenId = otherOpenId;
            }

            if (!(getChatInfoStartTime && getChatInfoStartTime.length > 0)) {
              _context28.next = 27;
              break;
            }

            sql2 = "SELECT send_open_id ,chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? )) AND chat_time > ? AND order_id = ? ORDER BY chat_time ASC ";
            _context28.next = 23;
            return (0, _transformPoolQuery["default"])(sql2, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId, getChatInfoStartTime]);

          case 23:
            poolResult2 = _context28.sent;

            if (poolResult2.length > 0) {
              for (i = 0; i < poolResult2.length; i++) {
                sendOpenId = poolResult2[i].send_open_id;
                chatTime = poolResult2[i].chat_time;
                content = poolResult2[i].content;
                type = void 0;

                if (sendOpenId === openid) {
                  type = 0;
                } else if (sendOpenId === chooseOtherOpenId) {
                  type = 1;
                }

                chatInfo.push({
                  type: type,
                  chatTime: chatTime,
                  content: content
                });
              }
            }

            _context28.next = 32;
            break;

          case 27:
            _sql11 = "SELECT send_open_id ,chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? ))  AND order_id = ? ORDER BY chat_time ASC ";
            _context28.next = 30;
            return (0, _transformPoolQuery["default"])(_sql11, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId]);

          case 30:
            _poolResult11 = _context28.sent;

            if (_poolResult11.length > 0) {
              for (_i = 0; _i < _poolResult11.length; _i++) {
                _sendOpenId = _poolResult11[_i].send_open_id;
                _chatTime = _poolResult11[_i].chat_time;
                _content = _poolResult11[_i].content;
                _type = void 0;

                if (_sendOpenId === openid) {
                  _type = 0;
                } else if (_sendOpenId === chooseOtherOpenId) {
                  _type = 1;
                }

                chatInfo.push({
                  type: _type,
                  chatTime: _chatTime,
                  content: _content
                });
              }
            }

          case 32:
            sql3 = "SELECT nick_name,avatar_url FROM user_info WHERE open_id = ?";
            _context28.next = 35;
            return (0, _transformPoolQuery["default"])(sql3, [chooseOtherOpenId]);

          case 35:
            poolResult3 = _context28.sent;

            if (!(poolResult3.length === 1)) {
              _context28.next = 57;
              break;
            }

            chatNickName = poolResult3[0].nick_name;
            chatAvatarUrl = poolResult3[0].avatar_url;
            sql4 = "SELECT avatar_url FROM user_info WHERE open_id = ?";
            _context28.next = 42;
            return (0, _transformPoolQuery["default"])(sql4, [openid]);

          case 42:
            poolResult4 = _context28.sent;

            if (!(poolResult4.length === 1)) {
              _context28.next = 57;
              break;
            }

            myAvatarUrl = poolResult4[0].avatar_url;
            sql5 = "SELECT * FROM user_chat_list WHERE ((chat_one_open_id = ? AND chat_two_open_id = ?) OR (chat_one_open_id = ? AND chat_two_open_id = ?)) AND order_id = ?";
            _context28.next = 48;
            return (0, _transformPoolQuery["default"])(sql5, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId]);

          case 48:
            poolResult5 = _context28.sent;

            if (!(poolResult5.length === 0)) {
              _context28.next = 54;
              break;
            }

            sql6 = "INSERT INTO user_chat_list(chat_one_open_id,chat_two_open_id,order_id) VALUES (?,?,?)";
            _context28.next = 53;
            return (0, _transformPoolQuery["default"])(sql6, [openid, chooseOtherOpenId, orderId]);

          case 53:
            poolResult6 = _context28.sent;

          case 54:
            console.log('/getchatinfo:获取聊天内容页数据成功');
            ctx.response.status = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: _userStatus.statusList.success,
              goodsInfo: goodsInfo,
              chatInfo: chatInfo,
              chatNickName: chatNickName,
              chatAvatarUrl: chatAvatarUrl,
              myAvatarUrl: myAvatarUrl
            };

          case 57:
            _context28.next = 64;
            break;

          case 59:
            _context28.prev = 59;
            _context28.t0 = _context28["catch"](6);
            console.log('/getchatinfo:数据库操作失败！', _context28.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getchatinfo:数据库操作失败！';

          case 64:
            _context28.next = 69;
            break;

          case 66:
            console.log('/getchatinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getchatinfo:您请求的用户code有误!';

          case 69:
          case "end":
            return _context28.stop();
        }
      }
    }, _callee28, null, [[6, 59]]);
  }));

  return function getChatInfo(_x49, _x50) {
    return _ref28.apply(this, arguments);
  };
}();

var sendChatInfo =
/*#__PURE__*/
function () {
  var _ref29 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee29(ctx, next) {
    var _ctx$request$body6, code, orderId, value, otherOpenId, isWarn, result, openid, sql1, poolResult1, receiveOpenId, chooseOtherOpenId, reg, checkedValue, sql2, poolResult2, sql3, poolResult3, id;

    return _regenerator["default"].wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            _ctx$request$body6 = ctx.request.body, code = _ctx$request$body6.code, orderId = _ctx$request$body6.orderId, value = _ctx$request$body6.value, otherOpenId = _ctx$request$body6.otherOpenId;
            isWarn = false;

            if (!code) {
              _context29.next = 37;
              break;
            }

            _context29.next = 5;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 5:
            result = _context29.sent;
            openid = result.openid;
            _context29.prev = 7;
            sql1 = "SELECT open_id FROM goods WHERE order_id = ?";
            _context29.next = 11;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 11:
            poolResult1 = _context29.sent;

            if (!(poolResult1.length === 1)) {
              _context29.next = 28;
              break;
            }

            receiveOpenId = poolResult1[0].open_id;
            chooseOtherOpenId = '';

            if (orderId && !otherOpenId) {
              chooseOtherOpenId = receiveOpenId;
            } else if (orderId && otherOpenId) {
              chooseOtherOpenId = otherOpenId;
            }

            reg = new RegExp('cao|操|草|艹|((sha|傻|煞|s)(B|逼))|(垃圾|lj|辣鸡)|(gun|滚)|尼玛|弱智|sjb|神经病|废物|feiwu', 'ig');
            checkedValue = value.replace(reg, function (keyWord) {
              var len = keyWord.length;
              var str = '';

              for (var i = 0; i < len; i++) {
                str += '*';
              }

              isWarn = true;
              return str;
            });
            sql2 = 'INSERT INTO user_chat(send_open_id,receive_open_id,order_id,chat_time,content) VALUES (?,?,?,now() , ? )';
            _context29.next = 21;
            return (0, _transformPoolQuery["default"])(sql2, [openid, chooseOtherOpenId, orderId, checkedValue]);

          case 21:
            poolResult2 = _context29.sent;

            if (!(poolResult2.affectedRows === 1)) {
              _context29.next = 28;
              break;
            }

            sql3 = "SELECT id FROM user_chat_list WHERE ((chat_one_open_id = ? AND chat_two_open_id = ?) OR (chat_one_open_id = ? AND chat_two_open_id = ?)) AND order_id = ?";
            _context29.next = 26;
            return (0, _transformPoolQuery["default"])(sql3, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId]);

          case 26:
            poolResult3 = _context29.sent;

            if (poolResult3.length == 1) {
              id = poolResult3[0].id;
              wss.clients.forEach(function (client) {
                var chatTime = new Date();

                if (client.openId === openid) {
                  client.send(JSON.stringify({
                    status: _userStatus.statusList.success,
                    chatInfo: [{
                      type: 0,
                      chatTime: chatTime,
                      content: checkedValue,
                      isWarn: isWarn,
                      id: id
                    }]
                  }));
                }

                if (client.openId === chooseOtherOpenId) {
                  client.send(JSON.stringify({
                    status: _userStatus.statusList.success,
                    chatInfo: [{
                      type: 1,
                      chatTime: chatTime,
                      content: checkedValue,
                      isWarn: false,
                      id: id
                    }]
                  }));
                }
              });
              console.log('/sendchatinfo:发送聊天信息成功!');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 28:
            _context29.next = 35;
            break;

          case 30:
            _context29.prev = 30;
            _context29.t0 = _context29["catch"](7);
            console.log('/sendchatinfo:数据库操作失败！', _context29.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/sendchatinfo:数据库操作失败！';

          case 35:
            _context29.next = 40;
            break;

          case 37:
            console.log('/sendchatinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/sendchatinfo:您请求的用户code有误!';

          case 40:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29, null, [[7, 30]]);
  }));

  return function sendChatInfo(_x51, _x52) {
    return _ref29.apply(this, arguments);
  };
}();

var getChatList =
/*#__PURE__*/
function () {
  var _ref30 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee31(ctx, next) {
    var _ctx$request$query9, code, page, startIndex, returnDatas, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            _ctx$request$query9 = ctx.request.query, code = _ctx$request$query9.code, page = _ctx$request$query9.page;
            startIndex = (page - 1) * 8;
            returnDatas = [];

            if (!code) {
              _context31.next = 25;
              break;
            }

            _context31.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context31.sent;
            openid = result.openid;
            _context31.prev = 8;
            sql1 = "SELECT chat_one_open_id,chat_two_open_id,order_id,id FROM user_chat_list WHERE chat_one_open_id = ? OR chat_two_open_id =? limit ?,8";
            _context31.next = 12;
            return (0, _transformPoolQuery["default"])(sql1, [openid, openid, startIndex]);

          case 12:
            poolResult1 = _context31.sent;

            if (!(poolResult1.length > 0)) {
              _context31.next = 16;
              break;
            }

            _context31.next = 16;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref31 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee30(data, index) {
                  var chatOneOpenId, chatTwoOpenId, orderId, id, avatarUrl, nickName, otherOpenId, sql2, poolResult2, sql3, poolResult3, topPicSrc, lastChatContent, lastChatTime, len, sql4, poolResult4;
                  return _regenerator["default"].wrap(function _callee30$(_context30) {
                    while (1) {
                      switch (_context30.prev = _context30.next) {
                        case 0:
                          chatOneOpenId = data.chat_one_open_id;
                          chatTwoOpenId = data.chat_two_open_id;
                          orderId = data.order_id;
                          id = data.id;
                          avatarUrl = '';
                          nickName = '';
                          otherOpenId = '';

                          if (openid === chatOneOpenId) {
                            otherOpenId = chatTwoOpenId;
                          } else if (openid === chatTwoOpenId) {
                            otherOpenId = chatOneOpenId;
                          }

                          sql2 = "SELECT avatar_url,nick_name FROM user_info WHERE open_id = ?";
                          _context30.next = 11;
                          return (0, _transformPoolQuery["default"])(sql2, [otherOpenId]);

                        case 11:
                          poolResult2 = _context30.sent;

                          if (!(poolResult2.length === 1)) {
                            _context30.next = 32;
                            break;
                          }

                          avatarUrl = poolResult2[0].avatar_url;
                          nickName = poolResult2[0].nick_name;
                          sql3 = "SELECT pics_location FROM goods WHERE order_id = ?";
                          _context30.next = 18;
                          return (0, _transformPoolQuery["default"])(sql3, [orderId]);

                        case 18:
                          poolResult3 = _context30.sent;

                          if (!(poolResult3.length === 1)) {
                            _context30.next = 32;
                            break;
                          }

                          topPicSrc = '';
                          lastChatContent = '';
                          lastChatTime = '';
                          len = poolResult3[0].pics_location.length;

                          if (len === 0) {
                            topPicSrc = '';
                          } else {
                            topPicSrc = 'https://' + poolResult3[0].pics_location.split(';')[0];
                          }

                          sql4 = "SELECT chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? )) AND order_id = ? ORDER BY chat_time DESC LIMIT 1 ";
                          _context30.next = 28;
                          return (0, _transformPoolQuery["default"])(sql4, [chatOneOpenId, chatTwoOpenId, chatTwoOpenId, chatOneOpenId, orderId]);

                        case 28:
                          poolResult4 = _context30.sent;

                          if (poolResult4.length === 1) {
                            lastChatContent = poolResult4[0].content;
                            lastChatTime = poolResult4[0].chat_time;
                          }

                          returnDatas.push({
                            avatarUrl: avatarUrl,
                            nickName: nickName,
                            topPicSrc: topPicSrc,
                            lastChatContent: lastChatContent,
                            lastChatTime: lastChatTime,
                            orderId: orderId,
                            otherOpenId: otherOpenId,
                            id: id
                          });

                          if (returnDatas.length === poolResult1.length) {
                            resolve();
                          }

                        case 32:
                        case "end":
                          return _context30.stop();
                      }
                    }
                  }, _callee30);
                }));

                return function (_x55, _x56) {
                  return _ref31.apply(this, arguments);
                };
              }());
            }).then(function () {
              console.log("/getchatlist:查询聊天列表成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                returnDatas: returnDatas
              };
            });

          case 16:
            _context31.next = 23;
            break;

          case 18:
            _context31.prev = 18;
            _context31.t0 = _context31["catch"](8);
            console.log('/getchatlist:数据库操作失败！', _context31.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getchatlist:数据库操作失败！';

          case 23:
            _context31.next = 28;
            break;

          case 25:
            console.log('/getchatlist:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getchatlist:您请求的用户code有误!';

          case 28:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31, null, [[8, 18]]);
  }));

  return function getChatList(_x53, _x54) {
    return _ref30.apply(this, arguments);
  };
}();

app.use(_koaRoute["default"].post('/login', login));
app.use(_koaRoute["default"].post('/register', register));
app.use(_koaRoute["default"].post('/releasegoods', releaseGoods));
app.use(_koaRoute["default"].post('/releasegoodspics', releasegoodspics));
app.use(_koaRoute["default"].get('/getgoodsinfo', getGoodsInfo));
app.use(_koaRoute["default"].get('/getuserinfo', getUserInfo));
app.use(_koaRoute["default"].get('/getmoney', getMoney));
app.use(_koaRoute["default"].get('/getorderinfo', getOrderInfo));
app.use(_koaRoute["default"].get('/getwaterfall', getWaterFall));
app.use(_koaRoute["default"].post('/pay', pay));
app.use(_koaRoute["default"].get('/trading', trading));
app.use(_koaRoute["default"].get('/search', search));
app.use(_koaRoute["default"].get('/orderlist', orderList));
app.use(_koaRoute["default"].post('/recharge', recharge));
app.use(_koaRoute["default"].post('/care', care));
app.use(_koaRoute["default"].get('/getcarelist', getCareList));
app.use(_koaRoute["default"].post('/collect', collect));
app.use(_koaRoute["default"].get('/getcollectlist', getCollectList));
app.use(_koaRoute["default"].post('/tradingscancode', tradingScanCode));
app.use(_koaRoute["default"].get('/getchatinfo', getChatInfo));
app.use(_koaRoute["default"].post('/sendchatinfo', sendChatInfo));
app.use(_koaRoute["default"].get('/getchatlist', getChatList)); // app.listen(3000)