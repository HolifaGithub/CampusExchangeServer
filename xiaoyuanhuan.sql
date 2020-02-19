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

DROP TABLE IF EXISTS goods;
CREATE TABLE goods(
    order_id VARCHAR(30) PRIMARY KEY,
    order_time  DATETIME,
    order_status VARCHAR(20) NOT NULL,
    open_id VARCHAR(30) NOT NULL,
    type_one VARCHAR(20) NOT NULL,
    type_two VARCHAR(20) NOT NULL,
    type_three VARCHAR(20) NOT NULL,
    name_input VARCHAR(30) NOT NULL,
    goods_number TINYINT(3) NOT NULL,
    new_and_old_degree VARCHAR(20) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    object_of_payment VARCHAR(20) NOT NULL,
    pay_for_me_price TINYINT(10) NOT NULL,
    pay_for_other_price TINYINT(10) NOT NULL,
    want_exchange_goods VARCHAR(30) NOT NULL,
    goods_describe VARCHAR(200) NOT NULL,
    pics_location VARCHAR(2000) NOT NULL
);