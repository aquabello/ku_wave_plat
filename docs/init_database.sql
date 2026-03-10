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
    command_type        varchar(20)  default 'CUSTOM'        null comment '명령어 유형 (POWER_ON, POWER_OFF, CUSTOM)',
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
    trigger_type        enum ('MANUAL', 'NFC', 'SCHEDULE', 'VOICE') default 'MANUAL' not null comment '트리거 유형 (MANUAL=콘솔, NFC=태깅, SCHEDULE=예약, VOICE=음성명령)',
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


-- NFC 리더기 명령어 매핑
create table tb_nfc_reader_command
(
    reader_command_seq  int auto_increment comment '리더기 명령어 매핑 시퀀스'
        primary key,
    reader_seq          int                                  not null comment '리더기 시퀀스',
    space_device_seq    int                                  not null comment '공간장비 시퀀스',
    enter_command_seq   int                                  null comment '입실 시 실행 명령어 시퀀스',
    exit_command_seq    int                                  null comment '퇴실 시 실행 명령어 시퀀스',
    command_isdel       char         default 'N'             not null comment '삭제 여부',
    reg_date            datetime     default current_timestamp() not null comment '등록일시',
    upd_date            datetime     default current_timestamp() not null on update current_timestamp() comment '수정일시',
    constraint uk_reader_device
        unique (reader_seq, space_device_seq),
    constraint fk_rc_reader
        foreign key (reader_seq) references tb_nfc_reader (reader_seq)
            on delete cascade,
    constraint fk_rc_space_device
        foreign key (space_device_seq) references tb_space_device (space_device_seq)
            on delete cascade,
    constraint fk_rc_enter_command
        foreign key (enter_command_seq) references tb_preset_command (command_seq)
            on delete set null,
    constraint fk_rc_exit_command
        foreign key (exit_command_seq) references tb_preset_command (command_seq)
            on delete set null
)
    comment 'NFC 리더기 명령어 매핑' charset = utf8mb4;

create index idx_rc_reader
    on tb_nfc_reader_command (reader_seq, command_isdel);

create index idx_rc_device
    on tb_nfc_reader_command (space_device_seq);


-- =============================================
-- 디스플레이 콘텐츠 승인 시스템
-- =============================================

-- tb_play_list_content 승인 컬럼 추가
ALTER TABLE tb_play_list_content
  ADD COLUMN requester_seq    INT NULL COMMENT '콘텐츠 등록 요청자 시퀀스',
  ADD COLUMN approval_status  ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' COMMENT '승인 상태',
  ADD COLUMN reviewer_seq     INT NULL COMMENT '승인/반려자 시퀀스',
  ADD COLUMN reviewed_date    DATETIME NULL COMMENT '승인/반려 일시',
  ADD COLUMN reject_reason    TEXT NULL COMMENT '반려 사유',
  ADD CONSTRAINT fk_plc_requester FOREIGN KEY (requester_seq) REFERENCES tb_users(tu_seq) ON DELETE SET NULL,
  ADD CONSTRAINT fk_plc_reviewer FOREIGN KEY (reviewer_seq) REFERENCES tb_users(tu_seq) ON DELETE SET NULL;

CREATE INDEX idx_plc_approval_status ON tb_play_list_content (approval_status);
CREATE INDEX idx_plc_reviewer ON tb_play_list_content (reviewer_seq);
CREATE INDEX idx_plc_requester ON tb_play_list_content (requester_seq);


-- 콘텐츠 승인 이력
create table tb_content_approval_log
(
    log_seq        int auto_increment comment '로그 시퀀스' primary key,
    plc_seq        int                                  not null comment '플레이리스트콘텐츠 시퀀스',
    action         enum ('APPROVED','REJECTED','CANCELLED') not null comment '수행 액션',
    actor_seq      int                                  null comment '수행자 시퀀스 (삭제 시 NULL 보존)',
    reason         text                                 null comment '사유',
    created_at     datetime default current_timestamp() comment '수행 일시',
    constraint fk_cal_plc
        foreign key (plc_seq) references tb_play_list_content (plc_seq)
            on delete cascade,
    constraint fk_cal_user
        foreign key (actor_seq) references tb_users (tu_seq)
            on delete set null
)
    comment '콘텐츠 승인 이력' charset = utf8mb4;

