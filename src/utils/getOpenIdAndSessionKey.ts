import { authCode2Session } from '../static-name/wechat-server'
import axios from '../../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index'
import { appId, appSecret } from '../static-name/mini-program-info'
interface ReturnData{
    openid:string;
    session_key:string;
}
async function getOpenIdAndSessionKey(code:string):Promise<ReturnData> {
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
    return result.data
}

export default getOpenIdAndSessionKey