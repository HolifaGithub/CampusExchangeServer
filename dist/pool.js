"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mysql = _interopRequireDefault(require("mysql"));

var _mysqlServer = require("./static-name/mysql-server");

var pool = _mysql["default"].createPool({
  host: _mysqlServer.mysql_server,
  port: _mysqlServer.port,
  user: _mysqlServer.user,
  password: _mysqlServer.password,
  database: _mysqlServer.database,
  connectionLimit: _mysqlServer.connectionLimit
});

var _default = pool;
exports["default"] = _default;