create index idx_cal_plc
    on tb_content_approval_log (plc_seq);

create index idx_cal_actor
    on tb_content_approval_log (actor_seq);

create index idx_cal_created
    on tb_content_approval_log (created_at);


-- =============================================
-- AI 시스템 테이블 (실시간 음성인식 + 강의요약)
-- 작성일: 2026-02-19
-- 관련문서: docs/ai-realtime-speech-design.md
-- =============================================

-- 음성 명령어 매핑
create table tb_ai_voice_command
(
    voice_command_seq int auto_increment comment '음성명령 시퀀스' primary key,
    space_seq         int                                  not null comment '공간 시퀀스',
    keyword           varchar(100)                         not null comment '음성 키워드',
    keyword_aliases   text                                 null     comment '별칭 JSON',
    space_device_seq  int                                  not null comment '제어 대상 장비 시퀀스',
    command_seq       int                                  not null comment '실행할 명령어 시퀀스',
    min_confidence    float        default 0.85            not null comment '즉시실행 임계값',
    command_priority  int          default 0               null     comment '우선순위',
    command_isdel     char         default 'N'             not null comment '삭제 여부',
    reg_date          datetime     default current_timestamp() not null comment '등록일시',
    upd_date          datetime     default current_timestamp() not null on update current_timestamp() comment '수정일시',
    constraint fk_vc_space
        foreign key (space_seq) references tb_space (space_seq) on delete cascade,
    constraint fk_vc_space_device
        foreign key (space_device_seq) references tb_space_device (space_device_seq) on delete cascade,
    constraint fk_vc_command
        foreign key (command_seq) references tb_preset_command (command_seq) on delete cascade
)
    comment '음성 명령어 매핑' charset = utf8mb4;

create index idx_vc_space    on tb_ai_voice_command (space_seq);
create index idx_vc_keyword  on tb_ai_voice_command (keyword);
create index idx_vc_device   on tb_ai_voice_command (space_device_seq);
create index idx_vc_isdel    on tb_ai_voice_command (command_isdel);


-- 음성인식 세션
create table tb_ai_speech_session
(
    session_seq        int auto_increment comment '세션 시퀀스' primary key,
    space_seq          int                                  not null comment '공간 시퀀스',
    tu_seq             int                                  null     comment '강의자 시퀀스',
    session_status     enum ('ACTIVE','PAUSED','ENDED') default 'ACTIVE' not null comment '세션 상태',
    stt_engine         varchar(50)  default 'faster-whisper' null   comment 'STT 엔진명',
    stt_model          varchar(50)  default 'small'          null   comment 'STT 모델명',
    started_at         datetime     default current_timestamp() not null comment '시작 시각',
    ended_at           datetime                             null     comment '종료 시각',
    total_duration_sec int                                  null     comment '총 세션 시간 (초)',
    total_segments     int          default 0               null     comment '총 인식 구간 수',
    total_commands     int          default 0               null     comment '총 명령 실행 수',
    recording_filename varchar(255)                         null     comment '녹음 파일명',
    summary_seq        int                                  null     comment '연결된 강의요약 시퀀스',
    session_isdel      char         default 'N'             not null comment '삭제 여부',
    reg_date           datetime     default current_timestamp() not null comment '등록일시',
    upd_date           datetime     default current_timestamp() not null on update current_timestamp() comment '수정일시',
    constraint fk_ss_space
        foreign key (space_seq) references tb_space (space_seq) on delete cascade,
    constraint fk_ss_user
        foreign key (tu_seq) references tb_users (tu_seq) on delete set null
)
    comment '음성인식 세션' charset = utf8mb4;

