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
import SearchKeyWord from './utils/search-key-word'
import { appId, appSecret } from './static-name/mini-program-info'
import { statusCodeList, statusList } from './static-name/user-status'
import { resolve } from 'dns'
import http from 'http'
import https from 'https'
import { start } from 'repl'
import WebSocket from 'ws'


const app = new Koa()
const keyContent = fs.readFileSync(path.join(__dirname, '../https/2.key'))
const certContent = fs.readFileSync(path.join(__dirname, '../https/1.crt'))
const httpsOption = {
    key: keyContent,
    cert: certContent
}
// const server = http.createServer(app.callback()).listen(3000)
const server = https.createServer(httpsOption, app.callback()).listen(3000)


const wss = new WebSocket.Server({ server })
const connectedUser = []
wss.on('connection', function connection(ws) {
    console.log('ws连接成功！')
    ws.on('message', async (msg: string) => {
        const result = await getOpenIdAndSessionKey(msg)
        const { openid } = result
        if (openid || !ws.openId) {
            ws.openId = openid
        }
        // wss.clients.forEach((client) => {
        //     console.log(client.openId)
        //     client.send('kkk')
        // })
    })

})


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
            // const checkSignatureResult = checkSignature(signature, rawData, session_key)
            // if (checkSignatureResult) {
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
                        const sql4 = `UPDATE user_info SET nick_name='',gender=0 ,country='',province='',city='',avatar_url='' WHERE open_id = ?;`
                        const result4 = await transformPoolQuery(sql4, [openid])
                        if (result4.affectedRows === 1) {
                            isDeleteSuccess = true
                        } else {
                            isDeleteSuccess = false
                        }
                    }
                    if (!isNewUser && isDeleteSuccess) {
                        const sql5 = `UPDATE  user_info SET nick_name=?,gender=?,country=?,province=?,city=?,avatar_url=? WHERE open_id = ?;`
                        const result5 = await transformPoolQuery(sql5, [nickName, gender, country, province, city, avatarUrl, openid])
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
                    if (isNewUser) {
                        const sql6 = `INSERT INTO  user_info(open_id,nick_name,gender,country,province,city,avatar_url) VALUES (?,?,?,?,?,?,?);`
                        const result6 = await transformPoolQuery(sql6, [openid, nickName, gender, country, province, city, avatarUrl])
                        if (result6.affectedRows === 1) {
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
            // } else {
            //     console.log('/login:您的签名signature有误!')
            //     ctx.response.status = statusCodeList.fail
            //     ctx.response.body = '/login:您的签名signature有误!'
            // }
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
    if (code && orderId.length > 0) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT open_id FROM goods WHERE order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [orderId])
            if (poolResult1.length === 1) {
                const salerOpenId = poolResult1[0].open_id
                const sql2 = `SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;`
                const poolResult2 = await transformPoolQuery(sql2, [salerOpenId])
                if (poolResult2.length === 1) {
                    const { nick_name, avatar_url, school } = poolResult2[0]
                    const sql3 = `SELECT * FROM goods WHERE order_id =?`
                    const poolResult3 = await transformPoolQuery(sql3, [orderId])
                    if (poolResult3.length === 1) {
                        const { order_id, order_time, order_status, type_one, type_two, type_three, name_input, goods_number, new_and_old_degree, mode, object_of_payment, pay_for_me_price, pay_for_other_price, want_exchange_goods, goods_describe, pics_location } = poolResult3[0]
                        const sql4 = `SELECT * FROM user_care WHERE open_id = ? AND concerned_open_id = ?`
                        const poolResult4 = await transformPoolQuery(sql4, [openid, salerOpenId])
                        let isCare = false
                        let isCollect = false
                        let isMe = false
                        if (poolResult4.length === 1) {
                            isCare = true
                        }
                        if (openid === salerOpenId) {
                            isMe = true
                        }
                        const sql5 = `SELECT * FROM user_collect WHERE open_id = ? AND collect_order_id = ?`
                        const poolResult5 = await transformPoolQuery(sql5, [openid, orderId])
                        if (poolResult5.length === 1) {
                            isCollect = true
                        }
                        const sql6 = `UPDATE goods SET watched_people = watched_people +1 WHERE order_id = ?`
                        const poolResult6 = await transformPoolQuery(sql6, [orderId])
                        if (poolResult6.affectedRows === 1) {
                            console.log('/getgoodsinfo:获取商品详情成功！')
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
                                school: school,
                                isCare: isCare,
                                isCollect: isCollect,
                                isMe: isMe
                            }
                            ctx.response.statusCode = statusCodeList.success
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/getgoodsinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getgoodsinfo:数据库操作失败！'
        }

    } else if (code && orderId.length === 0) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT nick_name,avatar_url,school FROM user_info WHERE open_id = ?;`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length === 1) {
                const { nick_name, avatar_url, school } = poolResult1[0]
                const sql2 = `SELECT * FROM goods WHERE order_id =?`
                const poolResult2 = await transformPoolQuery(sql2, [orderId])
                if (poolResult2.length === 1) {
                    const { order_id, order_time, order_status, type_one, type_two, type_three, name_input, goods_number, new_and_old_degree, mode, object_of_payment, pay_for_me_price, pay_for_other_price, want_exchange_goods, goods_describe, pics_location } = poolResult2[0]
                    console.log('/getgoodsinfo:获取商品详情成功！')
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
                        school: school,
                        isMe: true
                    }
                    ctx.response.statusCode = statusCodeList.success
                }
            }
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
    const startIndex = (page - 1) * 4
    const returnDatas: ReturnDataObject[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE open_id != ? AND order_status = 'released' LIMIT ?,4;`
            const poolResult1 = await transformPoolQuery(sql1, [openid, startIndex])
            if (poolResult1.length > 1) {
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
                //查询买家的余额
                const sql1 = `SELECT balance FROM user_money WHERE open_id =?`
                const poolResult1 = await transformPoolQuery(sql1, [openid])
                if (poolResult1.length === 1) {
                    const balance = poolResult1[0].balance
                    if (balance >= payForMePrice) {
                        //买家的余额减去商品的价格，支付的总额加上买的商品的价格
                        const sql2 = `UPDATE  user_money SET balance = balance - ?,pay=pay + ?  where open_id =? `
                        const poolResult2 = await transformPoolQuery(sql2, [payForMePrice, payForMePrice, openid])
                        if (poolResult2.affectedRows === 1) {
                            //通过order_id查询卖家的open_id
                            const sql3 = `SELECT open_id FROM goods WHERE order_id =?`
                            const poolResult3 = await transformPoolQuery(sql3, [orderId])
                            if (poolResult3.length === 1) {
                                const salerOpenId = poolResult3[0].open_id
                                //更新商品表设置商品的状态为tarding，设置买家的open_id
                                const sql4 = `UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?`
                                const poolResult4 = await transformPoolQuery(sql4, ['trading', openid, orderId])
                                if (poolResult4.affectedRows === 1) {
                                    //更新买家order表的trading数量+1
                                    const sql5 = `UPDATE user_order SET trading = trading +1 WHERE open_id =?`
                                    const poolResult5 = await transformPoolQuery(sql5, [openid])
                                    if (poolResult5.affectedRows === 1) {
                                        //更新卖家order表released数量-1，trading数量+1
                                        const sql6 = `UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?`
                                        const poolResult6 = await transformPoolQuery(sql6, [salerOpenId])
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
                                status: statusList.fail,
                                msg: '支付失败！您的余额不足，请充值！'
                            }
                        }
                    }
                }
            }

            if (payForOtherPrice !== 0) {
                //查询卖家的open_id
                const sql1 = `SELECT open_id FROM goods WHERE order_id =?`
                const poolResult1 = await transformPoolQuery(sql1, [orderId])
                if (poolResult1.length === 1) {
                    const salerOpenId = poolResult1[0].open_id
                    //查询卖家money表的余额
                    const sql2 = `SELECT balance FROM user_money WHERE open_id =?`
                    const poolResult2 = await transformPoolQuery(sql2, [salerOpenId])
                    if (poolResult2.length === 1) {
                        const balance = poolResult2[0].balance
                        if (balance >= payForOtherPrice) {
                            //如果余额大于要支付给买家的钱的话就将其余额减去给买家的钱，支付总额加上给买家的钱
                            const sql3 = `UPDATE user_money SET balance = balance - ? ,pay = pay + ? WHERE open_id = ?`
                            const poolResult3 = await transformPoolQuery(sql3, [payForOtherPrice, payForOtherPrice, salerOpenId])
                            if (poolResult3.affectedRows === 1) {
                                //更新商品表设置商品状态为trading，设置买家的open_id
                                const sql4 = `UPDATE goods SET order_status = ?,buy_open_id = ? WHERE order_id = ?`
                                const poolResult4 = await transformPoolQuery(sql4, ['trading', openid, orderId])
                                if (poolResult4.affectedRows === 1) {
                                    //更新买家order表的trading数量+1
                                    const sql5 = `UPDATE user_order SET trading = trading +1 WHERE open_id =?`
                                    const poolResult5 = await transformPoolQuery(sql5, [openid])
                                    if (poolResult5.affectedRows === 1) {
                                        //更新卖家order表released数量-1，trading数量+1
                                        const sql6 = `UPDATE user_order SET released = released -1 , trading = trading +1 WHERE open_id =?`
                                        const poolResult6 = await transformPoolQuery(sql6, [salerOpenId])
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
                                status: statusList.fail,
                                msg: '交易失败，对方的余额不足以支付给您！'
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
                        const orderCode = orderId
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

const search = async (ctx, next: () => Promise<any>) => {
    const { value, page, searchStart } = ctx.request.query
    const startIndex = (page - 1) * 6
    const returnDatas: ReturnDataObject[] = []
    if (value.length > 0) {
        const handleValue = value.replace(/\s*/g,"")
        try {
            const sql1 = `SELECT type_one,type_two,type_three,name_input FROM goods`
            const typeOneNameArray: string[] = []
            const typeTwoNameArray: string[] = []
            const typeThreeNameArray: string[] = []
            const nameInputArray: string[] = []
            const poolResult1 = await transformPoolQuery(sql1, [])
            if (poolResult1.length > 0) {
                for (let row of poolResult1) {
                    if (row.type_one) {
                        typeOneNameArray.push(row.type_one)
                    }
                    if (row.type_two) {
                        typeTwoNameArray.push(row.type_two)
                    }
                    if (row.type_three) {
                        typeThreeNameArray.push(row.type_three)
                    }
                    if (row.name_input) {
                        nameInputArray.push(row.name_input)
                    }
                }
                // console.log(typeOneNameArray,typeTwoNameArray,typeThreeNameArray,nameInputArray)
                let searchResult = SearchKeyWord(handleValue, typeOneNameArray, typeTwoNameArray, typeThreeNameArray, nameInputArray, searchStart)
                if (searchResult) {
                    const sql2 = `SELECT order_id,open_id,name_input,new_and_old_degree,mode,object_of_payment,pay_for_me_price,pay_for_other_price,want_exchange_goods,pics_location,watched_people FROM goods WHERE ${searchResult.col} = ? AND order_status = 'released' LIMIT ?,6;`
                    const poolResult2 = await transformPoolQuery(sql2, [searchResult.value, startIndex])
                    if(poolResult2.length>0){
                        await new Promise((resolve, reject) => {
                            poolResult2.map(async (data) => {
                                const sql3 = `SELECT nick_name,avatar_url from user_info WHERE open_id =?`
                                const poolResult3 = await transformPoolQuery(sql3, [data.open_id])
                                if (poolResult3.length === 1) {
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
                                        nickName: poolResult3[0].nick_name,
                                        avatarUrl: poolResult3[0].avatar_url
                                    })
                                }
                                if (returnDatas.length === poolResult2.length) {
                                    resolve()
                                }
                            })
                        }).then(() => {
                            console.log("/search:搜索成功！")
                            ctx.response.status = statusCodeList.success
                            ctx.response.body = {
                                status: statusList.success,
                                returnDatas: returnDatas
                            }
                        })
                    }else{
                        console.log('/search:没有更多数据了!')
                        ctx.response.status = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                            msg: ' /search:没有更多数据了!',
                            returnDatas: returnDatas
                        }
                    }
                } else {
                    console.log('/search:搜索结果为空！')
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = {
                        status: statusList.fail,
                        msg: ' /search:搜索结果为空！'
                    }
                }
            }else{
                console.log('/search:商品表为空！')
                ctx.response.status = statusCodeList.fail
                ctx.response.body = {
                    status: statusList.fail,
                    msg: ' /search:商品表为空！'
                }
            }
        } catch (err) {
            console.log('/search:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/search:数据库操作失败！'
        }

    } else {
        console.log('/search:用户的搜索词为空!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/search:用户的搜索词为空!'
    }
}

interface OrderListReturnDatas {
    orderId: string;
    nameInput: string;
    newAndOldDegree: string;
    topPicSrc: string;
    typeOne: string;
    typeTwo: string;
    typeThree: string;
    goodsNumber: string;
}

const orderList = async (ctx, next: () => Promise<any>) => {
    const { code, orderStatus, orderInfo, page } = ctx.request.query
    const startIndex = (page - 1) * 7
    let orderListReturnDatas: OrderListReturnDatas[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            if (orderInfo == 'released' || orderInfo == 'saled') {
                const sql1 = `SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE open_id = ? AND order_status = ? LIMIT ?,7 `
                const poolResult1 = await transformPoolQuery(sql1, [openid, orderStatus, startIndex])
                if (poolResult1.length > 0) {
                    await new Promise((resolve, reject) => {
                        poolResult1.map(async (data) => {
                            let topPicSrc
                            const len = data.pics_location.length
                            if (len === 0) {
                                topPicSrc = ''
                            } else {
                                topPicSrc = 'https://' + data.pics_location.split(';')[0]
                            }
                            orderListReturnDatas.push({
                                orderId: data.order_id,
                                nameInput: data.name_input,
                                newAndOldDegree: data.new_and_old_degree,
                                topPicSrc: topPicSrc,
                                typeOne: data.type_one,
                                typeTwo: data.type_two,
                                typeThree: data.type_three,
                                goodsNumber: data.goods_number
                            })
                            if (orderListReturnDatas.length === poolResult1.length) {
                                resolve()
                            }
                        })
                    }).then(() => {
                        console.log("/orderlist:获取orderlist成功！")
                        ctx.response.statusCode = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                            returnDatas: orderListReturnDatas,
                            orderStatus: orderStatus,
                            orderInfo: orderInfo
                        }
                    })
                } else {
                    console.log('/orderlist:该用户此状态下无订单！')
                    ctx.response.status = statusCodeList.success
                    ctx.response.body = {
                        status: 'success',
                        returnDatas: orderListReturnDatas,
                        orderStatus: orderStatus,
                        orderInfo: orderInfo
                    }
                }
            }
            if (orderInfo == 'trading') {
                const sql1 = `SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE (buy_open_id = ? OR open_id = ?)AND order_status = ?`
                const poolResult1 = await transformPoolQuery(sql1, [openid, openid, orderStatus])
                if (poolResult1.length > 0) {
                    await new Promise((resolve, reject) => {
                        poolResult1.map(async (data) => {
                            let topPicSrc
                            const len = data.pics_location.length
                            if (len === 0) {
                                topPicSrc = ''
                            } else {
                                topPicSrc = 'https://' + data.pics_location.split(';')[0]
                            }
                            orderListReturnDatas.push({
                                orderId: data.order_id,
                                nameInput: data.name_input,
                                newAndOldDegree: data.new_and_old_degree,
                                topPicSrc: topPicSrc,
                                typeOne: data.type_one,
                                typeTwo: data.type_two,
                                typeThree: data.type_three,
                                goodsNumber: data.goods_number
                            })
                            if (orderListReturnDatas.length === poolResult1.length) {
                                resolve()
                            }
                        })
                    }).then(() => {
                        console.log("/orderlist:获取orderlist成功！")
                        ctx.response.statusCode = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                            returnDatas: orderListReturnDatas,
                            orderStatus: orderStatus,
                            orderInfo: orderInfo
                        }
                    })
                } else {
                    console.log('/orderlist:该用户此状态下无订单！')
                    ctx.response.status = statusCodeList.success
                    ctx.response.body = {
                        status: 'success',
                        returnDatas: orderListReturnDatas
                    }
                }
            }

            if (orderInfo == 'bougth') {
                const sql1 = `SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE buy_open_id = ? AND order_status = ?`
                const poolResult1 = await transformPoolQuery(sql1, [openid, orderStatus])
                if (poolResult1.length > 0) {
                    await new Promise((resolve, reject) => {
                        poolResult1.map(async (data) => {
                            let topPicSrc
                            const len = data.pics_location.length
                            if (len === 0) {
                                topPicSrc = ''
                            } else {
                                topPicSrc = 'https://' + data.pics_location.split(';')[0]
                            }
                            orderListReturnDatas.push({
                                orderId: data.order_id,
                                nameInput: data.name_input,
                                newAndOldDegree: data.new_and_old_degree,
                                topPicSrc: topPicSrc,
                                typeOne: data.type_one,
                                typeTwo: data.type_two,
                                typeThree: data.type_three,
                                goodsNumber: data.goods_number
                            })
                            if (orderListReturnDatas.length === poolResult1.length) {
                                resolve()
                            }
                        })
                    }).then(() => {
                        console.log("/orderlist:获取orderlist成功！")
                        ctx.response.statusCode = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                            returnDatas: orderListReturnDatas,
                            orderStatus: orderStatus,
                            orderInfo: orderInfo
                        }
                    })
                } else {
                    console.log('/orderlist:该用户此状态下无订单！')
                    ctx.response.status = statusCodeList.success
                    ctx.response.body = {
                        status: 'success',
                        returnDatas: orderListReturnDatas
                    }
                }
            }

        } catch (err) {
            console.log('/orderlist:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/orderlist:数据库操作失败！'
        }
    } else {
        console.log('/orderlist:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/orderlist:您请求的用户code有误!'
    }
}

const recharge = async (ctx, next: () => Promise<any>) => {
    const { code, value } = ctx.request.body
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `UPDATE user_money SET balance = balance + ? WHERE open_id =? `
            const poolResult1 = await transformPoolQuery(sql1, [value, openid])
            if (poolResult1.affectedRows === 1) {
                console.log("/recharge:充值成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success
                }
            }
        } catch (err) {
            console.log('/recharge:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/recharge:数据库操作失败！'
        }
    } else {
        console.log('/recharge:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/recharge:您请求的用户code有误!'
    }
}

const care = async (ctx, next: () => Promise<any>) => {
    const { code, orderId } = ctx.request.body
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT open_id FROM goods WHERE order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [orderId])
            if (poolResult1.length === 1) {
                const concernedOpenId = poolResult1[0].open_id
                const sql2 = `SELECT * FROM user_care WHERE open_id = ? AND concerned_open_id = ?`
                const poolResult2 = await transformPoolQuery(sql2, [openid, concernedOpenId])
                if (poolResult2.length === 1) {
                    const sql3 = `DELETE FROM user_care WHERE open_id = ? AND concerned_open_id = ?`
                    const poolResult3 = await transformPoolQuery(sql3, [openid, concernedOpenId])
                    if (poolResult3.affectedRows === 1) {
                        console.log("/care:取消关注成功！")
                        ctx.response.statusCode = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success
                        }
                    }
                } else {
                    const sql4 = `INSERT INTO user_care(open_id,concerned_open_id,concerned_order_id) VALUES (?,?,?)`
                    const poolResult4 = await transformPoolQuery(sql4, [openid, concernedOpenId, orderId])
                    if (poolResult4.affectedRows === 1) {
                        console.log("/care:关注成功！")
                        ctx.response.statusCode = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/care:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/care:数据库操作失败！'
        }
    } else {
        console.log('/care:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/care:您请求的用户code有误!'
    }
}

interface GetCareListReturnList {
    nickName: string;
    avatarUrl: string;
    collage: string;
    userClass: string;
    concernedOrderId: string;
}
const getCareList = async (ctx, next: () => Promise<any>) => {
    const { code, page } = ctx.request.query
    const startIndex = (page - 1) * 8
    let returnDatas: GetCareListReturnList[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT concerned_open_id,concerned_order_id FROM user_care WHERE open_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length > 0) {
                await new Promise((resolve, reject) => {
                    poolResult1.map(async (data, index) => {
                        const concernedOpenId = data.concerned_open_id
                        const concernedOrderId = data.concerned_order_id
                        const sql2 = `SELECT avatar_url,nick_name,collage,user_class FROM user_info WHERE open_id = ? LIMIT ?,8`
                        const poolResult2 = await transformPoolQuery(sql2, [concernedOpenId, startIndex])
                        if (poolResult2.length === 1) {
                            returnDatas.push({
                                nickName: poolResult2[0].nick_name,
                                avatarUrl: poolResult2[0].avatar_url,
                                collage: poolResult2[0].collage,
                                userClass: poolResult2[0].user_class,
                                concernedOrderId: concernedOrderId
                            })
                        }
                        if (returnDatas.length === poolResult1.length) {
                            resolve()
                        }
                    })
                }).then(() => {
                    console.log("/getCareList:查询关注列表成功")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas: returnDatas
                    }
                })
            } else {
                console.log("/getCareList:查询关注列表成功，但无数据！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success
                }
            }
        } catch (err) {
            console.log('/getCareList:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getCareList:数据库操作失败！'
        }
    } else {
        console.log('/getCareList:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getCareList:您请求的用户code有误!'
    }
}

const collect = async (ctx, next: () => Promise<any>) => {
    const { code, orderId } = ctx.request.body
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT * FROM user_collect WHERE open_id = ? AND collect_order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid, orderId])
            if (poolResult1.length === 1) {
                const sql2 = `DELETE FROM user_collect WHERE open_id = ? AND collect_order_id = ?`
                const poolResult2 = await transformPoolQuery(sql2, [openid, orderId])
                if (poolResult2.affectedRows === 1) {
                    console.log("/collect:取消收藏成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success
                    }
                }
            } else {
                const sql3 = `INSERT INTO user_collect(open_id,collect_order_id) VALUES (?,?)`
                const poolResult3 = await transformPoolQuery(sql3, [openid, orderId])
                if (poolResult3.affectedRows === 1) {
                    console.log("/collect:收藏成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success
                    }
                }
            }
        } catch (err) {
            console.log('/collect:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/collect:数据库操作失败！'
        }
    } else {
        console.log('/collect:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/collect:您请求的用户code有误!'
    }
}

const getCollectList = async (ctx, next: () => Promise<any>) => {
    const { code, page } = ctx.request.query
    const startIndex = (page - 1) * 8
    let returnDatas: OrderListReturnDatas[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT collect_order_id FROM user_collect WHERE open_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length > 0) {
                await new Promise((resolve, reject) => {
                    poolResult1.map(async (data, index) => {
                        const collectOrderId = data.collect_order_id
                        const sql2 = `SELECT name_input,order_id,type_one,type_two,type_three,goods_number,new_and_old_degree,pics_location FROM goods WHERE order_id = ? LIMIT ?,8`
                        const poolResult2 = await transformPoolQuery(sql2, [collectOrderId, startIndex])
                        if (poolResult2.length === 1) {
                            let topPicSrc
                            const len = poolResult2[0].pics_location.length
                            if (len === 0) {
                                topPicSrc = ''
                            } else {
                                topPicSrc = 'https://' + poolResult2[0].pics_location.split(';')[0]
                            }
                            returnDatas.push({
                                orderId: poolResult2[0].order_id,
                                nameInput: poolResult2[0].name_input,
                                newAndOldDegree: poolResult2[0].new_and_old_degree,
                                topPicSrc: topPicSrc,
                                typeOne: poolResult2[0].type_one,
                                typeTwo: poolResult2[0].type_two,
                                typeThree: poolResult2[0].type_three,
                                goodsNumber: poolResult2[0].goods_number
                            })
                        }
                        if (returnDatas.length === poolResult1.length) {
                            resolve()
                        }
                    })
                }).then(() => {
                    console.log("/getCareList:查询收藏列表成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas: returnDatas
                    }
                })
            } else {
                console.log("/getCollectList:查询收藏列表成功，但无数据！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success
                }
            }
        } catch (err) {
            console.log('/getCollectList:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getCollectList:数据库操作失败！'
        }
    } else {
        console.log('/getCollectList:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getCollectList:您请求的用户code有误!'
    }
}

const tradingScanCode = async (ctx, next: () => Promise<any>) => {
    const { code, scanResult } = ctx.request.body
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT open_id,order_id,buy_open_id,pay_for_me_price,pay_for_other_price FROM goods WHERE order_id = ? `
            const poolResult1 = await transformPoolQuery(sql1, [scanResult])
            if (poolResult1.length === 1) {
                const openId = poolResult1[0].open_id
                const orderId = poolResult1[0].order_id
                const buyOpenId = poolResult1[0].buy_open_id
                const payForMePrice = poolResult1[0].pay_for_me_price
                const payForOtherPrice = poolResult1[0].pay_for_other_price
                if (openid === openId || openid === buyOpenId) {  //如果扫码的是卖家或者买家才能完成交易，否则报错
                    const sql2 = `UPDATE goods SET order_status = ? WHERE order_id = ?`
                    const poolResult2 = await transformPoolQuery(sql2, ['completed', orderId])
                    if (poolResult2.affectedRows === 1) {
                        const sql3 = 'UPDATE user_order SET bougth = bougth +1,trading = trading - 1 WHERE open_id =?'
                        const poolResult3 = await transformPoolQuery(sql3, [buyOpenId])
                        if (poolResult3.affectedRows === 1) {
                            const sql4 = `UPDATE user_order SET saled = saled +1,trading = trading - 1  WHERE open_id =?`
                            const poolResult4 = await transformPoolQuery(sql4, [openId])
                            if (poolResult4.affectedRows === 1) {
                                if (payForMePrice != 0) {
                                    const sql5 = `UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id = ? `
                                    const poolResult5 = await transformPoolQuery(sql5, [payForMePrice, payForMePrice, openId])
                                    if (poolResult5.affectedRows === 1) {
                                        wss.clients.forEach((client) => {
                                            if (client.openId === openId || client.openId === buyOpenId) {
                                                console.log('/tradingscancode:扫码交易成功！')
                                                client.send(JSON.stringify({
                                                    status: statusList.success
                                                }))
                                                ctx.response.status = statusCodeList.success
                                                ctx.response.body = {
                                                    status: statusList.success,
                                                    data: '/tradingscancode:扫码交易成功！'
                                                }
                                            }
                                        })
                                    }
                                } else if (payForOtherPrice != 0) {
                                    const sql6 = `UPDATE  user_money SET balance = balance + ?,income=income + ?  where open_id = ? `
                                    const poolResult6 = await transformPoolQuery(sql6, [payForOtherPrice, payForOtherPrice, buyOpenId])
                                    if (poolResult6.affectedRows === 1) {
                                        wss.clients.forEach((client) => {
                                            if (client.openId === openId || client.openId === buyOpenId) {
                                                console.log('/tradingscancode:扫码交易成功！')
                                                client.send(JSON.stringify({
                                                    status: statusList.success
                                                }))
                                                ctx.response.status = statusCodeList.success
                                                ctx.response.body = {
                                                    status: statusList.success,
                                                    data: '/tradingscancode:扫码交易成功！'
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.log('/tradingscancode:扫码失败，该用户不是该订单的交易人！')
                    ctx.response.status = statusCodeList.fail
                    ctx.response.body = {
                        status: statusList.fail,
                        msg: '/tradingscancode:扫码失败，该用户不是该订单的交易人！'

                    }
                }
            }
        } catch (err) {
            console.log('/tradingscancode:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/tradingscancode:数据库操作失败！'
        }

    } else {
        console.log('/tradingscancode:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/tradingscancode:您请求的用户code有误!'
    }
}

interface ChatInfo {
    type: number;
    chatTime: string;
    content: string;
}
const getChatInfo = async (ctx, next: () => Promise<any>) => {
    const { code, orderId, getChatInfoStartTime, otherOpenId } = ctx.request.query
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT open_id,pay_for_me_price,pay_for_other_price,goods_number,new_and_old_degree,want_exchange_goods,pics_location,name_input FROM goods WHERE order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [orderId])
            if (poolResult1.length === 1) {
                const { open_id, pay_for_me_price, pay_for_other_price, goods_number, new_and_old_degree, want_exchange_goods, name_input, pics_location } = poolResult1[0]
                let topPicSrc
                const len = pics_location.split(';').length
                if (len === 0) {
                    topPicSrc = ''
                } else {
                    topPicSrc = 'https://' + pics_location.split(';')[0]
                }
                let goodsInfo = {
                    payForMePrice: pay_for_me_price,
                    payForOtherPrice: pay_for_other_price,
                    goodsNumber: goods_number,
                    newAndOldDegree: new_and_old_degree,
                    wantExchangeGoods: want_exchange_goods,
                    nameInput: name_input,
                    topPicSrc,
                    orderId: orderId
                }
                let chatInfo: ChatInfo[] = []
                let chooseOtherOpenId = ''
                if (orderId && (otherOpenId === 'undefined')) {
                    chooseOtherOpenId = open_id
                } else if (orderId && (otherOpenId !== 'undefined')) {
                    chooseOtherOpenId = otherOpenId
                }
                if (getChatInfoStartTime && getChatInfoStartTime.length > 0) {
                    const sql2 = `SELECT send_open_id ,chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? )) AND chat_time > ? AND order_id = ? ORDER BY chat_time ASC `
                    const poolResult2 = await transformPoolQuery(sql2, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, getChatInfoStartTime,orderId])
                    if (poolResult2.length > 0) {
                        for (let i = 0; i < poolResult2.length; i++) {
                            let sendOpenId = poolResult2[i].send_open_id
                            let chatTime = poolResult2[i].chat_time
                            let content = poolResult2[i].content
                            let type
                            if (sendOpenId === openid) {
                                type = 0
                            } else if (sendOpenId === chooseOtherOpenId) {
                                type = 1
                            }
                            chatInfo.push({
                                type: type,
                                chatTime: chatTime,
                                content: content
                            })
                        }
                    }
                } else {
                    const sql2 = `SELECT send_open_id ,chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? ))  AND order_id = ? ORDER BY chat_time ASC `
                    const poolResult2 = await transformPoolQuery(sql2, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId])
                    if (poolResult2.length > 0) {
                        for (let i = 0; i < poolResult2.length; i++) {
                            let sendOpenId = poolResult2[i].send_open_id
                            let chatTime = poolResult2[i].chat_time
                            let content = poolResult2[i].content
                            let type
                            if (sendOpenId === openid) {
                                type = 0
                            } else if (sendOpenId === chooseOtherOpenId) {
                                type = 1
                            }
                            chatInfo.push({
                                type: type,
                                chatTime: chatTime,
                                content: content
                            })
                        }
                    }
                }
                const sql3 = `SELECT nick_name,avatar_url FROM user_info WHERE open_id = ?`
                const poolResult3 = await transformPoolQuery(sql3, [chooseOtherOpenId])
                if (poolResult3.length === 1) {
                    const chatNickName = poolResult3[0].nick_name
                    const chatAvatarUrl = poolResult3[0].avatar_url
                    const sql4 = `SELECT avatar_url FROM user_info WHERE open_id = ?`
                    const poolResult4 = await transformPoolQuery(sql4, [openid])
                    if (poolResult4.length === 1) {
                        const myAvatarUrl = poolResult4[0].avatar_url
                        const sql5 = `SELECT * FROM user_chat_list WHERE ((chat_one_open_id = ? AND chat_two_open_id = ?) OR (chat_one_open_id = ? AND chat_two_open_id = ?)) AND order_id = ?`
                        const poolResult5 = await transformPoolQuery(sql5, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId])
                        if (poolResult5.length === 0) {
                            const sql6 = `INSERT INTO user_chat_list(chat_one_open_id,chat_two_open_id,order_id) VALUES (?,?,?)`
                            const poolResult6 = await transformPoolQuery(sql6, [openid, chooseOtherOpenId, orderId])
                        }
                        console.log('/getchatinfo:获取聊天内容页数据成功')
                        ctx.response.status = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                            goodsInfo,
                            chatInfo,
                            chatNickName,
                            chatAvatarUrl,
                            myAvatarUrl
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/getchatinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getchatinfo:数据库操作失败！'
        }
    } else {
        console.log('/getchatinfo:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getchatinfo:您请求的用户code有误!'
    }
}

const sendChatInfo = async (ctx, next: () => Promise<any>) => {
    const { code, orderId, value, otherOpenId } = ctx.request.body
    let isWarn = false
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT open_id FROM goods WHERE order_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [orderId])
            if (poolResult1.length === 1) {
                const receiveOpenId = poolResult1[0].open_id
                let chooseOtherOpenId = ''
                if (orderId && !otherOpenId) {
                    chooseOtherOpenId = receiveOpenId
                } else if (orderId && otherOpenId) {
                    chooseOtherOpenId = otherOpenId
                }
                const reg = new RegExp('cao|操|草|艹|((sha|傻|煞|s)(B|逼))|(垃圾|lj|辣鸡)|(gun|滚)|尼玛|弱智|sjb|神经病|废物|feiwu', 'ig')
                const checkedValue = value.replace(reg, (keyWord) => {
                    const len = keyWord.length
                    let str = ''
                    for (let i = 0; i < len; i++) {
                        str += '*'
                    }
                    isWarn = true
                    return str
                })
                const sql2 = 'INSERT INTO user_chat(send_open_id,receive_open_id,order_id,chat_time,content) VALUES (?,?,?,now() , ? )'
                const poolResult2 = await transformPoolQuery(sql2, [openid, chooseOtherOpenId, orderId, checkedValue])
                if (poolResult2.affectedRows === 1) {
                    const sql3 = `SELECT id FROM user_chat_list WHERE ((chat_one_open_id = ? AND chat_two_open_id = ?) OR (chat_one_open_id = ? AND chat_two_open_id = ?)) AND order_id = ?`
                    const poolResult3 = await transformPoolQuery(sql3, [openid, chooseOtherOpenId, chooseOtherOpenId, openid, orderId])
                    if (poolResult3.length == 1) {
                        const id = poolResult3[0].id
                        let otherIsOnLine = false
                        wss.clients.forEach((client) => {
                            const chatTime = new Date()
                            if (client.openId === openid) {
                                client.send(JSON.stringify({
                                    status: statusList.success,
                                    chatInfo: [{
                                        type: 0,
                                        chatTime,
                                        content: checkedValue,
                                        isWarn: isWarn,
                                        id
                                    }]
                                }))
                            }
                            if (client.openId === chooseOtherOpenId) {
                                otherIsOnLine = true
                                client.send(JSON.stringify({
                                    status: statusList.success,
                                    chatInfo: [{
                                        type: 1,
                                        chatTime,
                                        content: checkedValue,
                                        isWarn: false,
                                        id
                                    }]
                                }))
                            }
                        })
                        if (!otherIsOnLine) {
                            const sql4 = `UPDATE user_chat_list SET not_view_message_num = not_view_message_num + 1,not_view_open_id = ? WHERE id = ? `
                            const poolResult4 = await transformPoolQuery(sql4, [chooseOtherOpenId,id])
                        }
                        console.log('/sendchatinfo:发送聊天信息成功!')
                        ctx.response.status = statusCodeList.success
                        ctx.response.body = {
                            status: statusList.success,
                        }
                    }
                }
            }
        } catch (err) {
            console.log('/sendchatinfo:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/sendchatinfo:数据库操作失败！'
        }
    } else {
        console.log('/sendchatinfo:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/sendchatinfo:您请求的用户code有误!'
    }
}

interface ChatListReturnDatas {
    avatarUrl: string;
    nickName: string;
    topPicSrc: string;
    lastChatContent: string;
    lastChatTime: string;
    orderId: string;
    otherOpenId: string;
    id: number;
}
const getChatList = async (ctx, next: () => Promise<any>) => {
    const { code, page } = ctx.request.query
    const startIndex = (page - 1) * 8
    let returnDatas: ChatListReturnDatas[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT chat_one_open_id,chat_two_open_id,order_id,id FROM user_chat_list WHERE chat_one_open_id = ? OR chat_two_open_id =? limit ?,8`
            const poolResult1 = await transformPoolQuery(sql1, [openid, openid, startIndex])
            if (poolResult1.length > 0) {
                await new Promise((resolve, reject) => {
                    poolResult1.map(async (data, index) => {
                        const chatOneOpenId = data.chat_one_open_id
                        const chatTwoOpenId = data.chat_two_open_id
                        const orderId = data.order_id
                        const id = data.id
                        let avatarUrl = ''
                        let nickName = ''
                        let otherOpenId = ''
                        if (openid === chatOneOpenId) {
                            otherOpenId = chatTwoOpenId
                        } else if (openid === chatTwoOpenId) {
                            otherOpenId = chatOneOpenId
                        }
                        const sql2 = `SELECT avatar_url,nick_name FROM user_info WHERE open_id = ?`
                        const poolResult2 = await transformPoolQuery(sql2, [otherOpenId])
                        if (poolResult2.length === 1) {
                            avatarUrl = poolResult2[0].avatar_url
                            nickName = poolResult2[0].nick_name
                            const sql3 = `SELECT pics_location FROM goods WHERE order_id = ?`
                            const poolResult3 = await transformPoolQuery(sql3, [orderId])
                            if (poolResult3.length === 1) {
                                let topPicSrc = ''
                                let lastChatContent = ''
                                let lastChatTime = ''
                                const len = poolResult3[0].pics_location.length
                                if (len === 0) {
                                    topPicSrc = ''
                                } else {
                                    topPicSrc = 'https://' + poolResult3[0].pics_location.split(';')[0]
                                }
                                const sql4 = `SELECT chat_time,content FROM user_chat WHERE ((send_open_id = ? AND receive_open_id = ?) OR (send_open_id = ? AND receive_open_id = ? )) AND order_id = ? ORDER BY chat_time DESC LIMIT 1 `
                                const poolResult4 = await transformPoolQuery(sql4, [chatOneOpenId, chatTwoOpenId, chatTwoOpenId, chatOneOpenId, orderId])
                                if (poolResult4.length === 1) {
                                    lastChatContent = poolResult4[0].content
                                    lastChatTime = poolResult4[0].chat_time
                                }
                                returnDatas.push({
                                    avatarUrl,
                                    nickName,
                                    topPicSrc,
                                    lastChatContent,
                                    lastChatTime,
                                    orderId,
                                    otherOpenId,
                                    id
                                })
                                if (returnDatas.length === poolResult1.length) {
                                    resolve()
                                }
                            }
                        }
                    })
                }).then(() => {
                    console.log("/getchatlist:查询聊天列表成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas: returnDatas
                    }
                })
            }
        } catch (err) {
            console.log('/getchatlist:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getchatlist:数据库操作失败！'
        }
    } else {
        console.log('/getchatlist:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getchatlist:您请求的用户code有误!'
    }
}

interface GetNotViewMessageNumDatas{
    id:number;
    notViewMessageNum:number;
}
interface GetNotViewMessageNumReturnDatas{
    sumMessage:number;
    datas:GetNotViewMessageNumDatas[]
}
const getNotViewMessageNum = async (ctx, next: () => Promise<any>) => {
    const { code } = ctx.request.query
    let returnDatas:GetNotViewMessageNumReturnDatas={sumMessage:0,datas:[]}
    let sumMessage = 0
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 = `SELECT id,not_view_message_num FROM user_chat_list WHERE not_view_open_id = ? AND not_view_message_num != 0`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length > 0) {
                poolResult1.map((res, index) => {
                    const id = res.id
                    const notViewMessageNum = res.not_view_message_num
                    sumMessage += notViewMessageNum
                    returnDatas.datas.push({id,notViewMessageNum})      
                })
                returnDatas.sumMessage = sumMessage
                console.log("/getnotviewmessagenum:查询未读信息成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    returnDatas: returnDatas
                }
            }else{
                console.log("/getnotviewmessagenum:查询未读信息成功,但无未读消息！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success,
                    returnDatas: returnDatas
                }
            }
        } catch (err) {
            console.log('/getnotviewmessagenum:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getnotviewmessagenum:数据库操作失败！'
        }
    } else {
        console.log('/getnotviewmessagenum:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getnotviewmessagenum:您请求的用户code有误!'
    }
}

const subNotViewMessageNum = async (ctx, next: () => Promise<any>) => {
    const { id } = ctx.request.query
    try {
            const sql1 = `UPDATE  user_chat_list SET not_view_message_num = 0,not_view_open_id = '' WHERE id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [id])
            if (poolResult1.affectedRows === 1 ) {
                console.log("/subnotviewmessagenum:标记已读信息成功！")
                ctx.response.statusCode = statusCodeList.success
                ctx.response.body = {
                    status: statusList.success
                }
            }else{
                console.log('/subnotviewmessagenum:标记已读信息失败！')
                ctx.response.status = statusCodeList.fail
                ctx.response.body = '/subnotviewmessagenum:标记已读信息失败！'  
            }
        } catch (err) {
            console.log('/subnotviewmessagenum:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/subnotviewmessagenum:数据库操作失败！'
        }
}


const publishSchoolfellowZoom = async (ctx, next: () => Promise<any>) => {
    const { code,publishContent } = ctx.request.body
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 =`SELECT nick_name,avatar_url,school FROM user_info WHERE open_id =?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if(poolResult1.length===1){
                const nickName = poolResult1[0].nick_name
                const avatarUrl = poolResult1[0].avatar_url
                const school = poolResult1[0].school
                const sql2 =`INSERT INTO schoolfellow_zoom_list(open_id,avatar_url,nick_name,school,publish_time,publish_content) VALUES (?,?,?,?,now(),?)`
                const poolResult2 = await transformPoolQuery(sql2, [openid,avatarUrl,nickName,school,publishContent])
                if (poolResult2.affectedRows === 1 ) {
                    console.log("/publishschoolfellowzoom:发表校友圈成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success
                    }
                }
            }
        }catch(err){
            console.log('/publishschoolfellowzoom:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/publishschoolfellowzoom:数据库操作失败！'
        }
    }else {
        console.log('/publishschoolfellowzoom:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/publishschoolfellowzoom:您请求的用户code有误!'
    }
}
interface GetSchoolfellowZoomList {
    id: number;
    avatarUrl: string;
    nickName: string;
    publishContent: string;
    time: string;
}
const getSchoolfellowZoomList = async (ctx, next: () => Promise<any>) => {
    const { code,page} = ctx.request.query
    const startIndex = (page - 1) * 6
    let returnDatas: GetSchoolfellowZoomList[] = []
    if (code) {
        const result = await getOpenIdAndSessionKey(code)
        const { openid } = result
        try {
            const sql1 =`SELECT school FROM user_info WHERE open_id = ?`
            const poolResult1 = await transformPoolQuery(sql1, [openid])
            if (poolResult1.length === 1 ) {
                const school =poolResult1[0].school
                const sql2 =`SELECT * FROM schoolfellow_zoom_list WHERE school = ? ORDER BY publish_time DESC  limit ?,6`
                const poolResult2 = await transformPoolQuery(sql2, [school,startIndex])
                if(poolResult2.length>0){
                    for(let i = 0;i<poolResult2.length;i++){
                        const id =poolResult2[i].id
                        const avatarUrl=poolResult2[i].avatar_url
                        const nickName=poolResult2[i].nick_name
                        const time =poolResult2[i].publish_time
                        const publishContent =poolResult2[i].publish_content
                        returnDatas.push({
                            id,
                            avatarUrl,
                            nickName,
                            time,
                            publishContent
                        })
                    }
                    console.log("/getshschoolfellowzoomlist:获取校友圈成功！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas
                    } 
                }else{
                    console.log("/getshschoolfellowzoomlist:获取校友圈成功，但无数据！")
                    ctx.response.statusCode = statusCodeList.success
                    ctx.response.body = {
                        status: statusList.success,
                        returnDatas
                    } 
                }
            }
        }catch(err){
            console.log('/getshschoolfellowzoomlist:数据库操作失败！', err)
            ctx.response.status = statusCodeList.fail
            ctx.response.body = '/getshschoolfellowzoomlist:数据库操作失败！'
        }
    }else {
        console.log('/getshschoolfellowzoomlist:您请求的用户code有误!')
        ctx.response.status = statusCodeList.fail
        ctx.response.body = '/getshschoolfellowzoomlist:您请求的用户code有误!'
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
app.use(route.get('/search', search))
app.use(route.get('/orderlist', orderList))
app.use(route.post('/recharge', recharge))
app.use(route.post('/care', care))
app.use(route.get('/getcarelist', getCareList))
app.use(route.post('/collect', collect))
app.use(route.get('/getcollectlist', getCollectList))
app.use(route.post('/tradingscancode', tradingScanCode))
app.use(route.get('/getchatinfo', getChatInfo))
app.use(route.post('/sendchatinfo', sendChatInfo))
app.use(route.get('/getchatlist', getChatList))
app.use(route.get('/getnotviewmessagenum', getNotViewMessageNum))
app.use(route.get('/subnotviewmessagenum', subNotViewMessageNum))
app.use(route.post('/publishschoolfellowzoom', publishSchoolfellowZoom))
app.use(route.get('/getshschoolfellowzoomlist', getSchoolfellowZoomList))
// app.listen(3000)