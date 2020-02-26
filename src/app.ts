import Koa from 'koa'
import route from 'koa-route'
// import bodyParse from 'koa-bodyparser'
const body = require('koa-body')
import fs from 'fs'
import path from 'path'
import axios from '../node_modules/_@types_axios@0.14.0@@types/axios/node_modules/axios/index'
import { checkSignature } from './utils/check-signature'
import { WXBizDataCrypt } from './utils/WXBizDataCrypt'
import transformPoolQuery from './utils/transformPoolQuery'
import getOpenIdAndSessionKey from './utils/getOpenIdAndSessionKey'
import upLoadCos from './utils/upload-cos'
import { appId, appSecret } from './static-name/mini-program-info'
import { statusCodeList, statusList } from './static-name/user-status'
import { resolve } from 'dns'
import http from 'http'
import https from 'https'

const app = new Koa()
const keyContent = fs.readFileSync(path.join(__dirname, '../https/2.key'))
const certContent = fs.readFileSync(path.join(__dirname, '../https/1.crt'))
const httpsOption = {
    key: keyContent,
    cert: certContent
}
http.createServer(app.callback()).listen(3000);
// https.createServer(httpsOption, app.callback()).listen(3000)
app.use(body({ multipart: true }))
// app.use(bodyParse())

const login = async (ctx: Koa.Context, next: () => Promise<any>) => {
    let isNewUser = true
    let isDeleteSuccess = false
    const requestBody = ctx.request.body
    if (requestBody.code) {
        const { code, rawData, signature, encryptedData, iv } = requestBody
        const result = await getOpenIdAndSessionKey(code)
        const { openid, session_key } = result
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
                    const sql1 = `select * from user_info where open_id = ?;`
                    const result1 = await transformPoolQuery(sql1, [openid])
                    if (result1.length === 0) {
                        isNewUser = true
                    } else {
                        isNewUser = false
                    }
                    if (isNewUser) {
                        const sql2 = `INSERT INTO user_money(open_id) VALUES (?)`
                        const result2 = await transformPoolQuery(sql2, [openid])
                        if (result2.affectedRows === 1) {
                            console.log(`/login:用户：${nickName}的openid数据已插入user_money！`)
                        } else {
                            console.log(`/login:用户：${nickName}的openid数据插入user_money失败！`)
                        }

                        const sql3 = `INSERT INTO user_order(open_id) VALUES (?)`
                        const result3 = await transformPoolQuery(sql3, [openid])
                        if (result3.affectedRows === 1) {
                            console.log(`/login:用户：${nickName}的openid数据已插入user_order！`)
                        } else {
                            console.log(`/login:用户：${nickName}的openid数据插入user_order失败！`)
                        }
                    }
                    //2.如果不是新用户的话就将数据库的先前的用户数据清空
                    if (!isNewUser) {
                        const sql4 = `DELETE FROM user_info WHERE open_id = ?;`
                        const result4 = await transformPoolQuery(sql4, [openid])
                        if (result4.affectedRows === 1) {
                            isDeleteSuccess = true
                        } else {
                            isDeleteSuccess = false
                        }
                    }
                    if (!isNewUser && isDeleteSuccess || isNewUser) {
                        const sql5 = `INSERT INTO user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?);`
                        const result5 = await transformPoolQuery(sql5, [openid, nickName, gender, country, province, city, avatarUrl])
                        if (result5.affectedRows === 1) {
                            console.log(`/login:用户：${nickName}的登录开放数据已保存到数据库！`)
                            ctx.response.status = statusCodeList.success
                            ctx.response.body = {
                                status: statusList.success,
                                isNewUser: isNewUser
                            }
                        } else {
                            console.log(`/login:用户：${nickName}的登录开放数据保存数据库失败！`)
                            ctx.response.status = statusCodeList.fail
                            ctx.response.body = '数据库操作失败！'
                        }
                    }
                } catch (err) {
                    console.log('/login:数据库操作失败！', err)
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = '/login:数据库操作失败！'
                }
            } else {
                console.log('/login:您的签名signature有误!')
                ctx.response.status = statusCodeList.fail
                ctx.response.body = '/login:您的签名signature有误!'
            }
        }
    } else {
        console.log('/login:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/login:您请求的用户code有误!'
    }


}