create index idx_ss_space   on tb_ai_speech_session (space_seq);
create index idx_ss_user    on tb_ai_speech_session (tu_seq);
create index idx_ss_status  on tb_ai_speech_session (session_status);
create index idx_ss_started on tb_ai_speech_session (started_at);
create index idx_ss_isdel   on tb_ai_speech_session (session_isdel);


-- 음성인식 로그
create table tb_ai_speech_log
(
    speech_log_seq    int auto_increment comment '음성로그 시퀀스' primary key,
    session_seq       int                                  not null comment '세션 시퀀스',
    segment_text      text                                 not null comment '인식된 텍스트',
    segment_start_sec float                                null     comment '구간 시작 (초)',
    segment_end_sec   float                                null     comment '구간 종료 (초)',
    confidence        float                                null     comment 'STT 신뢰도',
    is_command        char         default 'N'             not null comment '명령어 인식 여부',
    created_at        datetime     default current_timestamp() not null comment '생성일시',
    constraint fk_sl_session
        foreign key (session_seq) references tb_ai_speech_session (session_seq) on delete cascade
)
    comment '음성인식 로그' charset = utf8mb4;

create index idx_sl_session on tb_ai_speech_log (session_seq);
create index idx_sl_command on tb_ai_speech_log (is_command);
create index idx_sl_created on tb_ai_speech_log (created_at);


-- 음성 명령 실행 로그
create table tb_ai_command_log
(
    command_log_seq   int auto_increment comment '명령로그 시퀀스' primary key,
    session_seq       int                                  not null comment '세션 시퀀스',
    voice_command_seq int                                  null     comment '매칭된 음성명령 시퀀스',
    recognized_text   varchar(200)                         not null comment '인식된 원문',
    matched_keyword   varchar(100)                         null     comment '매칭된 키워드',
    match_score       float                                null     comment '매칭 점수',
    verify_source     enum ('LOCAL_VOSK','REMOTE_WHISPER') null     comment '확정 소스',
    execution_status  enum ('MATCHED','EXECUTED','FAILED','NO_MATCH') not null comment '실행 상태',
    execution_result  text                                 null     comment '실행 결과 JSON',
    created_at        datetime     default current_timestamp() not null comment '실행 시각',
    constraint fk_cl_session
        foreign key (session_seq) references tb_ai_speech_session (session_seq) on delete cascade,
    constraint fk_cl_voice_command
        foreign key (voice_command_seq) references tb_ai_voice_command (voice_command_seq) on delete set null
)
    comment '음성 명령 실행 로그' charset = utf8mb4;

create index idx_cl_session       on tb_ai_command_log (session_seq);
create index idx_cl_voice_command on tb_ai_command_log (voice_command_seq);
create index idx_cl_status        on tb_ai_command_log (execution_status);
create index idx_cl_created       on tb_ai_command_log (created_at);


-- 강의요약 결과
create table tb_ai_lecture_summary
(
    summary_seq        int auto_increment comment '시퀀스' primary key,
    space_seq          int                                  not null comment '공간 시퀀스',
    tu_seq             int                                  null     comment '강의자 시퀀스',
    device_code        varchar(50)                          not null comment '미니PC 식별자',
    job_id             varchar(36)                          not null comment 'ku_ai_worker Job UUID',
    recording_title    varchar(200)                         null     comment '강의 제목',
    recording_filename varchar(255)                         not null comment '원본 파일명',
    duration_seconds   int                                  null     comment '녹음 길이 (초)',
    recorded_at        datetime                             null     comment '녹음 시각',
    stt_text           longtext                             null     comment 'STT 전체 텍스트',
    stt_language       varchar(10)                          null     comment '감지 언어',
    stt_confidence     float                                null     comment 'STT 신뢰도',
    summary_text       longtext                             null     comment '요약 텍스트',
    summary_keywords   text                                 null     comment '키워드 JSON',
    process_status     enum ('UPLOADING','PROCESSING','COMPLETED','FAILED') default 'UPLOADING' not null comment '처리 상태',
    completed_at       datetime                             null     comment '처리 완료 시각',
    session_seq        int                                  null     comment '연결된 STT 세션 시퀀스',
    summary_isdel      char         default 'N'             not null comment '삭제 여부',
    reg_date           datetime     default current_timestamp() not null comment '등록일시',
    upd_date           datetime     default current_timestamp() not null on update current_timestamp() comment '수정일시',
    constraint uk_job_id unique (job_id),
    constraint fk_summary_space
        foreign key (space_seq) references tb_space (space_seq) on delete cascade,
    constraint fk_summary_user
        foreign key (tu_seq) references tb_users (tu_seq) on delete set null
)
    comment '강의요약 결과' charset = utf8mb4;

