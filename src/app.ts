import Koa from 'koa'
import route from 'koa-route'
import bodyParse from 'koa-bodyparser'
import axios from '../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index'
import { checkSignature } from './utils/check-signature'
import { WXBizDataCrypt } from './utils/WXBizDataCrypt'
import transformPoolQuery from './utils/transformPoolQuery'
import { authCode2Session } from './static-name/wechat-server'
import { appId, appSecret } from './static-name/mini-program-info'
import { statusCodeList, statusList } from './static-name/user-status'


const app = new Koa()
app.use(bodyParse())

const login = async (ctx: Koa.Context, next: () => Promise<any>) => {
    let isNewUser = true
    let isDeleteSuccess = false
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
                const { nickName, gender, country, province, city, avatarUrl } = openData
                // console.log('解密后 data: ', openData)
                try {
                    //1.先去查询数据库是否有该用户的记录，如果没有则是新用户，如果有就是老用户
                    const sql1 = `select * from user_info where open_id = ?`
                    const result1 = await transformPoolQuery(sql1, [openid])
                    console.log("aa",result1)
                    if (result1.length === 0) {
                        isNewUser = true
                    } else {
                        isNewUser = false
                    }
                    //2.如果不是新用户的话就将数据库的先前的用户数据
                    if (!isNewUser) {
                        const sql2 = `DELETE FROM user_info WHERE open_id = ?`
                        const result2 = await transformPoolQuery(sql2, [openid])
                        console.log("result2：", result2)
                        if (result2.affectedRows === 1) {
                            isDeleteSuccess = true
                        } else {
                            isDeleteSuccess = false
                        }
                    }
                    if (!isNewUser&&isDeleteSuccess || isNewUser) {
                        const sql3 = `INSERT INTO user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?)`
                        const result3=await transformPoolQuery(sql3, [openid, nickName, gender, country, province, city, avatarUrl])
                        if (result3.affectedRows === 1) {
                            console.log(`用户：${nickName}的登录开放数据已保存到数据库！`)
                            ctx.response.status = statusCodeList.success
                            ctx.response.body = {
                                status:statusList.success,
                                isNewUser:isNewUser
                            }
                        } else {
                            console.log(`用户：${nickName}的登录开放数据保存数据库失败！`)
                            ctx.response.status = statusCodeList.fail
                            ctx.response.body = '数据库操作失败！'
                        }
                    }
                } catch (err) {
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = '数据库操作失败！'
                }
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