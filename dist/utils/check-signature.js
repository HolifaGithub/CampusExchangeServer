"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkSignature = checkSignature;

var _sha = require("./sha1");

function checkSignature(signature, rawData, session_key) {
  var checkStr = rawData + session_key;
  var signature2 = (0, _sha.sha1)(checkStr);
  return signature === signature2;
}