create index idx_summary_space  on tb_ai_lecture_summary (space_seq);
create index idx_summary_user   on tb_ai_lecture_summary (tu_seq);
create index idx_summary_device on tb_ai_lecture_summary (device_code);
create index idx_summary_status on tb_ai_lecture_summary (process_status);
create index idx_summary_date   on tb_ai_lecture_summary (recorded_at);
create index idx_summary_isdel  on tb_ai_lecture_summary (summary_isdel);


-- AI시스템 > 실시간 음성인식 LNB 메뉴
insert into tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order)
values (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2);


-- AI Worker 서버 등록/관리
-- ku_ai_worker(중앙 GPU 서버) 연동용
-- 통신방식: API Proxy + Callback (미니PC 고정IP)
create table tb_ai_worker_server
(
    worker_server_seq   int auto_increment comment 'Worker 서버 시퀀스' primary key,
    server_name         varchar(100)                            not null comment '서버명 (예: GPU서버-1호)',
    server_url          varchar(255)                            not null comment '서버 URL (http://10.0.1.50:8080)',
    api_key             varchar(255)                            not null comment 'API 인증키 (Worker 발급)',
    callback_secret     varchar(255)                            null     comment 'Webhook 검증용 Secret',
    server_status       enum ('ONLINE','OFFLINE','ERROR','MAINTENANCE')
                                         default 'OFFLINE'     not null comment '서버 상태',
    last_health_check   datetime                                null     comment '마지막 헬스체크 시각',
    gpu_info            varchar(200)                            null     comment 'GPU 정보 (RTX 4070 12GB)',
    max_concurrent_jobs int              default 1              not null comment '동시 처리 가능 Job 수',
    default_stt_model   varchar(50)      default 'large-v3'     null     comment '기본 STT 모델',
    default_llm_model   varchar(50)      default 'llama3'       null     comment '기본 요약 LLM 모델',
    server_isdel        char             default 'N'            not null comment '삭제 여부',
    reg_date            datetime         default current_timestamp() not null comment '등록일시',
    upd_date            datetime         default current_timestamp() not null
                                         on update current_timestamp() comment '수정일시',
    constraint uk_server_url unique (server_url)
)
    comment 'AI Worker 서버' charset = utf8mb4;

create index idx_ws_status on tb_ai_worker_server (server_status);
create index idx_ws_isdel  on tb_ai_worker_server (server_isdel);


-- =============================================
-- 녹화기 관리 시스템
-- 작성일: 2026-02-22
-- 관련문서: docs/recorder-system-design.md
-- =============================================

