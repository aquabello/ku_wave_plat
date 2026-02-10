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


-- 사용자-건물 권한 매핑
create table tb_user_building
(
    tub_seq        int auto_increment comment '시퀀스'
        primary key,
    tu_seq         int                                  not null comment '사용자 시퀀스',
    building_seq   int                                  not null comment '건물 시퀀스',
    reg_date       datetime default current_timestamp() null comment '할당일시',
    upd_date       datetime default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint uq_user_building
        unique (tu_seq, building_seq),
    constraint fk_user_building_building
        foreign key (building_seq) references tb_building (building_seq)
            on delete cascade,
    constraint fk_user_building_user
        foreign key (tu_seq) references tb_users (tu_seq)
            on delete cascade
)
    comment '사용자-건물 권한 매핑' charset = utf8mb4;

create index idx_user_building_building
    on tb_user_building (building_seq);


-- 공간 마스터
create table tb_space
(
    space_seq           int auto_increment comment '공간 시퀀스'
        primary key,
    building_seq        int                                  not null comment '건물 시퀀스',
    space_name          varchar(100)                         not null comment '공간명 (예: 101호, 대강당)',
    space_code          varchar(50)                          not null comment '공간 코드 (예: SPC-001)',
    space_floor         varchar(10)                          null comment '층 (예: 1, 2, B1, B2)',
    space_type          varchar(20)                          null comment '공간 유형 (강의실, 실험실, 사무실, 회의실, 기타)',
    space_capacity      int          default 0               null comment '수용 인원',
    space_description   text                                 null comment '공간 설명/메모',
    space_order         int          default 0               null comment '정렬 순서',
    space_isdel         char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint uk_space_code
        unique (space_code),
    constraint fk_space_building
        foreign key (building_seq) references tb_building (building_seq)
            on delete cascade
)
    comment '공간 마스터' charset = utf8mb4;

create index idx_space_building
    on tb_space (building_seq);

create index idx_space_code
    on tb_space (space_code);

create index idx_space_floor
    on tb_space (space_floor);

create index idx_space_isdel
    on tb_space (space_isdel);

create index idx_space_order
    on tb_space (space_order);


-- =============================================
-- 컨트롤러 시스템
-- =============================================

-- 장비 프리셋 마스터
create table tb_device_preset
(
    preset_seq          int auto_increment comment '프리셋 시퀀스'
        primary key,
    preset_name         varchar(100)                         not null comment '프리셋명 (예: 강의실 프로젝터)',
    protocol_type       enum ('TCP', 'UDP', 'WOL', 'HTTP', 'RS232') not null comment '통신 프로토콜',
    default_port        int                                  null comment '기본 통신 포트 (장비 등록 시 자동 채움)',
    preset_description  text                                 null comment '프리셋 설명',
    preset_order        int          default 0               null comment '정렬 순서',
    preset_isdel        char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시'
)
    comment '장비 프리셋 마스터' charset = utf8mb4;

create index idx_preset_protocol
    on tb_device_preset (protocol_type);

create index idx_preset_isdel
    on tb_device_preset (preset_isdel);

create index idx_preset_order
    on tb_device_preset (preset_order);


-- 프리셋 명령어 (프리셋 1 : 명령어 N)
create table tb_preset_command
(
    command_seq         int auto_increment comment '명령어 시퀀스'
        primary key,
    preset_seq          int                                  not null comment '프리셋 시퀀스',
    command_name        varchar(100)                         not null comment '명령어명 (예: 전원 ON)',
    command_code        varchar(500)                         not null comment '명령어 코드 (HEX 또는 텍스트)',
    command_type        varchar(20)  default 'CUSTOM'        null comment '명령어 유형 (POWER_ON, POWER_OFF, INPUT_CHANGE, CUSTOM)',
    command_order       int          default 0               null comment '정렬 순서',
    command_isdel       char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint fk_command_preset
        foreign key (preset_seq) references tb_device_preset (preset_seq)
            on delete cascade
)
    comment '프리셋 명령어' charset = utf8mb4;

create index idx_command_preset
    on tb_preset_command (preset_seq);

