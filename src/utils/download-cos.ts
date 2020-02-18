import {
    secretId,
    secretKey,
    bucket,
    downLoadDir,
    bucketDirName,
    region
}from './cos-name'
const COS = require('cos-nodejs-sdk-v5');
const fs=require('fs')
function downLoadCos(fileName){
    return new Promise<any>((resolve,reject)=>{
        let cos = new COS({
            SecretId: secretId,
            SecretKey: secretKey
        });
        cos.getObject({
            Bucket: bucket, /* 必须 */
            Region: region,    /* 必须 */
            Key: `${bucketDirName}/${fileName}`, /* 必须 */
        }, function(err, data) {
            if(err) reject(err)
            if(data) resolve(data)
        });
    })
}

export default downLoadCos