-- 1. 녹화기 마스터 (공간당 1대)
CREATE TABLE tb_recorder
(
    recorder_seq        INT AUTO_INCREMENT COMMENT '녹화기 시퀀스' PRIMARY KEY,
    space_seq           INT                                     NOT NULL COMMENT '공간 시퀀스',
    recorder_name       VARCHAR(100)                            NOT NULL COMMENT '녹화기명 (예: 101호 녹화기)',
    recorder_ip         VARCHAR(45)                             NOT NULL COMMENT '고정 IP',
    recorder_port       INT             DEFAULT 80              NULL     COMMENT '통신 포트',
    recorder_protocol   ENUM('HTTP','ONVIF','RTSP')  DEFAULT 'HTTP' NOT NULL COMMENT '통신 프로토콜',
    recorder_username   VARCHAR(100)                            NULL     COMMENT '녹화기 로그인 ID',
    recorder_password   VARCHAR(255)                            NULL     COMMENT '녹화기 로그인 PW (AES 암호화)',
    recorder_model      VARCHAR(100)                            NULL     COMMENT '녹화기 모델명/제조사',
    recorder_status     ENUM('ONLINE','OFFLINE','ERROR') DEFAULT 'OFFLINE' NOT NULL COMMENT '녹화기 상태',
    current_user_seq    INT                                     NULL     COMMENT '현재 사용 중인 사용자',
    last_health_check   DATETIME                                NULL     COMMENT '마지막 상태 확인 시각',
    recorder_order      INT             DEFAULT 0               NULL     COMMENT '정렬 순서',
    recorder_isdel      CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT uk_recorder_space UNIQUE (space_seq),
    CONSTRAINT fk_recorder_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_recorder_current_user
        FOREIGN KEY (current_user_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
)
    COMMENT '녹화기 마스터' CHARSET = utf8mb4;

CREATE INDEX idx_recorder_ip     ON tb_recorder (recorder_ip);
CREATE INDEX idx_recorder_status ON tb_recorder (recorder_status);
CREATE INDEX idx_recorder_isdel  ON tb_recorder (recorder_isdel);
CREATE INDEX idx_recorder_order  ON tb_recorder (recorder_order);


-- 2. 녹화기-사용자 매핑 (교수 배정)
CREATE TABLE tb_recorder_user
(
    recorder_user_seq   INT AUTO_INCREMENT COMMENT '시퀀스' PRIMARY KEY,
    recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
    tu_seq              INT                                     NOT NULL COMMENT '사용자(교수) 시퀀스',
    is_default          CHAR            DEFAULT 'N'             NOT NULL COMMENT '기본 사용자 여부',
    recorder_user_isdel CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT uk_recorder_user UNIQUE (recorder_seq, tu_seq),
    CONSTRAINT fk_ru_recorder
        FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
    CONSTRAINT fk_ru_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE CASCADE
)
    COMMENT '녹화기-사용자 매핑' CHARSET = utf8mb4;

CREATE INDEX idx_ru_recorder ON tb_recorder_user (recorder_seq);
CREATE INDEX idx_ru_user     ON tb_recorder_user (tu_seq);
CREATE INDEX idx_ru_isdel    ON tb_recorder_user (recorder_user_isdel);


-- 3. 녹화기 PTZ 프리셋
CREATE TABLE tb_recorder_preset
(
    rec_preset_seq      INT AUTO_INCREMENT COMMENT '프리셋 시퀀스' PRIMARY KEY,
    recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
    preset_name         VARCHAR(100)                            NOT NULL COMMENT '프리셋명 (예: 칠판 중심, 강단 전체)',
    preset_number       INT                                     NOT NULL COMMENT '녹화기 내부 프리셋 번호',
    pan_value           FLOAT                                   NULL     COMMENT 'Pan 값',
    tilt_value          FLOAT                                   NULL     COMMENT 'Tilt 값',
    zoom_value          FLOAT                                   NULL     COMMENT 'Zoom 값',
    preset_description  TEXT                                    NULL     COMMENT '프리셋 설명',
    preset_order        INT             DEFAULT 0               NULL     COMMENT '정렬 순서',
    preset_isdel        CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT uk_recorder_preset_number UNIQUE (recorder_seq, preset_number),
    CONSTRAINT fk_rp_recorder
        FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE
)
    COMMENT '녹화기 PTZ 프리셋' CHARSET = utf8mb4;

CREATE INDEX idx_rp_recorder ON tb_recorder_preset (recorder_seq);
CREATE INDEX idx_rp_isdel    ON tb_recorder_preset (preset_isdel);
CREATE INDEX idx_rp_order    ON tb_recorder_preset (preset_order);


-- 4. FTP 설정
CREATE TABLE tb_ftp_config
(
    ftp_config_seq      INT AUTO_INCREMENT COMMENT 'FTP 설정 시퀀스' PRIMARY KEY,
    recorder_seq        INT                                     NULL     COMMENT '녹화기 시퀀스 (NULL=글로벌 기본)',
    ftp_name            VARCHAR(100)                            NOT NULL COMMENT '설정명',
    ftp_host            VARCHAR(255)                            NOT NULL COMMENT 'FTP 호스트',
    ftp_port            INT             DEFAULT 21              NOT NULL COMMENT 'FTP 포트',
    ftp_username        VARCHAR(100)                            NOT NULL COMMENT 'FTP 계정',
    ftp_password        VARCHAR(255)                            NOT NULL COMMENT 'FTP 비밀번호 (AES 암호화)',
    ftp_path            VARCHAR(500)    DEFAULT '/'             NULL     COMMENT '업로드 기본 경로',
    ftp_protocol        ENUM('FTP','SFTP','FTPS') DEFAULT 'FTP' NOT NULL COMMENT '프로토콜',
    ftp_passive_mode    CHAR            DEFAULT 'Y'             NOT NULL COMMENT '패시브 모드 여부',
    is_default          CHAR            DEFAULT 'N'             NOT NULL COMMENT '기본 설정 여부',
    ftp_isdel           CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT fk_ftp_recorder
        FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE
)
    COMMENT 'FTP 설정' CHARSET = utf8mb4;

CREATE INDEX idx_ftp_recorder ON tb_ftp_config (recorder_seq);
CREATE INDEX idx_ftp_default  ON tb_ftp_config (is_default);
CREATE INDEX idx_ftp_isdel    ON tb_ftp_config (ftp_isdel);


-- 5. 녹화 세션
CREATE TABLE tb_recording_session
(
    rec_session_seq     INT AUTO_INCREMENT COMMENT '세션 시퀀스' PRIMARY KEY,
    recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
    tu_seq              INT                                     NULL     COMMENT '녹화 시작 사용자',
    session_status      ENUM('RECORDING','COMPLETED','FAILED','CANCELLED') NOT NULL COMMENT '세션 상태',
    rec_preset_seq      INT                                     NULL     COMMENT '사용된 프리셋',
    session_title       VARCHAR(200)                            NULL     COMMENT '강의명 / 메모',
    started_at          DATETIME                                NOT NULL COMMENT '녹화 시작 시각',
    ended_at            DATETIME                                NULL     COMMENT '녹화 종료 시각',
    duration_sec        INT                                     NULL     COMMENT '녹화 시간 (초)',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT fk_rs_recorder
        FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
    CONSTRAINT fk_rs_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL,
    CONSTRAINT fk_rs_preset
        FOREIGN KEY (rec_preset_seq) REFERENCES tb_recorder_preset (rec_preset_seq) ON DELETE SET NULL
)
    COMMENT '녹화 세션' CHARSET = utf8mb4;

CREATE INDEX idx_rs_recorder  ON tb_recording_session (recorder_seq);
CREATE INDEX idx_rs_user      ON tb_recording_session (tu_seq);
CREATE INDEX idx_rs_status    ON tb_recording_session (session_status);
CREATE INDEX idx_rs_started   ON tb_recording_session (started_at);


-- 6. 녹화 파일
CREATE TABLE tb_recording_file
(
    rec_file_seq        INT AUTO_INCREMENT COMMENT '파일 시퀀스' PRIMARY KEY,
    rec_session_seq     INT                                     NOT NULL COMMENT '세션 시퀀스',
    file_name           VARCHAR(255)                            NOT NULL COMMENT '원본 파일명',
    file_path           VARCHAR(500)                            NULL     COMMENT '녹화기 내 파일 경로',
    file_size           BIGINT                                  NULL     COMMENT '파일 크기 (bytes)',
    file_format         VARCHAR(20)                             NULL     COMMENT '파일 포맷 (mp4, avi)',
    file_duration_sec   INT                                     NULL     COMMENT '영상 길이 (초)',
    ftp_status          ENUM('PENDING','UPLOADING','COMPLETED','FAILED','RETRY') DEFAULT 'PENDING' NOT NULL COMMENT 'FTP 업로드 상태',
    ftp_config_seq      INT                                     NULL     COMMENT 'FTP 설정 시퀀스',
    ftp_uploaded_path   VARCHAR(500)                            NULL     COMMENT 'FTP 업로드 경로',
    ftp_uploaded_at     DATETIME                                NULL     COMMENT '업로드 완료 시각',
    ftp_retry_count     INT             DEFAULT 0               NOT NULL COMMENT '재시도 횟수',
    ftp_error_message   TEXT                                    NULL     COMMENT '업로드 실패 에러',
    file_isdel          CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT fk_rf_session
        FOREIGN KEY (rec_session_seq) REFERENCES tb_recording_session (rec_session_seq) ON DELETE CASCADE,
    CONSTRAINT fk_rf_ftp
        FOREIGN KEY (ftp_config_seq) REFERENCES tb_ftp_config (ftp_config_seq) ON DELETE SET NULL
)
    COMMENT '녹화 파일' CHARSET = utf8mb4;

CREATE INDEX idx_rf_session    ON tb_recording_file (rec_session_seq);
CREATE INDEX idx_rf_ftp_status ON tb_recording_file (ftp_status);
CREATE INDEX idx_rf_ftp_config ON tb_recording_file (ftp_config_seq);
CREATE INDEX idx_rf_isdel      ON tb_recording_file (file_isdel);


-- 7. 녹화기 명령 로그
CREATE TABLE tb_recorder_log
(
    rec_log_seq         INT AUTO_INCREMENT COMMENT '로그 시퀀스' PRIMARY KEY,
    recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
    tu_seq              INT                                     NULL     COMMENT '실행자 시퀀스',
    log_type            ENUM('PTZ','REC_START','REC_STOP','PRESET_APPLY','STATUS_CHECK','POWER') NOT NULL COMMENT '명령 유형',
    command_detail      TEXT                                    NULL     COMMENT '전송 명령 상세 (JSON)',
    result_status       ENUM('SUCCESS','FAIL','TIMEOUT')        NOT NULL COMMENT '실행 결과',
    result_message      TEXT                                    NULL     COMMENT '응답 메시지',
    executed_at         DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '실행 시각',
    CONSTRAINT fk_rl_recorder
        FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
    CONSTRAINT fk_rl_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
)
    COMMENT '녹화기 명령 로그' CHARSET = utf8mb4;

CREATE INDEX idx_rl_recorder  ON tb_recorder_log (recorder_seq);
CREATE INDEX idx_rl_user      ON tb_recorder_log (tu_seq);
CREATE INDEX idx_rl_type      ON tb_recorder_log (log_type);
CREATE INDEX idx_rl_status    ON tb_recorder_log (result_status);
CREATE INDEX idx_rl_executed  ON tb_recorder_log (executed_at);


-- =============================================
-- 메뉴 변경 (화면공유 → 녹화기관리)
-- =============================================

-- GNB 변경
UPDATE tb_menu SET menu_name = '녹화기관리', menu_code = 'recorder'
WHERE menu_seq = 3;

-- 기존 LNB soft delete (화면공유 하위)
UPDATE tb_menu SET menu_isdel = 'Y' WHERE parent_seq = 3 AND menu_seq IN (31, 32);

-- 신규 LNB 삽입 (ON DUPLICATE KEY로 안전 처리)
INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order) VALUES
(31, '녹화기 등록',   'recorder-list',    '/recorder/list',    'LNB', 3, 1),
(32, '녹화기 제어',   'recorder-control', '/recorder/control', 'LNB', 3, 2),
(33, '녹화 이력',     'recorder-history', '/recorder/history', 'LNB', 3, 3),
(34, '녹화파일 관리', 'recorder-files',   '/recorder/files',   'LNB', 3, 4),
(35, 'FTP 설정',      'recorder-ftp',     '/recorder/ftp',     'LNB', 3, 5)
ON DUPLICATE KEY UPDATE
    menu_name = VALUES(menu_name),
    menu_code = VALUES(menu_code),
    menu_path = VALUES(menu_path),
    menu_order = VALUES(menu_order),
    menu_isdel = 'N';