const dev_mysql_server: string = '127.0.0.1'
const cloud_mysql_server: string = '1'

const mysql_server: string = dev_mysql_server
const port: number = 3306
const user:string='root'
let password:string=''
const database:string='xiaoyuanhuan'
const connectionLimit:number=100

export {
    mysql_server,
    port,
    user,
    password,
    database,
    connectionLimit
}