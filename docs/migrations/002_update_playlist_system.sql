-- ==========================================
-- KU WAVE Platform - Playlist System Update
-- ==========================================
-- Phase 1-B: 플레이리스트 시스템 고도화
-- 생성일: 2026-02-14
-- 설명: 멀티존 레이아웃, 랜덤 재생, 스케줄링, 그룹 관리 추가
-- ==========================================

-- ==========================================
-- 1. tb_play_list 테이블 수정
-- ==========================================
ALTER TABLE tb_play_list
    -- 랜덤 재생 여부 추가
    ADD COLUMN playlist_random CHAR(1) DEFAULT 'N' COMMENT '랜덤 재생 여부 (Y/N)' AFTER playlist_loop,

    -- 스크린 구성 (멀티존 레이아웃) 추가
    ADD COLUMN playlist_screen_layout ENUM('1x1', '1x2', '1x3', '1x4', '2x2', '2x4', '1x8') DEFAULT '1x1'
        COMMENT '화면 분할 레이아웃 (1x1=단일, 1x8=1행8열)' AFTER playlist_random,

    -- 사용 상태 추가 (playlist_isdel과 별도)
    ADD COLUMN playlist_status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
        COMMENT '사용 상태 (ACTIVE=사용, INACTIVE=임시중지)' AFTER playlist_order,

    -- 우선순위 추가 (긴급 공지용)
    ADD COLUMN playlist_priority TINYINT DEFAULT 0
        COMMENT '우선순위 (높을수록 우선, 긴급 공지=99)' AFTER playlist_type,

    -- 인덱스 추가
    ADD INDEX idx_playlist_status (playlist_status),
    ADD INDEX idx_playlist_priority (playlist_priority),
    ADD INDEX idx_playlist_screen_layout (playlist_screen_layout);

-- ==========================================
-- 2. tb_play_list_content 테이블 수정
-- ==========================================
-- 멀티존 레이아웃 지원을 위한 컬럼 추가
ALTER TABLE tb_play_list_content
    -- 영역 번호 (1~8)
    ADD COLUMN zone_number TINYINT DEFAULT 1
        COMMENT '영역 번호 (1~8, 1x1일 때는 1만 사용)' AFTER content_seq,

    -- 영역 크기 및 위치 (%, 멀티존일 때 사용)
    ADD COLUMN zone_width DECIMAL(5,2) DEFAULT 100.00
        COMMENT '영역 너비 (%, 1x8일 때 12.5)' AFTER zone_number,
    ADD COLUMN zone_height DECIMAL(5,2) DEFAULT 100.00
        COMMENT '영역 높이 (%)' AFTER zone_width,
    ADD COLUMN zone_x_position DECIMAL(5,2) DEFAULT 0.00
        COMMENT 'X 좌표 (%, 좌측 기준)' AFTER zone_height,
    ADD COLUMN zone_y_position DECIMAL(5,2) DEFAULT 0.00
        COMMENT 'Y 좌표 (%, 상단 기준)' AFTER zone_x_position,

    -- 전환 효과 추가
    ADD COLUMN transition_duration INT DEFAULT 0
        COMMENT '전환 시간 (밀리초)' AFTER transition_effect,

    -- 기존 UNIQUE 제약조건 삭제 후 zone_number 포함하여 재생성
    DROP INDEX uk_playlist_content,
    ADD CONSTRAINT uk_playlist_content_zone UNIQUE (playlist_seq, content_seq, zone_number),

    -- 인덱스 추가
    ADD INDEX idx_plc_zone (playlist_seq, zone_number);

-- ==========================================
-- 3. tb_content 테이블 수정
-- ==========================================
-- 콘텐츠 방향 지원 추가
ALTER TABLE tb_content
    ADD COLUMN content_orientation ENUM('LANDSCAPE', 'PORTRAIT', 'BOTH') DEFAULT 'BOTH'
        COMMENT '지원 화면 방향 (LANDSCAPE=가로, PORTRAIT=세로, BOTH=둘다)' AFTER content_duration,

    -- 콘텐츠 카테고리 및 태그
    ADD COLUMN content_category VARCHAR(50) NULL
        COMMENT '카테고리 (공지사항, 홍보, 교육 등)' AFTER content_orientation,
    ADD COLUMN content_tags VARCHAR(500) NULL
        COMMENT '태그 (JSON Array 또는 쉼표 구분)' AFTER content_category,

    -- 유효기간
    ADD COLUMN valid_from DATETIME NULL
        COMMENT '유효 시작일시' AFTER content_tags,
    ADD COLUMN valid_to DATETIME NULL
        COMMENT '유효 종료일시' AFTER valid_from,

    -- 재생 통계
    ADD COLUMN play_count INT DEFAULT 0
        COMMENT '총 재생 횟수' AFTER valid_to,

    -- 사용 상태
    ADD COLUMN content_status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
        COMMENT '사용 상태' AFTER content_order,

    -- 인덱스 추가
    ADD INDEX idx_content_orientation (content_orientation),
    ADD INDEX idx_content_category (content_category),
    ADD INDEX idx_content_status (content_status),
    ADD INDEX idx_valid_period (valid_from, valid_to);

