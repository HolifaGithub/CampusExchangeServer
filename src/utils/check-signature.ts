import { sha1 } from './sha1'
function checkSignature(signature:string, rawData:string, session_key:string) {
    const checkStr = rawData + session_key
    const signature2 = sha1(checkStr)
    return signature === signature2
}

export {checkSignature}