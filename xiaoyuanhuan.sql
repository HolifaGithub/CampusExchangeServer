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
    avatar_url TEXT NOT NULL
);