"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectionLimit = exports.database = exports.password = exports.user = exports.port = exports.mysql_server = void 0;
var dev_mysql_server = '127.0.0.1';
var cloud_mysql_server = '193.112.180.170';
var mysql_server = dev_mysql_server;
exports.mysql_server = mysql_server;
var port = 3306;
exports.port = port;
var user = 'root';
exports.user = user;
var password = '';
exports.password = password;
var database = 'xiaoyuanhuan';
exports.database = database;
var connectionLimit = 100;
exports.connectionLimit = connectionLimit;