const register = async (ctx: Koa.Context, next: () => Promise<any>) => {
    const requestBody = ctx.request.body
    if (requestBody.code) {
        const { code, selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address } = requestBody
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        if (openid) {
            try {
                const sql2 = `UPDATE user_info SET school = ?,` +
                    `id= ?,` +
                    `education=?,` +
                    `grade=?,` +
                    `collage=?,` +
                    `user_class=?,` +
                    `user_name=?,` +
                    `id_card=?,` +
                    `phone=?,` +
                    `user_address=?` +
                    `WHERE open_id = ?;`
                const result2 = await transformPoolQuery(sql2, [selectedSchool, studentId, education, grade, collage, userClass, name, idCard, phone, address, openid])
                if (result2.affectedRows === 1) {
                    console.log('/register:用户注册信息插值成功！')
                    ctx.response.status = statusCodeList.success
                    ctx.response.body = { status: statusList.success }
                } else {
                    console.log("/register:用户注册信息插值失败！")
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = statusList.fail
                }
            } catch (err) {
                console.log('/register:数据库操作失败！', err)
                ctx.response.status = statusCodeList.fail
                ctx.response.body = '/register:数据库操作失败！'
            }
        } else {
            console.log('/register:获取openid失败！')
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/register:获取openid失败！'
        }
    } else {
        console.log('/register:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/register:您请求的用户code有误!'
    }
}

const releaseGoods = async (ctx: Koa.Context, next: () => Promise<any>) => {
    const requestBody = ctx.request.body
    const { typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation, orderId, code, orderStatus } = requestBody
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        if (openid) {
            const sql = `INSERT INTO goods(order_id,order_time,order_status,open_id,type_one,type_two,type_three,name_input,goods_number,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,goods_describe,pics_location) VALUES (?,now(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
            const poolResult = await transformPoolQuery(sql, [orderId, orderStatus, openid, typeOne, typeTwo, typeThree, nameInput, goodsNumber, newAndOldDegree, mode, objectOfPayment, payForMePrice, payForOtherPrice, wantExchangeGoods, describe, picsLocation])
            if (poolResult.affectedRows === 1) {
                const sql2 = `update user_order set released = released + 1  where open_id =? `
                const poolResult2 = await transformPoolQuery(sql2, [openid])
                if (poolResult2.affectedRows === 1) {
                    console.log('/releasegoods:用户发布商品成功！')
                    ctx.response.status = statusCodeList.success
                    ctx.response.body = { status: statusList.success }
                } else {
                    console.log("/releasegoods:用户订单表发布订单数+1失败！")
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = statusList.fail
                }
            } else {
                console.log("/releasegoods:用户发布商品失败！")
                ctx.response.status = statusCodeList.fail
                ctx.response.body = statusList.fail
            }
        } else {
            console.log('/releasegoods:获取openid失败！')
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/releasegoods:获取openid失败！'
        }
    } else {
        console.log('/releasegoods:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/releasegoods:您请求的用户code有误!'
    }
}
const releasegoodspics = async (ctx, next: () => Promise<any>) => {
    const { orderId } = ctx.request.body
    const file = ctx.request.files.pic
    const upLoadCosResult = await upLoadCos(file, orderId)
    if (upLoadCosResult.statusCode === 200) {  //如果状态码是200则说明图片上传cos成功
        const location = upLoadCosResult.Location
        console.log('/releasegoodspics:图片上传腾讯云对象存储成功！')
        ctx.response.status = statusCodeList.success
        ctx.response.body = {
            status: statusList.success,
            location: location
        }
    } else {
        console.log('/releasegoodspics:图片上传腾讯云对象存储失败！')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/releasegoodspics:图片上传腾讯云对象存储失败！'
    }
    // // 创建可读流 
    // const reader = fs.createReadStream(file.path)
    // let filePath = path.join(__dirname, '../upload') + `/${file.name}`
    // // 创建可写流 
    // const upStream = fs.createWriteStream(filePath);
    // // 可读流通过管道写入可写流 
    // reader.pipe(upStream);
    // ctx.response.body = "上传成功";
}

const getGoodsInfo = async (ctx, next: () => Promise<any>) => {
    const { code, orderId } = ctx.request.query
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            const { nick_name, avatar_url, school } = poolResult1[0]
            const sql2 = `SELECT * FROM goods WHERE order_id =?`
            const poolResult2 = await transformPoolQuery(sql2, [orderId])
            const { order_id, order_time, order_status, type_one, type_two, type_three, name_input, goods_number, new_and_old_degree, mode, object_of_payment, pay_for_me_price, pay_for_other_price, want_exchange_goods, goods_describe, pics_location } = poolResult2[0]
            if (poolResult1.length === 1 && poolResult2.length === 1) {
                console.log('/getgoodsinfo:获取商品详情成功！')
            }
            ctx.response.body = {
                status: statusList.success,
                orderId: order_id,
                orderTime: order_time,
                orderStatus: order_status,
                typeOne: type_one,
                typeTwo: type_two,
                typeThree: type_three,
                nameInput: name_input,
                goodsNumber: goods_number,
                newAndOldDegree: new_and_old_degree,
                mode: mode,
                objectOfPayment: object_of_payment,
                payForMePrice: pay_for_me_price,
                payForOtherPrice: pay_for_other_price,
                wantExchangeGoods: want_exchange_goods,
                describe: goods_describe,
                picsLocation: pics_location,
                nickName: nick_name,
                avatarUrl: avatar_url,
                school: school
            }
            ctx.response.statusCode = statusCodeList.success
        } catch (err) {
            console.log('/getgoodsinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getgoodsinfo:数据库操作失败！'
        }

    } else {
        console.log('/getgoodsinfo:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getgoodsinfo:您请求的用户code有误!'
    }
}

const getUserInfo = async (ctx, next: () => Promise<any>) => {
    const { code, orderId } = ctx.request.query
    if (code && !orderId) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT * FROM user_info WHERE open_id = ? `
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length === 1) {
                const { nick_name, gender, country, province, city, avatar_url, school, id, education, grade, collage, user_class, user_name, id_card, phone, user_address } = poolResult1[0]
                console.log("/getuserinfo:获取用户信息成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    nickName: nick_name,
                    gender: gender,
                    country: country,
                    province: province,
                    city: city,
                    avatarUrl: avatar_url,
                    school: school,
                    id: id,
                    education: education,
                    grade: grade,
                    collage: collage,
                    userClass: user_class,
                    userName: user_name,
                    idCard: id_card,
                    phone: phone,
                    userAddress: user_address
                }
            }
        } catch (err) {
            console.log('/getuserinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getuserinfo:数据库操作失败！'
        }
    } else {
        console.log('/getuserinfo:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getuserinfo:您请求的用户code有误!'
    }
}

const getMoney = async (ctx, next: () => Promise<any>) => {
    const { code } = ctx.request.query
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT * FROM user_money WHERE open_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length === 1) {
                const { balance } = poolResult1[0]
                console.log("/getmoney:获取用户余额成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    balance: balance
                }
            }
        } catch (err) {
            console.log('/getmoney:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getmoney:数据库操作失败！'
        }
    } else {
        console.log('/getmoney:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getmoney:您请求的用户code有误!'
    }
}

