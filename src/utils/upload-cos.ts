const COS = require('cos-nodejs-sdk-v5');
const fs=require('fs')
import {
    secretId,
    secretKey,
    bucket,
    bucketDirName,
    region
}from './cos-name'
function upLoadCos(file){
    return new Promise<any>((resolve,reject)=>{
        let cos = new COS({
            SecretId: secretId,
            SecretKey: secretKey
        });
        cos.putObject({
            Bucket: bucket, /* 必须 */
            Region: region,    /* 必须 */
            Key:`${bucketDirName}/${file.name}`,              /* 必须 */
            StorageClass: 'STANDARD',
            Body: fs.createReadStream(file.path), // 上传文件对象
            // onProgress: function(progressData) {
            //     console.log(JSON.stringify(progressData));
            // }
        }, function(err, data) {
            if(err) reject(err)
            if(data) resolve(data)
        });
    })

}

export default upLoadCos