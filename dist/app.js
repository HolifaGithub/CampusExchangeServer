"use strict";

var _koa = _interopRequireDefault(require("koa"));

var _koaRoute = _interopRequireDefault(require("koa-route"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var app = new _koa["default"]();

var login = function login(ctx, next) {
  console.log("context:", ctx);
  ctx.body = 'hello1234567';
};

app.use(_koaRoute["default"].get('/', login));
app.listen(3000);