const getOrderInfo = async (ctx, next: () => Promise<any>) => {
    const { code } = ctx.request.query
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT * FROM user_order WHERE open_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length === 1) {
                const { released, trading, bougth, saled } = poolResult1[0]
                console.log("/getorderinfo:获取用户订单信息成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    released,
                    trading,
                    bougth,
                    saled
                }
            }
        } catch (err) {
            console.log('/getorderinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getmoney:数据库操作失败！'
        }
    } else {
        console.log('/getorderinfo:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getorderinfo:您请求的用户code有误!'
    }
}

interface ReturnDataObject {
    orderId: string;
    nameInput: string;
    newAndOldDegree: string;
    mode: string;
    objectOfPayment: string;
    payForMePrice: number;
    payForOtherPrice: number;
    wantExchangeGoods: string;
    topPicSrc: string;
    watchedPeople: number;
    nickName: string;
    avatarUrl: string;
}
const getWaterFall = async (ctx, next: () => Promise<any>) => {
    const { code, page } = ctx.request.query
    const startIndex = (page - 1) * 2
    const returnDatas: ReturnDataObject[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE open_id = ? AND order_status = 'released' LIMIT ?,2;`
            const poolResult1 = await transformPoolQuery(sql1, [openid, startIndex])
            // console.log(poolResult1)
            if (poolResult1.length > 0) {
                if (poolResult1.length % 2 !== 0) {
                    poolResult1.pop()
                }
                await new Promise((resolve, reject) => {
                    poolResult1.map(async (data) => {
                        const sql2 = `SELECT nick_name,avatar_url from user_info WHERE open_id =?`
                        const poolResult2 = await transformPoolQuery(sql2, [data.open_id])
                        if (poolResult2.length === 1) {
                            let topPicSrc
                            const len = data.pics_location.length
                            if (len === 0) {
                                topPicSrc = ''
                            } else {
                                topPicSrc = 'https://' + data.pics_location.split(';')[0]
                            }
                            returnDatas.push({
                                orderId: data.order_id,
                                nameInput: data.name_input,
                                newAndOldDegree: data.new_and_old_degree,
                                mode: data.mode,
                                objectOfPayment: data.object_of_payment,
                                payForMePrice: data.pay_for_me_price,
                                payForOtherPrice: data.pay_for_other_price,
                                wantExchangeGoods: data.want_exchange_goods,
                                topPicSrc: topPicSrc,
                                watchedPeople: data.watched_people,
                                nickName: poolResult2[0].nick_name,
                                avatarUrl: poolResult2[0].avatar_url
                            })
                        }
                        if (returnDatas.length === poolResult1.length) {
                            resolve()
                        }
                    })
                }).then(() => {
                    console.log("/getwaterfall:获取waterfall成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas: returnDatas
                    }
                })
            } else {
                console.log("/getwaterfall:获取waterfall成功，但无数据！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    returnDatas: returnDatas
                }
            }
        } catch (err) {
            console.log('/getwaterfall:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getwaterfall:数据库操作失败！'
        }
    } else {
        console.log('/getwaterfall:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getwaterfall:您请求的用户code有误!'
    }
}

const pay = async (ctx, next: () => Promise<any>) => {
    const { code, orderId, payForMePrice, payForOtherPrice } = ctx.request.body
    // console.log(payForMePrice,payForMePrice===0,payForOtherPrice,payForOtherPrice===0)
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            if (payForMePrice !== 0) {
                const sql1 = `SELECT balance FROM user_money WHERE open_id =?`
                const poolResult1 = await transformPoolQuery(sql1, [openid])
                if (poolResult1.length === 1) {
                    const balance = poolResult1[0].balance
                    if (balance >= payForMePrice) {
                        const sql2 = `UPDATE  user_money SET balance = balance - ?,pay=pay + ?  where open_id =? `
                        const poolResult2 = await transformPoolQuery(sql2, [payForMePrice, payForMePrice, openid])
                        if (poolResult2.affectedRows === 1) {
                            const sql3 = `SELECT open_id FROM goods WHERE order_id =?`
                            const poolResult3 = await transformPoolQuery(sql3, [orderId])
                            if (poolResult3.length === 1) {
                                const salederOpenId = poolResult3[0].open_id
                                const sql4 = `UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?`
                                const poolResult4 = await transformPoolQuery(sql4, ['trading', openid, orderId])
                                if (poolResult4.affectedRows === 1) {
                                    const sql5 = `UPDATE user_order SET trading = trading +1 WHERE open_id =?`
                                    const poolResult5 = await transformPoolQuery(sql5, [openid])
                                    if (poolResult5.affectedRows === 1) {
                                        const sql6 = `UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?`
                                        const poolResult6 = await transformPoolQuery(sql6, [salederOpenId])
                                        if (poolResult6.affectedRows === 1) {
                                            console.log('/pay:支付成功！')
                                            ctx.response.status = statusCodeList.success
                                            ctx.response.body = {
                                                status: statusList.success
                                            }
                                        }
                                    }

                                }
                            }
                        } else {
                            console.log('/pay:余额不足，支付失败！')
                            ctx.response.status = statusCodeList.fail
                            ctx.response.body = {
                                status: statusList.fail
                            }
                        }
                    }
                }
            }

            if (payForOtherPrice !== 0) {
                const sql1 = `SELECT balance FROM user_money WHERE open_id =?`
                const poolResult1 = await transformPoolQuery(sql1, [openid])
                if (poolResult1.length === 1) {
                    const balance = poolResult1[0].balance
                    if (balance >= payForMePrice) {
                        const sql2 = `UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id =? `
                        const poolResult2 = await transformPoolQuery(sql2, [payForOtherPrice, payForOtherPrice, openid])
                        if (poolResult2.affectedRows === 1) {
                            const sql3 = `SELECT open_id FROM goods WHERE order_id =?`
                            const poolResult3 = await transformPoolQuery(sql3, [orderId])
                            if (poolResult3.length === 1) {
                                const salederOpenId = poolResult3[0].open_id
                                const sql4 = `UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?`
                                const poolResult4 = await transformPoolQuery(sql4, ['trading', openid, orderId])
                                if (poolResult4.affectedRows === 1) {
                                    const sql5 = `UPDATE user_money SET balance = balance - ? ,pay = pay + ? WHERE open_id = ?`
                                    const poolResult5 = await transformPoolQuery(sql5, [payForOtherPrice, payForOtherPrice, salederOpenId])
                                    if (poolResult5.affectedRows === 1) {
                                        const sql6 = `UPDATE user_order SET bougth = bougth + 1 WHERE open_id =?`
                                        const poolResult6 = await transformPoolQuery(sql6, [openid])
                                        if (poolResult6.affectedRows === 1) {
                                            const sql7 = `UPDATE user_order SET saled = saled + 1 WHERE open_id =?`
                                            const poolResult7 = await transformPoolQuery(sql7, [salederOpenId])
                                            if (poolResult7.affectedRows === 1) {
                                                console.log('/pay:支付成功！')
                                                ctx.response.status = statusCodeList.success
                                                ctx.response.body = {
                                                    status: statusList.success
                                                }
                                            }
                                        }
                                    }

                                }
                            }
                        } else {
                            console.log('/pay:余额不足，支付失败！')
                            ctx.response.status = statusCodeList.fail
                            ctx.response.body = {
                                status: statusList.fail
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/pay:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/pay:数据库操作失败！'
        }
    } else {
        console.log('/pay:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/pay:您请求的用户code有误!'
    }
}


const trading = async (ctx, next: () => Promise<any>) => {
    const { orderId } = ctx.request.query
    if (orderId) {
        try {
            const sql1 = `SELECT open_id,buy_open_id,pay_for_me_price,pay_for_other_price FROM goods WHERE order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [orderId])
            if (poolResult1.length === 1) {
                const openId = poolResult1[0].open_id
                const buyOpenId = poolResult1[0].buy_open_id
                const payForMePrice = poolResult1[0].pay_for_me_price
                const payForOtherPrice=poolResult1[0].pay_for_other_price
                if(parseFloat(payForMePrice)!==0){
                    const sql2 = `SELECT phone,user_address FROM user_info WHERE open_id = ?`
                    const poolResult2 = await transformPoolQuery(sql2, [openId])
                    if (poolResult2.length === 1) {
                        const salederPhone = poolResult2[0].phone
                        const salederAddress = poolResult2[0].user_address
                        const sql3 = `SELECT phone,user_address,avatar_url,nick_name FROM user_info WHERE open_id = ?`
                        const poolResult3 = await transformPoolQuery(sql3, [buyOpenId])
                        if (poolResult3.length === 1) {
                            const buierPhone = poolResult3[0].phone
                            const buierAddress = poolResult3[0].user_address
                            const buierAvatarUrl = poolResult3[0].avatar_url
                            const buierNickName = poolResult3[0].nick_name
                            const orderCode = openId.slice(6, 18) + ',' + orderId.slice(0, 12) + ',' + buyOpenId.slice(6, 18)
                            const sql4 = `UPDATE user_money SET balance = balance + ? ,income = income + ? WHERE open_id = ?`
                            const poolResult4 = await transformPoolQuery(sql4, [parseFloat(payForMePrice), parseFloat(payForMePrice), openId])
                            if (poolResult4.affectedRows === 1) {
                                const sql5=`UPDATE user_order SET trading = trading - 1,saled = saled +1 WHERE open_id =? `
                                const poolResult5 = await transformPoolQuery(sql5, [openId])
                                if(poolResult5.affectedRows===1){
                                    const sql6=`UPDATE user_order SET trading = trading - 1,bougth = bougth +1 WHERE open_id =? `
                                    const poolResult6 = await transformPoolQuery(sql6, [buyOpenId])
                                    if(poolResult6.affectedRows===1){
                                        const sql7=`UPDATE goods SET order_status = ? WHERE order_id =? `
                                        const poolResult7 = await transformPoolQuery(sql7, ['saled',buyOpenId])
                                        if(poolResult7.affectedRows===1){
                                            console.log('/trading:交易成功')
                                            ctx.response.status = statusCodeList.success
                                            ctx.response.body = {
                                                status: statusList.success,
                                                salederPhone: salederPhone,
                                                salederAddress: salederAddress,
                                                buierPhone: buierPhone,
                                                buierAddress: buierAddress,
                                                buierAvatarUrl: buierAvatarUrl,
                                                buierNickName: buierNickName,
                                                orderCode: orderCode
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }


                if(parseFloat(payForOtherPrice)!==0){
                    const sql2 = `SELECT phone,user_address FROM user_info WHERE open_id = ?`
                    const poolResult2 = await transformPoolQuery(sql2, [openId])
                    if (poolResult2.length === 1) {
                        const salederPhone = poolResult2[0].phone
                        const salederAddress = poolResult2[0].user_address
                        const sql3 = `SELECT phone,user_address,avatar_url,nick_name FROM user_info WHERE open_id = ?`
                        const poolResult3 = await transformPoolQuery(sql3, [buyOpenId])
                        if (poolResult3.length === 1) {
                            const buierPhone = poolResult3[0].phone
                            const buierAddress = poolResult3[0].user_address
                            const buierAvatarUrl = poolResult3[0].avatar_url
                            const buierNickName = poolResult3[0].nick_name
                            const orderCode = openId.slice(6, 18) + ',' + orderId.slice(0, 12) + ',' + buyOpenId.slice(6, 18)
                            const sql4 = `UPDATE user_money SET balance = balance - ? ,pay = pay + ? WHERE open_id = ?`
                            const poolResult4 = await transformPoolQuery(sql4, [parseFloat(payForOtherPrice), parseFloat(payForOtherPrice), openId])
                            if (poolResult4.affectedRows === 1) {
                                const sql5=`UPDATE user_order SET trading = trading - 1,saled = saled +1 WHERE open_id =? `
                                const poolResult5 = await transformPoolQuery(sql5, [openId])
                                if(poolResult5.affectedRows===1){
                                    const sql6=`UPDATE user_order SET trading = trading - 1,bougth = bougth +1 WHERE open_id =? `
                                    const poolResult6 = await transformPoolQuery(sql6, [buyOpenId])
                                    if(poolResult6.affectedRows===1){
                                        const sql7=`UPDATE goods SET order_status = ? WHERE order_id =? `
                                        const poolResult7 = await transformPoolQuery(sql7, ['saled',buyOpenId])
                                        if(poolResult7.affectedRows===1){
                                            console.log('/trading:交易成功')
                                            ctx.response.status = statusCodeList.success
                                            ctx.response.body = {
                                                status: statusList.success,
                                                salederPhone: salederPhone,
                                                salederAddress: salederAddress,
                                                buierPhone: buierPhone,
                                                buierAddress: buierAddress,
                                                buierAvatarUrl: buierAvatarUrl,
                                                buierNickName: buierNickName,
                                                orderCode: orderCode
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/trading:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/trading:数据库操作失败！'
        }
    } else {
        console.log('/trading:您请求的用户orderId有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/trading:您请求的用户orderId有误!'
    }
}
app.use(route.post('/login', login))
app.use(route.post('/register', register))
app.use(route.post('/releasegoods', releaseGoods))
app.use(route.post('/releasegoodspics', releasegoodspics))
app.use(route.get('/getgoodsinfo', getGoodsInfo))
app.use(route.get('/getuserinfo', getUserInfo))
app.use(route.get('/getmoney', getMoney))
app.use(route.get('/getorderinfo', getOrderInfo))
app.use(route.get('/getwaterfall', getWaterFall))
app.use(route.post('/pay', pay))
app.use(route.get('/trading', trading))
// app.listen(3000)