-- ==========================================
-- 4. tb_player 테이블 수정
-- ==========================================
-- 플레이어 기본 볼륨 추가
ALTER TABLE tb_player
    ADD COLUMN default_volume TINYINT DEFAULT 50
        COMMENT '기본 볼륨 (0-100)' AFTER player_orientation;

-- ==========================================
-- 5. 플레이어-플레이리스트 할당 테이블 생성
-- ==========================================
CREATE TABLE tb_player_playlist (
    pp_seq              INT AUTO_INCREMENT COMMENT '할당 시퀀스',
    player_seq          INT NOT NULL COMMENT '플레이어 시퀀스',
    playlist_seq        INT NOT NULL COMMENT '플레이리스트 시퀀스',

    -- 할당 우선순위 (여러 플레이리스트 할당 시)
    pp_priority         TINYINT DEFAULT 0 COMMENT '우선순위 (높을수록 우선)',

    -- 스케줄 (NULL이면 항상 재생)
    schedule_start_time TIME NULL COMMENT '시작 시간 (예: 09:00:00)',
    schedule_end_time   TIME NULL COMMENT '종료 시간 (예: 18:00:00)',
    schedule_days       VARCHAR(14) NULL COMMENT '요일 (예: 1,2,3,4,5 = 월~금, 1=월요일)',

    -- 할당 상태
    pp_status           ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '할당 상태',
    pp_isdel            CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '할당일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (pp_seq),
    CONSTRAINT fk_pp_player FOREIGN KEY (player_seq)
        REFERENCES tb_player(player_seq) ON DELETE CASCADE,
    CONSTRAINT fk_pp_playlist FOREIGN KEY (playlist_seq)
        REFERENCES tb_play_list(playlist_seq) ON DELETE CASCADE,

    INDEX idx_pp_player (player_seq),
    INDEX idx_pp_playlist (playlist_seq),
    INDEX idx_pp_priority (pp_priority),
    INDEX idx_pp_status (pp_status),
    INDEX idx_pp_schedule (schedule_start_time, schedule_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이어-플레이리스트 할당';

-- ==========================================
-- 6. 플레이어 그룹 테이블 생성
-- ==========================================
CREATE TABLE tb_player_group (
    group_seq           INT AUTO_INCREMENT COMMENT '그룹 시퀀스',
    group_name          VARCHAR(100) NOT NULL COMMENT '그룹명',
    group_code          VARCHAR(50) NOT NULL COMMENT '그룹 코드',
    building_seq        INT NULL COMMENT '건물 시퀀스 (건물별 그룹화)',
    group_description   TEXT NULL COMMENT '그룹 설명',
    group_order         INT DEFAULT 0 COMMENT '정렬 순서',
    group_isdel         CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (group_seq),
    UNIQUE KEY uk_group_code (group_code),
    CONSTRAINT fk_group_building FOREIGN KEY (building_seq)
        REFERENCES tb_building(building_seq) ON DELETE SET NULL,

    INDEX idx_group_building (building_seq),
    INDEX idx_group_isdel (group_isdel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이어 그룹';

-- ==========================================
-- 7. 플레이어 그룹 멤버 테이블 생성
-- ==========================================
CREATE TABLE tb_player_group_member (
    pgm_seq             INT AUTO_INCREMENT COMMENT '멤버 시퀀스',
    group_seq           INT NOT NULL COMMENT '그룹 시퀀스',
    player_seq          INT NOT NULL COMMENT '플레이어 시퀀스',
    pgm_isdel           CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',

    PRIMARY KEY (pgm_seq),
    CONSTRAINT uk_group_player UNIQUE (group_seq, player_seq),
    CONSTRAINT fk_pgm_group FOREIGN KEY (group_seq)
        REFERENCES tb_player_group(group_seq) ON DELETE CASCADE,
    CONSTRAINT fk_pgm_player FOREIGN KEY (player_seq)
        REFERENCES tb_player(player_seq) ON DELETE CASCADE,

    INDEX idx_pgm_group (group_seq),
    INDEX idx_pgm_player (player_seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이어 그룹 멤버십';

-- ==========================================
-- 8. 그룹-플레이리스트 할당 테이블 생성
-- ==========================================
CREATE TABLE tb_group_playlist (
    gp_seq              INT AUTO_INCREMENT COMMENT '할당 시퀀스',
    group_seq           INT NOT NULL COMMENT '그룹 시퀀스',
    playlist_seq        INT NOT NULL COMMENT '플레이리스트 시퀀스',

    -- 할당 우선순위
    gp_priority         TINYINT DEFAULT 0 COMMENT '우선순위',

    -- 스케줄
    schedule_start_time TIME NULL COMMENT '시작 시간',
    schedule_end_time   TIME NULL COMMENT '종료 시간',
    schedule_days       VARCHAR(14) NULL COMMENT '요일',

    gp_status           ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '할당 상태',
    gp_isdel            CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '할당일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (gp_seq),
    CONSTRAINT fk_gp_group FOREIGN KEY (group_seq)
        REFERENCES tb_player_group(group_seq) ON DELETE CASCADE,
    CONSTRAINT fk_gp_playlist FOREIGN KEY (playlist_seq)
        REFERENCES tb_play_list(playlist_seq) ON DELETE CASCADE,

    INDEX idx_gp_group (group_seq),
    INDEX idx_gp_playlist (playlist_seq),
    INDEX idx_gp_priority (gp_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='그룹-플레이리스트 할당';

-- ==========================================
-- 9. 재생 로그 테이블 생성 (통계/분석용)
-- ==========================================
CREATE TABLE tb_play_log (
    log_seq             BIGINT AUTO_INCREMENT COMMENT '로그 시퀀스',
    player_seq          INT NOT NULL COMMENT '플레이어 시퀀스',
    playlist_seq        INT NULL COMMENT '플레이리스트 시퀀스',
    content_seq         INT NOT NULL COMMENT '콘텐츠 시퀀스',
    zone_number         TINYINT DEFAULT 1 COMMENT '재생 영역 번호',

    -- 재생 시간
    play_started_at     DATETIME NOT NULL COMMENT '재생 시작 시각',
    play_ended_at       DATETIME NULL COMMENT '재생 종료 시각',
    play_duration       INT NULL COMMENT '실제 재생 시간 (초)',

    -- 재생 상태
    play_status         ENUM('COMPLETED', 'SKIPPED', 'ERROR') DEFAULT 'COMPLETED'
                        COMMENT '재생 상태 (COMPLETED=정상완료, SKIPPED=건너뜀, ERROR=오류)',
    error_message       TEXT NULL COMMENT '오류 메시지 (ERROR 시)',

    PRIMARY KEY (log_seq),
    CONSTRAINT fk_log_player FOREIGN KEY (player_seq)
        REFERENCES tb_player(player_seq) ON DELETE CASCADE,
    CONSTRAINT fk_log_content FOREIGN KEY (content_seq)
        REFERENCES tb_content(content_seq) ON DELETE CASCADE,

    INDEX idx_log_player (player_seq),
    INDEX idx_log_playlist (playlist_seq),
    INDEX idx_log_content (content_seq),
    INDEX idx_log_datetime (play_started_at),
    INDEX idx_log_status (play_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='재생 로그 (통계/분석용)';

-- ==========================================
-- 10. 샘플 데이터 업데이트
-- ==========================================
-- 기존 플레이리스트에 새 필드 기본값 설정
UPDATE tb_play_list SET
    playlist_random = 'N',
    playlist_screen_layout = '1x1',
    playlist_status = 'ACTIVE',
    playlist_priority = 0
WHERE playlist_seq IN (1, 2);

-- 기존 콘텐츠에 새 필드 기본값 설정
UPDATE tb_content SET
    content_orientation = 'BOTH',
    content_status = 'ACTIVE',
    play_count = 0;

-- 기존 플레이리스트-콘텐츠 매핑에 zone 정보 설정
UPDATE tb_play_list_content SET
    zone_number = 1,
    zone_width = 100.00,
    zone_height = 100.00,
    zone_x_position = 0.00,
    zone_y_position = 0.00;

-- 샘플 플레이어 그룹 생성
INSERT INTO tb_player_group (group_name, group_code, building_seq, group_description) VALUES
('본관 전체 플레이어', 'GROUP-MAIN', 1, '본관 건물 내 모든 플레이어'),
('로비 디스플레이', 'GROUP-LOBBY', 1, '각 층 로비 디스플레이');

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 다음 단계:
-- 1. 이 스크립트를 검토하고 승인
-- 2. 개발 DB에 적용: mysql -h host -u user -p database < 002_update_playlist_system.sql
-- 3. TypeORM Entity 수정 (ku-api 에이전트에게 위임)
-- 4. API 명세서 업데이트
-- ==========================================