create index idx_command_type
    on tb_preset_command (command_type);

create index idx_command_isdel
    on tb_preset_command (command_isdel);

create index idx_command_order
    on tb_preset_command (command_order);


-- 공간-장비 매핑
create table tb_space_device
(
    space_device_seq    int auto_increment comment '공간장비 시퀀스'
        primary key,
    space_seq           int                                  not null comment '공간 시퀀스',
    preset_seq          int                                  not null comment '프리셋 시퀀스',
    device_name         varchar(100)                         not null comment '장비명 (예: 101호 프로젝터)',
    device_ip           varchar(45)                          not null comment '장비 IP',
    device_port         int                                  not null comment '장비 포트 (프리셋 기본값에서 자동 채움, 수정 가능)',
    device_status       enum ('ACTIVE', 'INACTIVE') default 'ACTIVE' null comment '장비 상태',
    device_order        int          default 0               null comment '정렬 순서',
    device_isdel        char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint fk_space_device_space
        foreign key (space_seq) references tb_space (space_seq)
            on delete cascade,
    constraint fk_space_device_preset
        foreign key (preset_seq) references tb_device_preset (preset_seq)
            on delete restrict
)
    comment '공간-장비 매핑' charset = utf8mb4;

create index idx_space_device_space
    on tb_space_device (space_seq);

create index idx_space_device_preset
    on tb_space_device (preset_seq);

create index idx_space_device_status
    on tb_space_device (device_status);

create index idx_space_device_isdel
    on tb_space_device (device_isdel);


-- 제어 로그
create table tb_control_log
(
    log_seq             int auto_increment comment '로그 시퀀스'
        primary key,
    space_device_seq    int                                  not null comment '공간장비 시퀀스',
    command_seq         int                                  not null comment '명령어 시퀀스',
    tu_seq              int                                  not null comment '실행자 시퀀스',
    trigger_type        enum ('MANUAL', 'NFC', 'SCHEDULE') default 'MANUAL' not null comment '트리거 유형 (MANUAL=콘솔, NFC=태깅, SCHEDULE=예약)',
    result_status       enum ('SUCCESS', 'FAIL', 'TIMEOUT') not null comment '실행 결과',
    result_message      text                                 null comment '응답 메시지 또는 에러 내용',
    executed_at         datetime     default current_timestamp() not null comment '실행 시각',
    constraint fk_log_space_device
        foreign key (space_device_seq) references tb_space_device (space_device_seq)
            on delete cascade,
    constraint fk_log_command
        foreign key (command_seq) references tb_preset_command (command_seq)
            on delete cascade,
    constraint fk_log_user
        foreign key (tu_seq) references tb_users (tu_seq)
            on delete cascade
)
    comment '제어 로그' charset = utf8mb4;

create index idx_log_space_device
    on tb_control_log (space_device_seq);

create index idx_log_command
    on tb_control_log (command_seq);

create index idx_log_user
    on tb_control_log (tu_seq);

create index idx_log_trigger_type
    on tb_control_log (trigger_type);

create index idx_log_status
    on tb_control_log (result_status);

create index idx_log_executed_at
    on tb_control_log (executed_at);


-- =============================================
-- NFC 시스템 (RFID)
-- =============================================

-- NFC 리더기 마스터
create table tb_nfc_reader
(
    reader_seq          int auto_increment comment '리더기 시퀀스'
        primary key,
    space_seq           int                                  not null comment '설치 공간 시퀀스',
    reader_name         varchar(100)                         not null comment '리더기명 (예: 101호 입구 리더기)',
    reader_code         varchar(50)                          not null comment '리더기 코드 (RDR-001)',
    reader_serial       varchar(100)                         null comment '리더기 시리얼번호 (하드웨어 고유값)',
    reader_api_key      varchar(100)                         not null comment 'Agent 인증용 API Key',
    reader_status       enum ('ACTIVE', 'INACTIVE') default 'ACTIVE' null comment '리더기 상태',
    reader_isdel        char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint uk_reader_code
        unique (reader_code),
    constraint uk_reader_api_key
        unique (reader_api_key),
    constraint fk_reader_space
        foreign key (space_seq) references tb_space (space_seq)
            on delete cascade
)
    comment 'NFC 리더기 마스터' charset = utf8mb4;

