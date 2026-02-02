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

-- 회원
create table tb_users
(
    tu_seq              int auto_increment comment '시퀀스' primary key,
    tu_id               varchar(20)                 null comment '아이디',
    tu_pw               varchar(255)                null comment '패스워드',
    tu_name             varchar(50)                 null comment '이름',
    tu_phone            varchar(15)                 null comment '휴대폰',
    tu_email            varchar(50)                 null comment '이메일',
    tu_isdel            char                        null comment '삭제여부',
    tu_step             char(2)                     null comment '상태',
    tu_type             char(6)                     null comment '타입',
    tu_content_yn       enum ('Y', 'N') default 'Y' null comment '콘텐츠 사용여부',
    tu_work_type        varchar(10)                 null comment '계약타입',
    tu_last_access_date datetime                    null comment '마지막 접속',
    tu_log              text                        null comment '로그',
    tu_new_noti         char                        null comment '알림정보',
    tu_access_token     varchar(300)                null comment '접근토큰',
    tu_push_token       varchar(100)                null comment 'PUSH 토큰',
    tu_device_name      varchar(50)                 null comment '디바이스명',
    tu_app_ver          varchar(10)                 null comment '앱버전',
    si_seq              int                         null comment '사이트정보',
    reg_date            datetime                    null comment '등록일'
)
comment '회원 테이블';




