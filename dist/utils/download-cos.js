"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _cosName = require("./cos-name");

var COS = require('cos-nodejs-sdk-v5');

var fs = require('fs');

function downLoadCos(fileName) {
  return new Promise(function (resolve, reject) {
    var cos = new COS({
      SecretId: _cosName.secretId,
      SecretKey: _cosName.secretKey
    });
    cos.getObject({
      Bucket: _cosName.bucket,

      /* 必须 */
      Region: _cosName.region,

      /* 必须 */
      Key: "".concat(_cosName.bucketDirName, "/").concat(fileName)
      /* 必须 */

    }, function (err, data) {
      if (err) reject(err);
      if (data) resolve(data);
    });
  });
}

var _default = downLoadCos;
exports["default"] = _default;