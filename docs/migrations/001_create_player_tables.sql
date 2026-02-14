-- ==========================================
-- KU WAVE Platform - Player System Migration
-- ==========================================
-- Phase 1: MVP (Core Tables)
-- 생성일: 2026-02-14
-- 설명: Digital Signage Player 관리 시스템 테이블 생성
-- ==========================================

-- ==========================================
-- 1. 플레이리스트 마스터 테이블
-- ==========================================
CREATE TABLE tb_play_list (
    playlist_seq        INT AUTO_INCREMENT COMMENT '플레이리스트 시퀀스',
    playlist_name       VARCHAR(100) NOT NULL COMMENT '플레이리스트명',
    playlist_code       VARCHAR(50) NOT NULL COMMENT '플레이리스트 코드',
    playlist_type       ENUM('NORMAL', 'EMERGENCY', 'ANNOUNCEMENT') DEFAULT 'NORMAL' COMMENT '플레이리스트 유형',
    playlist_duration   INT NULL COMMENT '총 재생 시간 (초, 계산값)',
    playlist_loop       CHAR(1) DEFAULT 'Y' COMMENT '반복 재생 여부 (Y/N)',
    playlist_description TEXT NULL COMMENT '플레이리스트 설명',
    playlist_order      INT DEFAULT 0 COMMENT '정렬 순서',
    playlist_isdel      CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (playlist_seq),
    UNIQUE KEY uk_playlist_code (playlist_code),
    KEY idx_playlist_type (playlist_type),
    KEY idx_playlist_isdel (playlist_isdel),
    KEY idx_playlist_order (playlist_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이리스트 마스터';

-- ==========================================
-- 2. 콘텐츠 마스터 테이블
-- ==========================================
CREATE TABLE tb_content (
    content_seq         INT AUTO_INCREMENT COMMENT '콘텐츠 시퀀스',
    content_name        VARCHAR(100) NOT NULL COMMENT '콘텐츠명',
    content_code        VARCHAR(50) NOT NULL COMMENT '콘텐츠 코드',
    content_type        ENUM('VIDEO', 'IMAGE', 'HTML', 'STREAM') NOT NULL COMMENT '콘텐츠 타입',
    content_file_path   VARCHAR(500) NULL COMMENT '파일 경로 (업로드 파일)',
    content_url         VARCHAR(500) NULL COMMENT '외부 URL (스트리밍)',
    content_duration    INT NULL COMMENT '재생 시간 (초)',
    content_width       INT NULL COMMENT '원본 가로 해상도',
    content_height      INT NULL COMMENT '원본 세로 해상도',
    content_size        BIGINT NULL COMMENT '파일 크기 (bytes)',
    content_mime_type   VARCHAR(100) NULL COMMENT 'MIME Type',
    content_thumbnail   VARCHAR(500) NULL COMMENT '썸네일 경로',
    content_description TEXT NULL COMMENT '콘텐츠 설명',
    content_order       INT DEFAULT 0 COMMENT '정렬 순서',
    content_isdel       CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (content_seq),
    UNIQUE KEY uk_content_code (content_code),
    KEY idx_content_type (content_type),
    KEY idx_content_isdel (content_isdel),
    KEY idx_content_order (content_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='콘텐츠 마스터';

-- ==========================================
-- 3. 플레이리스트-콘텐츠 매핑 테이블
-- ==========================================
CREATE TABLE tb_play_list_content (
    plc_seq             INT AUTO_INCREMENT COMMENT '매핑 시퀀스',
    playlist_seq        INT NOT NULL COMMENT '플레이리스트 시퀀스',
    content_seq         INT NOT NULL COMMENT '콘텐츠 시퀀스',
    play_order          INT DEFAULT 0 COMMENT '재생 순서',
    play_duration       INT NULL COMMENT '재생 시간 오버라이드 (NULL이면 원본 사용)',
    transition_effect   VARCHAR(50) NULL COMMENT '전환 효과 (fade, slide 등)',
    plc_isdel           CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',

    PRIMARY KEY (plc_seq),
    UNIQUE KEY uk_playlist_content (playlist_seq, content_seq, play_order),
    KEY idx_plc_playlist (playlist_seq, play_order),
    KEY idx_plc_content (content_seq),

    CONSTRAINT fk_plc_playlist
        FOREIGN KEY (playlist_seq) REFERENCES tb_play_list (playlist_seq) ON DELETE CASCADE,
    CONSTRAINT fk_plc_content
        FOREIGN KEY (content_seq) REFERENCES tb_content (content_seq) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이리스트-콘텐츠 매핑';

-- ==========================================
-- 4. 플레이어 마스터 테이블
-- ==========================================
CREATE TABLE tb_player (
    player_seq          INT AUTO_INCREMENT COMMENT '플레이어 시퀀스',

    -- 기본 정보
    player_name         VARCHAR(100) NOT NULL COMMENT '플레이어명 (예: 본관 1층 로비 디스플레이)',
    player_code         VARCHAR(50) NOT NULL COMMENT '플레이어 코드 (예: PLAYER-001)',
    player_did          VARCHAR(100) NULL COMMENT 'Device ID (하드웨어 고유 식별자)',
    player_mac          VARCHAR(17) NULL COMMENT 'MAC 주소 (AA:BB:CC:DD:EE:FF)',

    -- 관계 매핑
    building_seq        INT NOT NULL COMMENT '건물 시퀀스',
    space_seq           INT NULL COMMENT '공간 시퀀스 (선택적, 상세 위치 지정)',
    playlist_seq        INT NULL COMMENT '현재 활성 플레이리스트 시퀀스',

    -- 네트워크 정보
    player_ip           VARCHAR(45) NOT NULL COMMENT '플레이어 IP (IPv4/IPv6)',
    player_port         INT DEFAULT 9090 COMMENT '플레이어 통신 포트',

    -- 인증 및 보안
    player_api_key      VARCHAR(100) NOT NULL COMMENT 'API Key (플레이어 인증용)',
    player_secret       VARCHAR(255) NULL COMMENT '암호화된 시크릿 (필요 시)',

    -- 승인 프로세스
    player_approval     ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '승인 상태',
    approved_by         INT NULL COMMENT '승인자 시퀀스',
    approved_at         DATETIME NULL COMMENT '승인 일시',
    reject_reason       TEXT NULL COMMENT '반려 사유',

    -- 상태 관리
    player_status       ENUM('ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE') DEFAULT 'OFFLINE' COMMENT '플레이어 현재 상태',
    last_heartbeat_at   DATETIME NULL COMMENT '마지막 Health Check 시각',
    last_content_played VARCHAR(255) NULL COMMENT '마지막 재생 콘텐츠 (비정규화)',

    -- 플레이어 정보
    player_version      VARCHAR(20) NULL COMMENT '플레이어 SW 버전',
    player_resolution   VARCHAR(20) NULL COMMENT '화면 해상도 (예: 1920x1080)',
    player_orientation  ENUM('LANDSCAPE', 'PORTRAIT') DEFAULT 'LANDSCAPE' COMMENT '화면 방향',

    -- 메타데이터
    player_description  TEXT NULL COMMENT '플레이어 설명/메모',
    player_order        INT DEFAULT 0 COMMENT '정렬 순서',
    player_isdel        CHAR(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
    reg_date            DATETIME DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일시',
    upd_date            DATETIME DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    PRIMARY KEY (player_seq),
    UNIQUE KEY uk_player_code (player_code),
    UNIQUE KEY uk_player_did (player_did),
    UNIQUE KEY uk_player_api_key (player_api_key),
    KEY idx_player_building (building_seq),
    KEY idx_player_space (space_seq),
    KEY idx_player_playlist (playlist_seq),
    KEY idx_player_status (player_status),
    KEY idx_player_approval (player_approval),
    KEY idx_player_isdel (player_isdel),
    KEY idx_player_order (player_order),
    KEY idx_player_last_heartbeat (last_heartbeat_at),
    KEY idx_player_building_status (building_seq, player_status, player_isdel),

    CONSTRAINT fk_player_building
        FOREIGN KEY (building_seq) REFERENCES tb_building (building_seq) ON DELETE CASCADE,
    CONSTRAINT fk_player_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE SET NULL,
    CONSTRAINT fk_player_playlist
        FOREIGN KEY (playlist_seq) REFERENCES tb_play_list (playlist_seq) ON DELETE SET NULL,
    CONSTRAINT fk_player_approver
        FOREIGN KEY (approved_by) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Digital Signage Player (DID) 마스터';

-- ==========================================
-- 5. 플레이어 Health Check 로그 테이블
-- ==========================================
CREATE TABLE tb_player_heartbeat_log (
    heartbeat_seq       INT AUTO_INCREMENT COMMENT 'Heartbeat 시퀀스',
    player_seq          INT NOT NULL COMMENT '플레이어 시퀀스',
    heartbeat_at        DATETIME DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT 'Health Check 시각',
    player_ip           VARCHAR(45) NULL COMMENT '요청 IP (검증용)',
    player_version      VARCHAR(20) NULL COMMENT '보고된 버전',
    cpu_usage           DECIMAL(5,2) NULL COMMENT 'CPU 사용률 (%)',
    memory_usage        DECIMAL(5,2) NULL COMMENT '메모리 사용률 (%)',
    disk_usage          DECIMAL(5,2) NULL COMMENT '디스크 사용률 (%)',
    current_playlist    INT NULL COMMENT '현재 재생 중인 플레이리스트',
    current_content     VARCHAR(255) NULL COMMENT '현재 재생 중인 콘텐츠',
    error_message       TEXT NULL COMMENT '에러 메시지 (있을 경우)',

    PRIMARY KEY (heartbeat_seq),
    KEY idx_heartbeat_player (player_seq),
    KEY idx_heartbeat_at (heartbeat_at),

    CONSTRAINT fk_heartbeat_player
        FOREIGN KEY (player_seq) REFERENCES tb_player (player_seq) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='플레이어 Health Check 로그';

-- ==========================================
-- 초기 샘플 데이터 (선택적)
-- ==========================================
-- 기본 플레이리스트 생성
INSERT INTO tb_play_list (playlist_name, playlist_code, playlist_type, playlist_loop) VALUES
('기본 플레이리스트', 'DEFAULT-001', 'NORMAL', 'Y'),
('긴급 공지', 'EMERGENCY-001', 'EMERGENCY', 'Y');

-- 샘플 콘텐츠 생성
INSERT INTO tb_content (content_name, content_code, content_type, content_duration) VALUES
('환영 메시지', 'WELCOME-001', 'IMAGE', 10),
('공지사항', 'NOTICE-001', 'IMAGE', 15);

-- 플레이리스트-콘텐츠 매핑
INSERT INTO tb_play_list_content (playlist_seq, content_seq, play_order) VALUES
(1, 1, 1),
(1, 2, 2);

-- ==========================================
-- 마이그레이션 완료
-- ==========================================
-- 다음 단계:
-- 1. 이 스크립트를 검토하고 승인
-- 2. 개발 DB에 적용: mysql -h host -u user -p database < 001_create_player_tables.sql
-- 3. TypeORM Entity 생성 (ku-api 에이전트에게 위임)
-- 4. API 개발 시작
-- ==========================================
