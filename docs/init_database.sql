-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ku_wave_plat
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER IF NOT EXISTS 'ku_wave_plat'@'%' IDENTIFIED BY '!ku_wave_plat@';
GRANT ALL PRIVILEGES ON ku_wave_plat.* TO 'ku_wave_plat'@'%';
FLUSH PRIVILEGES;

-- 데이터베이스 사용
USE ku_wave_plat;




-- 환경설정 테이블
create table tb_setting
(
    ts_seq          int auto_increment comment '시퀀스' primary key,
    ts_api_time     varchar(10)                 null comment 'api 실행 시간',
    ts_player_time  varchar(10) default '1'     null comment '플레이어 실행 주기',
    ts_screen_start varchar(10)                 null comment '스크린 세이버 시작',
    ts_screen_end   varchar(10)                 null comment '스크린 세이버 종료',
    ts_player_ver   varchar(10) default '1.0.0' null comment '플레이어 버전',
    ts_player_link  varchar(255)                null comment '플레이어 다운로드 링크',
    ts_watcher_ver  varchar(10) default '1.0.0' null comment '와처 버전',
    ts_watcher_link varchar(255)                null comment '와처 다운로드 링크',
    ts_notice_link  varchar(255)                null comment '공지사항링크',
    ts_intro_link   varchar(255)                null comment '인트로링크',
    ts_default_image varchar(255) null comment 'DID 플레이어 기본 이미지 경로',
    reg_date        datetime                    not null comment '등록일'
)
comment '환경설정';


