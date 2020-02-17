DROP DATABASE IF EXISTS xiaoyuanhuan;
CREATE DATABASE xiaoyuanhuan CHARACTER SET utf8 COLLATE utf8_general_ci;
USE xiaoyuanhuan;

DROP TABLE IF EXISTS user_info;
CREATE TABLE user_info(
    open_id VARCHAR(30) PRIMARY KEY,
    nick_name VARCHAR(20) NOT NULL,
    gender TINYINT(1) NOT NULL,
    country VARCHAR(20) NOT NULL,
    province VARCHAR(20) NOT NULL,
    city VARCHAR(30) NOT NULL,
    avatar_url TEXT NOT NULL,
    school VARCHAR(20) NOT NULL,
    id VARCHAR(20) NOT NULL,
    education VARCHAR(30) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    collage VARCHAR(30) NOT NULL,
    class VARCHAR(20) NOT NULL,
    user_name VARCHAR(15) NOT NULL,
    id_card VARCHAR(18) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    user_address CHAR(30) NOT NULL 
);