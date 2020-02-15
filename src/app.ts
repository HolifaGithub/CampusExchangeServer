import Koa from 'koa'
import route from 'koa-route'
import bodyParse from 'koa-bodyparser'
import axios from '../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index'
import { checkSignature } from './utils/check-signature'
import { WXBizDataCrypt } from './utils/WXBizDataCrypt'
import { authCode2Session } from './static-name/wechat-server'
import { appId, appSecret } from './static-name/mini-program-info'
import { statusCodeList, statusList } from './static-name/user-status'

const app = new Koa()
app.use(bodyParse())

const login = async (ctx: Koa.Context, next: () => Promise<any>) => {
    const requestBody = ctx.request.body
    if (requestBody.code) {
        const { code, rawData, signature, encryptedData, iv } = requestBody
        //通过请求微信小程序的检验code的地址去获取openid和session_key
        const requestUrl = `${authCode2Session}`
        const result = await axios.get(requestUrl, {
            params: {
                appid: appId,
                secret: appSecret,
                js_code: code,
                grant_type: 'authorization_code'
            }
        })
        const { openid, session_key } = result.data
        if (openid && session_key) {
            //通过传入rawData和session_key组成校验字符串传入sha1算法函数里校验服务端得到的signature2与客户端传来的signature是否相同
            const checkSignatureResult = checkSignature(signature, rawData, session_key)
            if (checkSignatureResult) {
                //如果签名一致有效，则调用加密数据解密算法解密出用户的开放数据
                var pc = new WXBizDataCrypt(appId, session_key)
                var openData = pc.decryptData(encryptedData, iv)
                console.log('解密后 data: ', openData)
                ctx.response.status = statusCodeList.success
                ctx.response.body = statusList.success
            } else {
                ctx.response.status = statusCodeList.fail
                ctx.response.body = '您的签名signature有误!'
            }
        }
    } else {
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '您请求的用户code有误!'
    }


}
app.use(route.post('/login', login))
app.listen(3000)