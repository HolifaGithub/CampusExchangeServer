"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

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

var _miniProgramInfo = require("./static-name/mini-program-info");

var _userStatus = require("./static-name/user-status");

var _http = _interopRequireDefault(require("http"));

// import bodyParse from 'koa-bodyparser'
var body = require('koa-body');

var app = new _koa["default"]();

var keyContent = _fs["default"].readFileSync(_path["default"].join(__dirname, '../https/2.key'));

var certContent = _fs["default"].readFileSync(_path["default"].join(__dirname, '../https/1.crt'));

var httpsOption = {
  key: keyContent,
  cert: certContent
};

_http["default"].createServer(app.callback()).listen(3000); // https.createServer(httpsOption, app.callback()).listen(3000)


app.use(body({
  multipart: true
})); // app.use(bodyParse())

var login =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(ctx, next) {
    var isNewUser, isDeleteSuccess, requestBody, code, rawData, signature, encryptedData, iv, result, openid, session_key, checkSignatureResult, pc, openData, nickName, gender, country, province, city, avatarUrl, sql1, result1, sql2, result2, sql3, result3, sql4, result4, sql5, result5;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            isNewUser = true;
            isDeleteSuccess = false;
            requestBody = ctx.request.body;

            if (!requestBody.code) {
              _context.next = 58;
              break;
            }

            code = requestBody.code, rawData = requestBody.rawData, signature = requestBody.signature, encryptedData = requestBody.encryptedData, iv = requestBody.iv;
            _context.next = 7;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 7:
            result = _context.sent;
            openid = result.openid, session_key = result.session_key;

            if (!(openid && session_key)) {
              _context.next = 56;
              break;
            }

            //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
            checkSignatureResult = (0, _checkSignature.checkSignature)(signature, rawData, session_key);

            if (!checkSignatureResult) {
              _context.next = 53;
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
            }

            if (!isNewUser) {
              _context.next = 32;
              break;
            }

            sql2 = "INSERT INTO user_money(open_id) VALUES (?)";
            _context.next = 25;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 25:
            result2 = _context.sent;

            if (result2.affectedRows === 1) {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u5DF2\u63D2\u5165user_money\uFF01"));
            } else {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u63D2\u5165user_money\u5931\u8D25\uFF01"));
            }

            sql3 = "INSERT INTO user_order(open_id) VALUES (?)";
            _context.next = 30;
            return (0, _transformPoolQuery["default"])(sql3, [openid]);

          case 30:
            result3 = _context.sent;

            if (result3.affectedRows === 1) {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u5DF2\u63D2\u5165user_order\uFF01"));
            } else {
              console.log("/login:\u7528\u6237\uFF1A".concat(nickName, "\u7684openid\u6570\u636E\u63D2\u5165user_order\u5931\u8D25\uFF01"));
            }

          case 32:
            if (isNewUser) {
              _context.next = 38;
              break;
            }

            sql4 = "DELETE FROM user_info WHERE open_id = ?;";
            _context.next = 36;
            return (0, _transformPoolQuery["default"])(sql4, [openid]);

          case 36:
            result4 = _context.sent;

            if (result4.affectedRows === 1) {
              isDeleteSuccess = true;
            } else {
              isDeleteSuccess = false;
            }

          case 38:
            if (!(!isNewUser && isDeleteSuccess || isNewUser)) {
              _context.next = 44;
              break;
            }

            sql5 = "INSERT INTO user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?);";
            _context.next = 42;
            return (0, _transformPoolQuery["default"])(sql5, [openid, nickName, gender, country, province, city, avatarUrl]);

          case 42:
            result5 = _context.sent;

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
            _context.next = 51;
            break;

          case 46:
            _context.prev = 46;
            _context.t0 = _context["catch"](15);
            console.log('/login:数据库操作失败！', _context.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:数据库操作失败！';

          case 51:
            _context.next = 56;
            break;

          case 53:
            console.log('/login:您的签名signature有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您的签名signature有误!';

          case 56:
            _context.next = 61;
            break;

          case 58:
            console.log('/login:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/login:您请求的用户code有误!';

          case 61:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[15, 46]]);
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
            sql2 = "UPDATE user_info SET school = ?," + "id= ?," + "education=?," + "grade=?," + "collage=?," + "user_class=?," + "user_name=?," + "id_card=?," + "phone=?," + "user_address=?" + "WHERE open_id = ?;";
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

var releaseGoods =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(ctx, next) {
    var requestBody, typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation, orderId, code, orderStatus, result, openid, sql, poolResult, sql2, poolResult2;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            requestBody = ctx.request.body;
            typeOne = requestBody.typeOne, typeTwo = requestBody.typeTwo, typeThree = requestBody.typeThree, nameInput = requestBody.nameInput, goodsNumber = requestBody.goodsNumber, newAndOldDegree = requestBody.newAndOldDegree, mode = requestBody.mode, objectOfPayment = requestBody.objectOfPayment, payForMePrice = requestBody.payForMePrice, payForOtherPrice = requestBody.payForOtherPrice, wantExchangeGoods = requestBody.wantExchangeGoods, describe = requestBody.describe, picsLocation = requestBody.picsLocation, orderId = requestBody.orderId, code = requestBody.code, orderStatus = requestBody.orderStatus;

            if (!code) {
              _context3.next = 30;
              break;
            }

            _context3.next = 5;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 5:
            result = _context3.sent;
            openid = result.openid;

            if (!openid) {
              _context3.next = 25;
              break;
            }

            sql = "INSERT INTO goods(order_id,order_time,order_status,open_id,type_one,type_two,type_three,name_input,goods_number,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,goods_describe,pics_location) VALUES (?,now(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
            _context3.next = 11;
            return (0, _transformPoolQuery["default"])(sql, [orderId, orderStatus, openid, typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation]);

          case 11:
            poolResult = _context3.sent;

            if (!(poolResult.affectedRows === 1)) {
              _context3.next = 20;
              break;
            }

            sql2 = "update user_order set released = released + 1  where open_id =? ";
            _context3.next = 16;
            return (0, _transformPoolQuery["default"])(sql2, [openid]);

          case 16:
            poolResult2 = _context3.sent;

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

            _context3.next = 23;
            break;

          case 20:
            console.log("/releasegoods:用户发布商品失败！");
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = _userStatus.statusList.fail;

          case 23:
            _context3.next = 28;
            break;

          case 25:
            console.log('/releasegoods:获取openid失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/releasegoods:获取openid失败！';

          case 28:
            _context3.next = 33;
            break;

          case 30:
            console.log('/releasegoods:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/releasegoods:您请求的用户code有误!';

          case 33:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function releaseGoods(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var releasegoodspics =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(ctx, next) {
    var orderId, file, upLoadCosResult, location;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            orderId = ctx.request.body.orderId;
            file = ctx.request.files.pic;
            _context4.next = 4;
            return (0, _uploadCos["default"])(file, orderId);

          case 4:
            upLoadCosResult = _context4.sent;

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
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function releasegoodspics(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

var getGoodsInfo =
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee5(ctx, next) {
    var _ctx$request$query, code, orderId, result, openid, sql1, poolResult1, _poolResult1$, nick_name, avatar_url, school, sql2, poolResult2, _poolResult2$, order_id, order_time, order_status, type_one, type_two, type_three, name_input, goods_number, new_and_old_degree, mode, object_of_payment, pay_for_me_price, pay_for_other_price, want_exchange_goods, goods_describe, pics_location;

    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _ctx$request$query = ctx.request.query, code = _ctx$request$query.code, orderId = _ctx$request$query.orderId;

            if (!code) {
              _context5.next = 29;
              break;
            }

            _context5.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context5.sent;
            openid = result.openid;
            _context5.prev = 6;
            sql1 = "SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;";
            _context5.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context5.sent;
            _poolResult1$ = poolResult1[0], nick_name = _poolResult1$.nick_name, avatar_url = _poolResult1$.avatar_url, school = _poolResult1$.school;
            sql2 = "SELECT * FROM goods WHERE order_id =?";
            _context5.next = 15;
            return (0, _transformPoolQuery["default"])(sql2, [orderId]);

          case 15:
            poolResult2 = _context5.sent;
            _poolResult2$ = poolResult2[0], order_id = _poolResult2$.order_id, order_time = _poolResult2$.order_time, order_status = _poolResult2$.order_status, type_one = _poolResult2$.type_one, type_two = _poolResult2$.type_two, type_three = _poolResult2$.type_three, name_input = _poolResult2$.name_input, goods_number = _poolResult2$.goods_number, new_and_old_degree = _poolResult2$.new_and_old_degree, mode = _poolResult2$.mode, object_of_payment = _poolResult2$.object_of_payment, pay_for_me_price = _poolResult2$.pay_for_me_price, pay_for_other_price = _poolResult2$.pay_for_other_price, want_exchange_goods = _poolResult2$.want_exchange_goods, goods_describe = _poolResult2$.goods_describe, pics_location = _poolResult2$.pics_location;

            if (poolResult1.length === 1 && poolResult2.length === 1) {
              console.log('/getgoodsinfo:获取商品详情成功！');
            }

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
              school: school
            };
            ctx.response.statusCode = _userStatus.statusCodeList.success;
            _context5.next = 27;
            break;

          case 22:
            _context5.prev = 22;
            _context5.t0 = _context5["catch"](6);
            console.log('/getgoodsinfo:数据库操作失败！', _context5.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getgoodsinfo:数据库操作失败！';

          case 27:
            _context5.next = 32;
            break;

          case 29:
            console.log('/getgoodsinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getgoodsinfo:您请求的用户code有误!';

          case 32:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[6, 22]]);
  }));

  return function getGoodsInfo(_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}();

var getUserInfo =
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee6(ctx, next) {
    var _ctx$request$query2, code, orderId, result, openid, sql1, poolResult1, _poolResult1$2, nick_name, gender, country, province, city, avatar_url, school, id, education, grade, collage, user_class, user_name, id_card, phone, user_address;

    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _ctx$request$query2 = ctx.request.query, code = _ctx$request$query2.code, orderId = _ctx$request$query2.orderId;

            if (!(code && !orderId)) {
              _context6.next = 21;
              break;
            }

            _context6.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context6.sent;
            openid = result.openid;
            _context6.prev = 6;
            sql1 = "SELECT * FROM user_info WHERE open_id = ? ";
            _context6.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context6.sent;

            if (poolResult1.length === 1) {
              _poolResult1$2 = poolResult1[0], nick_name = _poolResult1$2.nick_name, gender = _poolResult1$2.gender, country = _poolResult1$2.country, province = _poolResult1$2.province, city = _poolResult1$2.city, avatar_url = _poolResult1$2.avatar_url, school = _poolResult1$2.school, id = _poolResult1$2.id, education = _poolResult1$2.education, grade = _poolResult1$2.grade, collage = _poolResult1$2.collage, user_class = _poolResult1$2.user_class, user_name = _poolResult1$2.user_name, id_card = _poolResult1$2.id_card, phone = _poolResult1$2.phone, user_address = _poolResult1$2.user_address;
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

            _context6.next = 19;
            break;

          case 14:
            _context6.prev = 14;
            _context6.t0 = _context6["catch"](6);
            console.log('/getuserinfo:数据库操作失败！', _context6.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getuserinfo:数据库操作失败！';

          case 19:
            _context6.next = 24;
            break;

          case 21:
            console.log('/getuserinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getuserinfo:您请求的用户code有误!';

          case 24:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[6, 14]]);
  }));

  return function getUserInfo(_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();

var getMoney =
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(ctx, next) {
    var code, result, openid, sql1, poolResult1, balance;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            code = ctx.request.query.code;

            if (!code) {
              _context7.next = 21;
              break;
            }

            _context7.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context7.sent;
            openid = result.openid;
            _context7.prev = 6;
            sql1 = "SELECT * FROM user_money WHERE open_id = ?";
            _context7.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context7.sent;

            if (poolResult1.length === 1) {
              balance = poolResult1[0].balance;
              console.log("/getmoney:获取用户余额成功！");
              ctx.response.statusCode = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success,
                balance: balance
              };
            }

            _context7.next = 19;
            break;

          case 14:
            _context7.prev = 14;
            _context7.t0 = _context7["catch"](6);
            console.log('/getmoney:数据库操作失败！', _context7.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:数据库操作失败！';

          case 19:
            _context7.next = 24;
            break;

          case 21:
            console.log('/getmoney:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:您请求的用户code有误!';

          case 24:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[6, 14]]);
  }));

  return function getMoney(_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();

var getOrderInfo =
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(ctx, next) {
    var code, result, openid, sql1, poolResult1, _poolResult1$3, released, _trading, bougth, saled;

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
            sql1 = "SELECT * FROM user_order WHERE open_id = ?";
            _context8.next = 10;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 10:
            poolResult1 = _context8.sent;

            if (poolResult1.length === 1) {
              _poolResult1$3 = poolResult1[0], released = _poolResult1$3.released, _trading = _poolResult1$3.trading, bougth = _poolResult1$3.bougth, saled = _poolResult1$3.saled;
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

            _context8.next = 19;
            break;

          case 14:
            _context8.prev = 14;
            _context8.t0 = _context8["catch"](6);
            console.log('/getorderinfo:数据库操作失败！', _context8.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getmoney:数据库操作失败！';

          case 19:
            _context8.next = 24;
            break;

          case 21:
            console.log('/getorderinfo:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getorderinfo:您请求的用户code有误!';

          case 24:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[6, 14]]);
  }));

  return function getOrderInfo(_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}();

var getWaterFall =
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee10(ctx, next) {
    var _ctx$request$query3, code, page, startIndex, returnDatas, result, openid, sql1, poolResult1;

    return _regenerator["default"].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _ctx$request$query3 = ctx.request.query, code = _ctx$request$query3.code, page = _ctx$request$query3.page;
            startIndex = (page - 1) * 2;
            returnDatas = [];

            if (!code) {
              _context10.next = 31;
              break;
            }

            _context10.next = 6;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 6:
            result = _context10.sent;
            openid = result.openid;
            _context10.prev = 8;
            sql1 = "SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE open_id = ? AND order_status = 'released' LIMIT ?,2;";
            _context10.next = 12;
            return (0, _transformPoolQuery["default"])(sql1, [openid, startIndex]);

          case 12:
            poolResult1 = _context10.sent;

            if (!(poolResult1.length > 0)) {
              _context10.next = 19;
              break;
            }

            if (poolResult1.length % 2 !== 0) {
              poolResult1.pop();
            }

            _context10.next = 17;
            return new Promise(function (resolve, reject) {
              poolResult1.map(
              /*#__PURE__*/
              function () {
                var _ref10 = (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee9(data) {
                  var sql2, poolResult2, topPicSrc, len;
                  return _regenerator["default"].wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          sql2 = "SELECT nick_name,avatar_url from user_info WHERE open_id =?";
                          _context9.next = 3;
                          return (0, _transformPoolQuery["default"])(sql2, [data.open_id]);

                        case 3:
                          poolResult2 = _context9.sent;

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
                          return _context9.stop();
                      }
                    }
                  }, _callee9);
                }));

                return function (_x19) {
                  return _ref10.apply(this, arguments);
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
            _context10.next = 22;
            break;

          case 19:
            console.log("/getwaterfall:获取waterfall成功，但无数据！");
            ctx.response.statusCode = _userStatus.statusCodeList.success;
            ctx.response.body = {
              status: _userStatus.statusList.success,
              returnDatas: returnDatas
            };

          case 22:
            _context10.next = 29;
            break;

          case 24:
            _context10.prev = 24;
            _context10.t0 = _context10["catch"](8);
            console.log('/getwaterfall:数据库操作失败！', _context10.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getwaterfall:数据库操作失败！';

          case 29:
            _context10.next = 34;
            break;

          case 31:
            console.log('/getwaterfall:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/getwaterfall:您请求的用户code有误!';

          case 34:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, null, [[8, 24]]);
  }));

  return function getWaterFall(_x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}();

var pay =
/*#__PURE__*/
function () {
  var _ref11 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee11(ctx, next) {
    var _ctx$request$body, code, orderId, payForMePrice, payForOtherPrice, result, openid, sql1, poolResult1, balance, sql2, poolResult2, sql3, poolResult3, salederOpenId, sql4, poolResult4, sql5, poolResult5, sql6, poolResult6, _sql, _poolResult, _balance, _sql2, _poolResult2, _sql3, _poolResult3, _salederOpenId, _sql4, _poolResult4, _sql5, _poolResult5, _sql6, _poolResult6, sql7, poolResult7;

    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _ctx$request$body = ctx.request.body, code = _ctx$request$body.code, orderId = _ctx$request$body.orderId, payForMePrice = _ctx$request$body.payForMePrice, payForOtherPrice = _ctx$request$body.payForOtherPrice; // console.log(payForMePrice,payForMePrice===0,payForOtherPrice,payForOtherPrice===0)

            if (!code) {
              _context11.next = 99;
              break;
            }

            _context11.next = 4;
            return (0, _getOpenIdAndSessionKey["default"])(code);

          case 4:
            result = _context11.sent;
            openid = result.openid;
            _context11.prev = 6;

            if (!(payForMePrice !== 0)) {
              _context11.next = 46;
              break;
            }

            sql1 = "SELECT balance FROM user_money WHERE open_id =?";
            _context11.next = 11;
            return (0, _transformPoolQuery["default"])(sql1, [openid]);

          case 11:
            poolResult1 = _context11.sent;

            if (!(poolResult1.length === 1)) {
              _context11.next = 46;
              break;
            }

            balance = poolResult1[0].balance;

            if (!(balance >= payForMePrice)) {
              _context11.next = 46;
              break;
            }

            sql2 = "UPDATE  user_money SET balance = balance - ?,pay=pay + ?  where open_id =? ";
            _context11.next = 18;
            return (0, _transformPoolQuery["default"])(sql2, [payForMePrice, payForMePrice, openid]);

          case 18:
            poolResult2 = _context11.sent;

            if (!(poolResult2.affectedRows === 1)) {
              _context11.next = 43;
              break;
            }

            sql3 = "SELECT open_id FROM goods WHERE order_id =?";
            _context11.next = 23;
            return (0, _transformPoolQuery["default"])(sql3, [orderId]);

          case 23:
            poolResult3 = _context11.sent;

            if (!(poolResult3.length === 1)) {
              _context11.next = 41;
              break;
            }

            salederOpenId = poolResult3[0].open_id;
            sql4 = "UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?";
            _context11.next = 29;
            return (0, _transformPoolQuery["default"])(sql4, ['trading', openid, orderId]);

          case 29:
            poolResult4 = _context11.sent;

            if (!(poolResult4.affectedRows === 1)) {
              _context11.next = 41;
              break;
            }

            sql5 = "UPDATE user_order SET bougth = bougth + 1, trading = trading +1 WHERE open_id =?";
            _context11.next = 34;
            return (0, _transformPoolQuery["default"])(sql5, [openid]);

          case 34:
            poolResult5 = _context11.sent;

            if (!(poolResult5.affectedRows === 1)) {
              _context11.next = 41;
              break;
            }

            sql6 = "UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?";
            _context11.next = 39;
            return (0, _transformPoolQuery["default"])(sql6, [salederOpenId]);

          case 39:
            poolResult6 = _context11.sent;

            if (poolResult6.affectedRows === 1) {
              console.log('/pay:支付成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 41:
            _context11.next = 46;
            break;

          case 43:
            console.log('/pay:余额不足，支付失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail
            };

          case 46:
            if (!(payForOtherPrice !== 0)) {
              _context11.next = 90;
              break;
            }

            _sql = "SELECT balance FROM user_money WHERE open_id =?";
            _context11.next = 50;
            return (0, _transformPoolQuery["default"])(_sql, [openid]);

          case 50:
            _poolResult = _context11.sent;

            if (!(_poolResult.length === 1)) {
              _context11.next = 90;
              break;
            }

            _balance = _poolResult[0].balance;

            if (!(_balance >= payForMePrice)) {
              _context11.next = 90;
              break;
            }

            _sql2 = "UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id =? ";
            _context11.next = 57;
            return (0, _transformPoolQuery["default"])(_sql2, [payForOtherPrice, payForOtherPrice, openid]);

          case 57:
            _poolResult2 = _context11.sent;

            if (!(_poolResult2.affectedRows === 1)) {
              _context11.next = 87;
              break;
            }

            _sql3 = "SELECT open_id FROM goods WHERE order_id =?";
            _context11.next = 62;
            return (0, _transformPoolQuery["default"])(_sql3, [orderId]);

          case 62:
            _poolResult3 = _context11.sent;

            if (!(_poolResult3.length === 1)) {
              _context11.next = 85;
              break;
            }

            _salederOpenId = _poolResult3[0].open_id;
            _sql4 = "UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?";
            _context11.next = 68;
            return (0, _transformPoolQuery["default"])(_sql4, ['trading', openid, orderId]);

          case 68:
            _poolResult4 = _context11.sent;

            if (!(_poolResult4.affectedRows === 1)) {
              _context11.next = 85;
              break;
            }

            _sql5 = "UPDATE user_money SET balance = balance - ? ,pay = pay + ? WHERE open_id = ?";
            _context11.next = 73;
            return (0, _transformPoolQuery["default"])(_sql5, [payForOtherPrice, payForOtherPrice, _salederOpenId]);

          case 73:
            _poolResult5 = _context11.sent;

            if (!(_poolResult5.affectedRows === 1)) {
              _context11.next = 85;
              break;
            }

            _sql6 = "UPDATE user_order SET bougth = bougth + 1 WHERE open_id =?";
            _context11.next = 78;
            return (0, _transformPoolQuery["default"])(_sql6, [openid]);

          case 78:
            _poolResult6 = _context11.sent;

            if (!(_poolResult6.affectedRows === 1)) {
              _context11.next = 85;
              break;
            }

            sql7 = "UPDATE user_order SET saled = saled + 1 WHERE open_id =?";
            _context11.next = 83;
            return (0, _transformPoolQuery["default"])(sql7, [_salederOpenId]);

          case 83:
            poolResult7 = _context11.sent;

            if (poolResult7.affectedRows === 1) {
              console.log('/pay:支付成功！');
              ctx.response.status = _userStatus.statusCodeList.success;
              ctx.response.body = {
                status: _userStatus.statusList.success
              };
            }

          case 85:
            _context11.next = 90;
            break;

          case 87:
            console.log('/pay:余额不足，支付失败！');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = {
              status: _userStatus.statusList.fail
            };

          case 90:
            _context11.next = 97;
            break;

          case 92:
            _context11.prev = 92;
            _context11.t0 = _context11["catch"](6);
            console.log('/pay:数据库操作失败！', _context11.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/pay:数据库操作失败！';

          case 97:
            _context11.next = 102;
            break;

          case 99:
            console.log('/pay:您请求的用户code有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/pay:您请求的用户code有误!';

          case 102:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, null, [[6, 92]]);
  }));

  return function pay(_x20, _x21) {
    return _ref11.apply(this, arguments);
  };
}();

var trading =
/*#__PURE__*/
function () {
  var _ref12 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee12(ctx, next) {
    var orderId, sql1, poolResult1, openId, buyOpenId, payForMePrice, payForOtherPrice, sql2, poolResult2, salederPhone, salederAddress, sql3, poolResult3, buierPhone, buierAddress, buierAvatarUrl, buierNickName, orderCode;
    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            orderId = ctx.request.query.orderId;

            if (!orderId) {
              _context12.next = 34;
              break;
            }

            _context12.prev = 2;
            sql1 = "SELECT open_id,buy_open_id,pay_for_me_price,pay_for_other_price FROM goods WHERE order_id = ?";
            _context12.next = 6;
            return (0, _transformPoolQuery["default"])(sql1, [orderId]);

          case 6:
            poolResult1 = _context12.sent;

            if (!(poolResult1.length === 1)) {
              _context12.next = 25;
              break;
            }

            openId = poolResult1[0].open_id;
            buyOpenId = poolResult1[0].buy_open_id;
            payForMePrice = poolResult1[0].pay_for_me_price;
            payForOtherPrice = poolResult1[0].pay_for_other_price;
            console.log((0, _typeof2["default"])(payForMePrice), (0, _typeof2["default"])(payForOtherPrice));
            sql2 = "SELECT phone,user_address FROM user_info WHERE open_id = ?";
            _context12.next = 16;
            return (0, _transformPoolQuery["default"])(sql2, [openId]);

          case 16:
            poolResult2 = _context12.sent;

            if (!(poolResult2.length === 1)) {
              _context12.next = 25;
              break;
            }

            salederPhone = poolResult2[0].phone;
            salederAddress = poolResult2[0].user_address;
            sql3 = "SELECT phone,user_address,avatar_url,nick_name FROM user_info WHERE open_id = ?";
            _context12.next = 23;
            return (0, _transformPoolQuery["default"])(sql3, [buyOpenId]);

          case 23:
            poolResult3 = _context12.sent;

            if (poolResult3.length === 1) {
              buierPhone = poolResult3[0].phone;
              buierAddress = poolResult3[0].user_address;
              buierAvatarUrl = poolResult3[0].avatar_url;
              buierNickName = poolResult3[0].nick_name;
              orderCode = openId.slice(6, 18) + ',' + orderId.slice(0, 12) + ',' + buyOpenId.slice(6, 18); // const sql4 = `UPDATE user_money SET balance = balance + ? ,income = income + ? WHERE open_id = ?`
              // const poolResult4 = await transformPoolQuery(sql4, [payForMePrice, payForMePrice, openId])
              // if (poolResult4.affectedRows === 1) {

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
                orderCode: orderCode // }

              };
            }

          case 25:
            _context12.next = 32;
            break;

          case 27:
            _context12.prev = 27;
            _context12.t0 = _context12["catch"](2);
            console.log('/trading:数据库操作失败！', _context12.t0);
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/trading:数据库操作失败！';

          case 32:
            _context12.next = 37;
            break;

          case 34:
            console.log('/trading:您请求的用户orderId有误!');
            ctx.response.status = _userStatus.statusCodeList.fail;
            ctx.response.body = '/trading:您请求的用户orderId有误!';

          case 37:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, null, [[2, 27]]);
  }));

  return function trading(_x22, _x23) {
    return _ref12.apply(this, arguments);
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
app.use(_koaRoute["default"].get('/trading', trading)); // app.listen(3000)