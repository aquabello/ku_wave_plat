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
    tu_approved_date    datetime                    null comment '승인일시',
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


-- 건물관리
create table tb_building
(
    building_seq           int auto_increment comment '건물 시퀀스'
        primary key,
    building_name          varchar(100)                         not null comment '건물명',
    building_code          varchar(50)                          not null comment '건물 코드 (예: BLD-001)',
    building_location      text                                 null comment '위치 설명',
    building_floor_count   int      default 0                   null comment '층수',
    building_order         int      default 0                   null comment '정렬 순서',
    building_manager_name  varchar(100)                         null comment '건물 담당자',
    building_manager_phone varchar(20)                          null comment '담당자 연락처',
    building_isdel         char     default 'N'                 null comment '삭제 여부',
    reg_date               datetime default current_timestamp() null comment '등록일시',
    upd_date               datetime default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint building_code
        unique (building_code)
)
    comment '건물 마스터' charset = utf8mb4;

create index idx_building_code
    on tb_building (building_code);

create index idx_building_isdel
    on tb_building (building_isdel);

create index idx_building_name
    on tb_building (building_name);

create index idx_building_order
    on tb_building (building_order);


-- 메뉴 마스터
create table tb_menu
(
    menu_seq    int auto_increment comment '메뉴 시퀀스' primary key,
    menu_name   varchar(50)                          not null comment '메뉴명',
    menu_code   varchar(50)                          not null comment '메뉴코드',
    menu_path   varchar(255)                         null comment '라우트 경로',
    menu_type   enum ('GNB', 'LNB')                  not null comment '메뉴 타입 (GNB=상단, LNB=사이드)',
    parent_seq  int                                  null comment '상위메뉴 시퀀스 (GNB은 null)',
    menu_order  int          default 0               null comment '정렬 순서',
    menu_isdel  char         default 'N'             null comment '삭제 여부',
    reg_date    datetime     default current_timestamp() null comment '등록일시',
    constraint uk_menu_code unique (menu_code),
    constraint fk_menu_parent foreign key (parent_seq) references tb_menu (menu_seq) on delete set null
)
    comment '메뉴 마스터' charset = utf8mb4;

create index idx_menu_type on tb_menu (menu_type);
create index idx_menu_parent on tb_menu (parent_seq);
create index idx_menu_order on tb_menu (menu_order);

-- 메뉴 초기 데이터: GNB (상단 메뉴 7개)
INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order) VALUES
(1,  '컨트롤러',  'controller',    null,                      'GNB', null, 1),
(2,  'RFID',      'rfid',          null,                      'GNB', null, 2),
(3,  '화면공유',  'screen-share',  null,                      'GNB', null, 3),
(4,  'AI시스템',  'ai-system',     null,                      'GNB', null, 4),
(5,  '디스플레이','display',       null,                      'GNB', null, 5),
(6,  '회원관리',  'member',        null,                      'GNB', null, 6),
(7,  '환경설정',  'settings',      null,                      'GNB', null, 7);

-- 메뉴 초기 데이터: LNB (사이드 메뉴 16개)
INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order) VALUES
-- 컨트롤러 하위
(11, '하드웨어 설정', 'controller-hardware', '/controller/hardware', 'LNB', 1, 1),
(12, '제어관리',      'controller-control',  '/controller/control',  'LNB', 1, 2),
-- RFID 하위
(21, '태그 관리',     'rfid-tag',            '/rfid/tags',           'LNB', 2, 1),
(22, '리더기 관리',   'rfid-reader',         '/rfid/readers',        'LNB', 2, 2),
(23, '로그',          'rfid-log',            '/rfid/logs',           'LNB', 2, 3),
-- 화면공유 하위
(31, '세션 목록',     'screen-session',      '/screen-share/sessions',  'LNB', 3, 1),
(32, '공유 설정',     'screen-settings',     '/screen-share/settings',  'LNB', 3, 2),
-- AI시스템 하위
(41, '강의요약',      'ai-lecture-summary',  '/ai-system/lecture-summary', 'LNB', 4, 1),
-- 디스플레이 하위
(51, '플레이어',      'display-player',      '/display/player',      'LNB', 5, 1),
(52, '리스트관리',    'display-list',        '/display/list',        'LNB', 5, 2),
(53, '콘텐츠관리',    'display-content',     '/display/content',     'LNB', 5, 3),
-- 회원관리 하위
(61, '사용자 목록',   'member-list',         '/members',             'LNB', 6, 1),
(62, '권한 관리',     'member-permissions',  '/members/permissions', 'LNB', 6, 2),
(63, '활동 로그',     'member-activity',     '/members/activity',    'LNB', 6, 3),
-- 환경설정 하위
(71, '건물관리',      'settings-buildings',  '/settings/buildings',  'LNB', 7, 1),
(72, '시스템 설정',   'settings-system',     '/settings',            'LNB', 7, 2);


-- 사용자별 메뉴 권한
create table tb_menu_users
(
    mu_seq    int auto_increment comment '시퀀스' primary key,
    tu_seq    int                                  not null comment '사용자 시퀀스',
    menu_seq  int                                  not null comment '메뉴 시퀀스',
    reg_date  datetime     default current_timestamp() null comment '권한 부여일',
    constraint fk_mu_user foreign key (tu_seq) references tb_users (tu_seq) on delete cascade,
    constraint fk_mu_menu foreign key (menu_seq) references tb_menu (menu_seq) on delete cascade,
    constraint uk_mu_user_menu unique (tu_seq, menu_seq)
)
    comment '사용자별 메뉴 권한' charset = utf8mb4;

create index idx_mu_user on tb_menu_users (tu_seq);
create index idx_mu_menu on tb_menu_users (menu_seq);

