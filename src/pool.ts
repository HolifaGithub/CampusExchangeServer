import mysql from 'mysql'
import {mysql_server,port,user,password,database,connectionLimit} from './static-name/mysql-server'
var pool=mysql.createPool({
	host:mysql_server,
	port:port,
	user:user,
	password:password,
	database:database,
	connectionLimit:connectionLimit
});

export default pool