create index idx_reader_space
    on tb_nfc_reader (space_seq);

create index idx_reader_status
    on tb_nfc_reader (reader_status);

create index idx_reader_isdel
    on tb_nfc_reader (reader_isdel);


-- NFC 카드/태그 마스터
create table tb_nfc_card
(
    card_seq            int auto_increment comment '카드 시퀀스'
        primary key,
    tu_seq              int                                  not null comment '소유자 시퀀스',
    card_identifier     varchar(64)                          not null comment '카드 고유 식별값 (UID 또는 앱 반환 고유값)',
    card_aid            varchar(32)                          null comment 'Application Identifier (HEX)',
    card_label          varchar(100)                         null comment '카드 별칭 (예: 김교수 스마트폰)',
    card_type           enum ('CARD', 'PHONE') default 'CARD' null comment '태그 유형',
    card_status         enum ('ACTIVE', 'INACTIVE', 'BLOCKED') default 'ACTIVE' null comment '카드 상태',
    card_isdel          char         default 'N'             null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() null comment '등록일시',
    upd_date            datetime     default current_timestamp() null on update current_timestamp() comment '수정일시',
    constraint uk_card_identifier
        unique (card_identifier),
    constraint fk_card_user
        foreign key (tu_seq) references tb_users (tu_seq)
            on delete cascade
)
    comment 'NFC 카드/태그 마스터' charset = utf8mb4;

create index idx_card_user
    on tb_nfc_card (tu_seq);

create index idx_card_aid
    on tb_nfc_card (card_aid);

create index idx_card_type
    on tb_nfc_card (card_type);

create index idx_card_status
    on tb_nfc_card (card_status);

create index idx_card_isdel
    on tb_nfc_card (card_isdel);


-- NFC 태깅 로그
create table tb_nfc_log
(
    nfc_log_seq         int auto_increment comment 'NFC 로그 시퀀스'
        primary key,
    reader_seq          int                                  not null comment '리더기 시퀀스',
    card_seq            int                                  null comment '카드 시퀀스 (미등록 카드 시 null)',
    tu_seq              int                                  null comment '사용자 시퀀스 (미등록 시 null)',
    space_seq           int                                  not null comment '공간 시퀀스 (비정규화, 조회 편의)',
    log_type            enum ('ENTER', 'EXIT', 'DENIED', 'UNKNOWN') not null comment '태깅 유형',
    tag_identifier      varchar(64)                          not null comment '태깅 시 읽힌 식별값 (raw)',
    tag_aid             varchar(32)                          null comment '태깅 시 읽힌 AID (raw)',
    control_result      enum ('SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED') null comment '장비 제어 결과 요약',
    control_detail      text                                 null comment '제어 상세 JSON (장비별 실행 결과)',
    tagged_at           datetime     default current_timestamp() not null comment '태깅 시각',
    constraint fk_nfc_log_reader
        foreign key (reader_seq) references tb_nfc_reader (reader_seq)
            on delete cascade,
    constraint fk_nfc_log_card
        foreign key (card_seq) references tb_nfc_card (card_seq)
            on delete set null,
    constraint fk_nfc_log_user
        foreign key (tu_seq) references tb_users (tu_seq)
            on delete set null,
    constraint fk_nfc_log_space
        foreign key (space_seq) references tb_space (space_seq)
            on delete cascade
)
    comment 'NFC 태깅 로그' charset = utf8mb4;

create index idx_nfc_log_reader
    on tb_nfc_log (reader_seq);

create index idx_nfc_log_card
    on tb_nfc_log (card_seq);

create index idx_nfc_log_user
    on tb_nfc_log (tu_seq);

create index idx_nfc_log_space
    on tb_nfc_log (space_seq);

create index idx_nfc_log_type
    on tb_nfc_log (log_type);

create index idx_nfc_log_control_result
    on tb_nfc_log (control_result);

create index idx_nfc_log_tagged_at
    on tb_nfc_log (tagged_at);