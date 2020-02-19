"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _cosName = require("./cos-name");

var COS = require('cos-nodejs-sdk-v5');

var fs = require('fs');

function upLoadCos(file, orderId) {
  return new Promise(function (resolve, reject) {
    var cos = new COS({
      SecretId: _cosName.secretId,
      SecretKey: _cosName.secretKey
    });
    cos.putObject({
      Bucket: _cosName.bucket,

      /* 必须 */
      Region: _cosName.region,

      /* 必须 */
      Key: "".concat(_cosName.bucketDirName, "/").concat(orderId, "/").concat(file.name),

      /* 必须 */
      StorageClass: 'STANDARD',
      Body: fs.createReadStream(file.path) // 上传文件对象
      // onProgress: function(progressData) {
      //     console.log(JSON.stringify(progressData));
      // }

    }, function (err, data) {
      if (err) reject(err);
      if (data) resolve(data);
    });
  });
}

var _default = upLoadCos;
exports["default"] = _default;