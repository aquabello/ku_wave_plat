-- ============================================================================
-- ku_wave_plat 데이터베이스 초기화 스크립트
-- 생성일: 2026-03-28
-- 개발 서버 스키마 기준 동기화
-- 테이블 수: 41
-- ============================================================================
--
-- 도메인 구성:
--   1. 시스템/인증     (3) : tb_setting, tb_users, tb_activity_log
--   2. RBAC           (2) : tb_menu, tb_menu_users
--   3. 물리 계층       (3) : tb_building, tb_space, tb_user_building
--   4. IoT 컨트롤러   (5) : tb_device_preset, tb_preset_command, tb_space_device,
--                             tb_control_log, tb_socket_command
--   5. NFC/RFID        (4) : tb_nfc_reader, tb_nfc_card, tb_nfc_log,
--                             tb_nfc_reader_command
--   6. 디스플레이/DID  (11) : tb_content, tb_play_list, tb_play_list_content,
--                             tb_content_approval_log, tb_player,
--                             tb_player_heartbeat_log, tb_player_group,
--                             tb_player_group_member, tb_player_playlist,
--                             tb_group_playlist, tb_play_log
--   7. 녹화            (7) : tb_recorder, tb_recorder_user, tb_recorder_preset,
--                             tb_ftp_config, tb_recording_session,
--                             tb_recording_file, tb_recorder_log
--   8. AI 시스템       (6) : tb_ai_worker_server, tb_ai_voice_command,
--                             tb_ai_speech_session, tb_ai_speech_log,
--                             tb_ai_command_log, tb_ai_lecture_summary
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- DROP 기존 테이블 (역순)
DROP TABLE IF EXISTS `tb_users`;
DROP TABLE IF EXISTS `tb_user_building`;
DROP TABLE IF EXISTS `tb_space_device`;
DROP TABLE IF EXISTS `tb_space`;
DROP TABLE IF EXISTS `tb_socket_command`;
DROP TABLE IF EXISTS `tb_setting`;
DROP TABLE IF EXISTS `tb_recording_session`;
DROP TABLE IF EXISTS `tb_recording_file`;
DROP TABLE IF EXISTS `tb_recorder_user`;
DROP TABLE IF EXISTS `tb_recorder_preset`;
DROP TABLE IF EXISTS `tb_recorder_log`;
DROP TABLE IF EXISTS `tb_recorder`;
DROP TABLE IF EXISTS `tb_preset_command`;
DROP TABLE IF EXISTS `tb_player_playlist`;
DROP TABLE IF EXISTS `tb_player_heartbeat_log`;
DROP TABLE IF EXISTS `tb_player_group_member`;
DROP TABLE IF EXISTS `tb_player_group`;
DROP TABLE IF EXISTS `tb_player`;
DROP TABLE IF EXISTS `tb_play_log`;
DROP TABLE IF EXISTS `tb_play_list_content`;
DROP TABLE IF EXISTS `tb_play_list`;
DROP TABLE IF EXISTS `tb_nfc_reader_command`;
DROP TABLE IF EXISTS `tb_nfc_reader`;
DROP TABLE IF EXISTS `tb_nfc_log`;
DROP TABLE IF EXISTS `tb_nfc_card`;
DROP TABLE IF EXISTS `tb_menu_users`;
DROP TABLE IF EXISTS `tb_menu`;
DROP TABLE IF EXISTS `tb_group_playlist`;
DROP TABLE IF EXISTS `tb_ftp_config`;
DROP TABLE IF EXISTS `tb_device_preset`;
DROP TABLE IF EXISTS `tb_control_log`;
DROP TABLE IF EXISTS `tb_content_approval_log`;
DROP TABLE IF EXISTS `tb_content`;
DROP TABLE IF EXISTS `tb_building`;
DROP TABLE IF EXISTS `tb_ai_worker_server`;
DROP TABLE IF EXISTS `tb_ai_voice_command`;
DROP TABLE IF EXISTS `tb_ai_speech_session`;
DROP TABLE IF EXISTS `tb_ai_speech_log`;
DROP TABLE IF EXISTS `tb_ai_lecture_summary`;
DROP TABLE IF EXISTS `tb_ai_command_log`;
DROP TABLE IF EXISTS `tb_activity_log`;


-- ----------------------------------------------------------------------------
-- tb_activity_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_activity_log` (
  `log_seq` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '로그 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '사용자 시퀀스',
  `tu_id` varchar(20) DEFAULT NULL COMMENT '사용자 아이디',
  `tu_name` varchar(50) DEFAULT NULL COMMENT '사용자 이름',
  `http_method` varchar(10) NOT NULL COMMENT 'HTTP 메서드',
  `request_url` varchar(500) NOT NULL COMMENT '요청 URL',
  `action_name` varchar(100) DEFAULT NULL COMMENT '행위명',
  `status_code` int(11) DEFAULT NULL COMMENT 'HTTP 응답 코드',
  `request_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '요청 데이터' CHECK (json_valid(`request_body`)),
  `response_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '응답 데이터' CHECK (json_valid(`response_body`)),
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP 주소',
  `user_agent` varchar(500) DEFAULT NULL COMMENT 'User-Agent',
  `duration_ms` int(11) DEFAULT NULL COMMENT '처리시간(ms)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '발생일시',
  PRIMARY KEY (`log_seq`),
  KEY `idx_log_user` (`tu_seq`),
  KEY `idx_log_method` (`http_method`),
  KEY `idx_log_date` (`reg_date`),
  KEY `idx_log_url` (`request_url`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='활동 로그';


-- ----------------------------------------------------------------------------
-- tb_ai_command_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_command_log` (
  `command_log_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '명령로그 시퀀스',
  `session_seq` int(11) NOT NULL COMMENT '세션 시퀀스',
  `voice_command_seq` int(11) DEFAULT NULL COMMENT '매칭된 음성명령 시퀀스',
  `recognized_text` varchar(200) NOT NULL COMMENT '인식된 원문',
  `matched_keyword` varchar(100) DEFAULT NULL COMMENT '매칭된 키워드',
  `match_score` float DEFAULT NULL COMMENT '매칭 점수',
  `verify_source` enum('LOCAL_VOSK','REMOTE_WHISPER') DEFAULT NULL COMMENT '확정 소스',
  `execution_status` enum('MATCHED','EXECUTED','FAILED','NO_MATCH') NOT NULL COMMENT '실행 상태',
  `execution_result` text DEFAULT NULL COMMENT '실행 결과 JSON',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '실행 시각',
  PRIMARY KEY (`command_log_seq`),
  KEY `idx_cl_session` (`session_seq`),
  KEY `idx_cl_voice_command` (`voice_command_seq`),
  KEY `idx_cl_status` (`execution_status`),
  KEY `idx_cl_created` (`created_at`),
  CONSTRAINT `fk_cl_session` FOREIGN KEY (`session_seq`) REFERENCES `tb_ai_speech_session` (`session_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_cl_voice_command` FOREIGN KEY (`voice_command_seq`) REFERENCES `tb_ai_voice_command` (`voice_command_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 명령 실행 로그';


-- ----------------------------------------------------------------------------
-- tb_ai_lecture_summary
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_lecture_summary` (
  `summary_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '강의자 시퀀스',
  `device_code` varchar(50) NOT NULL COMMENT '미니PC 식별자',
  `job_id` varchar(36) NOT NULL COMMENT 'ku_ai_worker Job UUID',
  `recording_title` varchar(200) DEFAULT NULL COMMENT '강의 제목',
  `recording_filename` varchar(255) NOT NULL COMMENT '원본 파일명',
  `duration_seconds` int(11) DEFAULT NULL COMMENT '녹음 길이 (초)',
  `recorded_at` datetime DEFAULT NULL COMMENT '녹음 시각',
  `stt_text` longtext DEFAULT NULL COMMENT 'STT 전체 텍스트',
  `stt_language` varchar(10) DEFAULT NULL COMMENT '감지 언어',
  `stt_confidence` float DEFAULT NULL COMMENT 'STT 신뢰도',
  `summary_text` longtext DEFAULT NULL COMMENT '요약 텍스트',
  `summary_keywords` text DEFAULT NULL COMMENT '키워드 JSON',
  `process_status` enum('UPLOADING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'UPLOADING' COMMENT '처리 상태',
  `completed_at` datetime DEFAULT NULL COMMENT '처리 완료 시각',
  `session_seq` int(11) DEFAULT NULL COMMENT '연결된 STT 세션 시퀀스',
  `summary_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`summary_seq`),
  UNIQUE KEY `uk_job_id` (`job_id`),
  KEY `idx_summary_space` (`space_seq`),
  KEY `idx_summary_user` (`tu_seq`),
  KEY `idx_summary_device` (`device_code`),
  KEY `idx_summary_status` (`process_status`),
  KEY `idx_summary_date` (`recorded_at`),
  KEY `idx_summary_isdel` (`summary_isdel`),
  CONSTRAINT `fk_summary_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_summary_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강의요약 결과';


-- ----------------------------------------------------------------------------
-- tb_ai_speech_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_speech_log` (
  `speech_log_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '음성로그 시퀀스',
  `session_seq` int(11) NOT NULL COMMENT '세션 시퀀스',
  `segment_text` text NOT NULL COMMENT '인식된 텍스트',
  `segment_start_sec` float DEFAULT NULL COMMENT '구간 시작 (초)',
  `segment_end_sec` float DEFAULT NULL COMMENT '구간 종료 (초)',
  `confidence` float DEFAULT NULL COMMENT 'STT 신뢰도',
  `is_command` char(1) NOT NULL DEFAULT 'N' COMMENT '명령어 인식 여부',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '생성일시',
  PRIMARY KEY (`speech_log_seq`),
  KEY `idx_sl_session` (`session_seq`),
  KEY `idx_sl_command` (`is_command`),
  KEY `idx_sl_created` (`created_at`),
  CONSTRAINT `fk_sl_session` FOREIGN KEY (`session_seq`) REFERENCES `tb_ai_speech_session` (`session_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성인식 로그';


-- ----------------------------------------------------------------------------
-- tb_ai_speech_session
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_speech_session` (
  `session_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '세션 시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '강의자 시퀀스',
  `session_status` enum('ACTIVE','PAUSED','ENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT '세션 상태',
  `stt_engine` varchar(50) DEFAULT 'faster-whisper' COMMENT 'STT 엔진명',
  `stt_model` varchar(50) DEFAULT 'small' COMMENT 'STT 모델명',
  `started_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '시작 시각',
  `ended_at` datetime DEFAULT NULL COMMENT '종료 시각',
  `total_duration_sec` int(11) DEFAULT NULL COMMENT '총 세션 시간 (초)',
  `total_segments` int(11) DEFAULT 0 COMMENT '총 인식 구간 수',
  `total_commands` int(11) DEFAULT 0 COMMENT '총 명령 실행 수',
  `recording_filename` varchar(255) DEFAULT NULL COMMENT '녹음 파일명',
  `summary_seq` int(11) DEFAULT NULL COMMENT '연결된 강의요약 시퀀스',
  `session_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`session_seq`),
  KEY `idx_ss_space` (`space_seq`),
  KEY `idx_ss_user` (`tu_seq`),
  KEY `idx_ss_status` (`session_status`),
  KEY `idx_ss_started` (`started_at`),
  KEY `idx_ss_isdel` (`session_isdel`),
  CONSTRAINT `fk_ss_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_ss_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성인식 세션';


-- ----------------------------------------------------------------------------
-- tb_ai_voice_command
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_voice_command` (
  `voice_command_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '음성명령 시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스',
  `keyword` varchar(100) NOT NULL COMMENT '음성 키워드',
  `keyword_aliases` text DEFAULT NULL COMMENT '별칭 JSON',
  `space_device_seq` int(11) NOT NULL COMMENT '제어 대상 장비 시퀀스',
  `command_seq` int(11) NOT NULL COMMENT '실행할 명령어 시퀀스',
  `min_confidence` float NOT NULL DEFAULT 0.85 COMMENT '즉시실행 임계값',
  `command_priority` int(11) DEFAULT 0 COMMENT '우선순위',
  `command_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`voice_command_seq`),
  KEY `fk_vc_command` (`command_seq`),
  KEY `idx_vc_space` (`space_seq`),
  KEY `idx_vc_keyword` (`keyword`),
  KEY `idx_vc_device` (`space_device_seq`),
  KEY `idx_vc_isdel` (`command_isdel`),
  CONSTRAINT `fk_vc_command` FOREIGN KEY (`command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_vc_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_vc_space_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 명령어 매핑';


-- ----------------------------------------------------------------------------
-- tb_ai_worker_server
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ai_worker_server` (
  `worker_server_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Worker 서버 시퀀스',
  `server_name` varchar(100) NOT NULL COMMENT '서버명',
  `server_url` varchar(255) NOT NULL COMMENT '서버 URL',
  `api_key` varchar(255) NOT NULL COMMENT 'API 인증키',
  `callback_secret` varchar(255) DEFAULT NULL COMMENT 'Webhook 검증용 Secret',
  `server_status` enum('ONLINE','OFFLINE','ERROR','MAINTENANCE') NOT NULL DEFAULT 'OFFLINE' COMMENT '서버 상태',
  `last_health_check` datetime DEFAULT NULL COMMENT '마지막 헬스체크 시각',
  `gpu_info` varchar(200) DEFAULT NULL COMMENT 'GPU 정보',
  `max_concurrent_jobs` int(11) NOT NULL DEFAULT 1 COMMENT '동시 처리 가능 Job 수',
  `default_stt_model` varchar(50) DEFAULT 'large-v3' COMMENT '기본 STT 모델',
  `default_llm_model` varchar(50) DEFAULT 'llama3' COMMENT '기본 요약 LLM 모델',
  `server_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`worker_server_seq`),
  UNIQUE KEY `server_url` (`server_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI Worker 서버 관리';


-- ----------------------------------------------------------------------------
-- tb_building
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_building` (
  `building_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '건물 시퀀스',
  `building_name` varchar(100) NOT NULL COMMENT '건물명',
  `building_code` varchar(50) NOT NULL COMMENT '건물 코드 (예: BLD-001)',
  `building_location` text DEFAULT NULL COMMENT '위치 설명',
  `building_floor_count` int(11) DEFAULT 0 COMMENT '층수',
  `building_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `building_manager_name` varchar(100) DEFAULT NULL COMMENT '건물 담당자',
  `building_manager_phone` varchar(20) DEFAULT NULL COMMENT '담당자 연락처',
  `building_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`building_seq`),
  UNIQUE KEY `building_code` (`building_code`),
  KEY `idx_building_code` (`building_code`),
  KEY `idx_building_isdel` (`building_isdel`),
  KEY `idx_building_name` (`building_name`),
  KEY `idx_building_order` (`building_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='건물 마스터';


-- ----------------------------------------------------------------------------
-- tb_content
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_content` (
  `content_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '콘텐츠 시퀀스',
  `content_name` varchar(100) NOT NULL COMMENT '콘텐츠명',
  `content_code` varchar(50) NOT NULL COMMENT '콘텐츠 코드',
  `content_type` enum('VIDEO','IMAGE','HTML','STREAM') NOT NULL COMMENT '콘텐츠 타입',
  `content_file_path` varchar(500) DEFAULT NULL COMMENT '파일 경로 (업로드 파일)',
  `content_url` varchar(500) DEFAULT NULL COMMENT '외부 URL (스트리밍)',
  `content_duration` int(11) DEFAULT NULL COMMENT '재생 시간 (초)',
  `content_orientation` enum('LANDSCAPE','PORTRAIT','BOTH') DEFAULT 'BOTH' COMMENT '지원 화면 방향 (LANDSCAPE=가로, PORTRAIT=세로, BOTH=둘다)',
  `content_category` varchar(50) DEFAULT NULL COMMENT '카테고리 (공지사항, 홍보, 교육 등)',
  `content_tags` varchar(500) DEFAULT NULL COMMENT '태그 (JSON Array 또는 쉼표 구분)',
  `valid_from` datetime DEFAULT NULL COMMENT '유효 시작일시',
  `valid_to` datetime DEFAULT NULL COMMENT '유효 종료일시',
  `play_count` int(11) DEFAULT 0 COMMENT '총 재생 횟수',
  `content_width` int(11) DEFAULT NULL COMMENT '원본 가로 해상도',
  `content_height` int(11) DEFAULT NULL COMMENT '원본 세로 해상도',
  `content_size` bigint(20) DEFAULT NULL COMMENT '파일 크기 (bytes)',
  `content_mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME Type',
  `content_thumbnail` varchar(500) DEFAULT NULL COMMENT '썸네일 경로',
  `content_description` text DEFAULT NULL COMMENT '콘텐츠 설명',
  `content_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `content_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '사용 상태',
  `content_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`content_seq`),
  UNIQUE KEY `uk_content_code` (`content_code`),
  KEY `idx_content_type` (`content_type`),
  KEY `idx_content_isdel` (`content_isdel`),
  KEY `idx_content_order` (`content_order`),
  KEY `idx_content_orientation` (`content_orientation`),
  KEY `idx_content_category` (`content_category`),
  KEY `idx_content_status` (`content_status`),
  KEY `idx_valid_period` (`valid_from`,`valid_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='콘텐츠 마스터';


-- ----------------------------------------------------------------------------
-- tb_content_approval_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_content_approval_log` (
  `log_seq` int(11) NOT NULL AUTO_INCREMENT,
  `plc_seq` int(11) NOT NULL COMMENT '플레이리스트콘텐츠 시퀀스',
  `action` enum('APPROVED','REJECTED','CANCELLED') NOT NULL COMMENT '수행 액션',
  `actor_seq` int(11) DEFAULT NULL COMMENT '수행자 시퀀스 (삭제 시 NULL 보존)',
  `reason` text DEFAULT NULL COMMENT '사유',
  `created_at` datetime DEFAULT current_timestamp() COMMENT '수행 일시',
  PRIMARY KEY (`log_seq`),
  KEY `idx_cal_plc` (`plc_seq`),
  KEY `idx_cal_actor` (`actor_seq`),
  KEY `idx_cal_created` (`created_at`),
  CONSTRAINT `fk_cal_plc` FOREIGN KEY (`plc_seq`) REFERENCES `tb_play_list_content` (`plc_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_cal_user` FOREIGN KEY (`actor_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='콘텐츠 승인 이력';


-- ----------------------------------------------------------------------------
-- tb_control_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_control_log` (
  `log_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 시퀀스',
  `space_device_seq` int(11) NOT NULL COMMENT '공간장비 시퀀스',
  `command_seq` int(11) NOT NULL COMMENT '명령어 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '실행자 시퀀스',
  `trigger_type` enum('MANUAL','NFC','SCHEDULE','VOICE') NOT NULL DEFAULT 'MANUAL' COMMENT '트리거 유형 (MANUAL=콘솔, NFC=태깅, SCHEDULE=예약, VOICE=음성명령)',
  `result_status` enum('SUCCESS','FAIL','TIMEOUT') NOT NULL COMMENT '실행 결과',
  `result_message` text DEFAULT NULL COMMENT '응답 메시지',
  `executed_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '실행 시각',
  PRIMARY KEY (`log_seq`),
  KEY `idx_log_space_device` (`space_device_seq`),
  KEY `idx_log_command` (`command_seq`),
  KEY `idx_log_user` (`tu_seq`),
  KEY `idx_log_status` (`result_status`),
  KEY `idx_log_executed_at` (`executed_at`),
  CONSTRAINT `fk_log_command` FOREIGN KEY (`command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_space_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='제어 로그';


-- ----------------------------------------------------------------------------
-- tb_device_preset
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_device_preset` (
  `preset_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '프리셋 시퀀스',
  `preset_name` varchar(100) NOT NULL COMMENT '프리셋명',
  `protocol_type` enum('TCP','UDP','WOL','HTTP','RS232') NOT NULL COMMENT '통신 프로토콜',
  `comm_ip` varchar(45) DEFAULT NULL COMMENT '기본 통신 IP',
  `comm_port` int(11) DEFAULT NULL COMMENT '기본 통신 포트',
  `preset_description` text DEFAULT NULL COMMENT '프리셋 설명',
  `preset_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `preset_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`preset_seq`),
  KEY `idx_preset_protocol` (`protocol_type`),
  KEY `idx_preset_isdel` (`preset_isdel`),
  KEY `idx_preset_order` (`preset_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장비 프리셋 마스터';


-- ----------------------------------------------------------------------------
-- tb_ftp_config
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_ftp_config` (
  `ftp_config_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT 'FTP 설정 시퀀스',
  `recorder_seq` int(11) DEFAULT NULL COMMENT '녹화기 시퀀스 (NULL=글로벌 기본)',
  `ftp_name` varchar(100) NOT NULL COMMENT '설정명',
  `ftp_host` varchar(255) NOT NULL COMMENT 'FTP 호스트',
  `ftp_port` int(11) NOT NULL DEFAULT 21 COMMENT 'FTP 포트',
  `ftp_username` varchar(100) NOT NULL COMMENT 'FTP 계정',
  `ftp_password` varchar(255) NOT NULL COMMENT 'FTP 비밀번호 (AES 암호화)',
  `ftp_path` varchar(500) DEFAULT '/' COMMENT '업로드 기본 경로',
  `ftp_protocol` enum('FTP','SFTP','FTPS') NOT NULL DEFAULT 'FTP' COMMENT '프로토콜',
  `ftp_passive_mode` char(1) NOT NULL DEFAULT 'Y' COMMENT '패시브 모드 여부',
  `is_default` char(1) NOT NULL DEFAULT 'N' COMMENT '기본 설정 여부',
  `ftp_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`ftp_config_seq`),
  KEY `idx_ftp_recorder` (`recorder_seq`),
  KEY `idx_ftp_default` (`is_default`),
  KEY `idx_ftp_isdel` (`ftp_isdel`),
  CONSTRAINT `fk_ftp_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FTP 설정';


-- ----------------------------------------------------------------------------
-- tb_group_playlist
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_group_playlist` (
  `gp_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '할당 시퀀스',
  `group_seq` int(11) NOT NULL COMMENT '그룹 시퀀스',
  `playlist_seq` int(11) NOT NULL COMMENT '플레이리스트 시퀀스',
  `gp_priority` tinyint(4) DEFAULT 0 COMMENT '우선순위',
  `schedule_start_time` time DEFAULT NULL COMMENT '시작 시간',
  `schedule_end_time` time DEFAULT NULL COMMENT '종료 시간',
  `schedule_days` varchar(14) DEFAULT NULL COMMENT '요일',
  `gp_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '할당 상태',
  `gp_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '할당일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`gp_seq`),
  KEY `idx_gp_group` (`group_seq`),
  KEY `idx_gp_playlist` (`playlist_seq`),
  KEY `idx_gp_priority` (`gp_priority`),
  CONSTRAINT `fk_gp_group` FOREIGN KEY (`group_seq`) REFERENCES `tb_player_group` (`group_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_gp_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='그룹-플레이리스트 할당';


-- ----------------------------------------------------------------------------
-- tb_menu
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_menu` (
  `menu_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '메뉴 시퀀스',
  `menu_name` varchar(50) NOT NULL COMMENT '메뉴명',
  `menu_code` varchar(50) NOT NULL COMMENT '메뉴코드',
  `menu_path` varchar(255) DEFAULT NULL COMMENT '라우트 경로',
  `menu_type` enum('GNB','LNB') NOT NULL COMMENT '메뉴 타입',
  `parent_seq` int(11) DEFAULT NULL COMMENT '상위메뉴 시퀀스',
  `menu_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `menu_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  PRIMARY KEY (`menu_seq`),
  UNIQUE KEY `uk_menu_code` (`menu_code`),
  KEY `idx_menu_type` (`menu_type`),
  KEY `idx_menu_parent` (`parent_seq`),
  KEY `idx_menu_order` (`menu_order`),
  CONSTRAINT `fk_menu_parent` FOREIGN KEY (`parent_seq`) REFERENCES `tb_menu` (`menu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메뉴 마스터';


-- ----------------------------------------------------------------------------
-- tb_menu_users
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_menu_users` (
  `mu_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq` int(11) NOT NULL COMMENT '사용자 시퀀스',
  `menu_seq` int(11) NOT NULL COMMENT '메뉴 시퀀스',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '권한 부여일',
  PRIMARY KEY (`mu_seq`),
  UNIQUE KEY `uk_mu_user_menu` (`tu_seq`,`menu_seq`),
  KEY `idx_mu_user` (`tu_seq`),
  KEY `idx_mu_menu` (`menu_seq`),
  CONSTRAINT `fk_mu_menu` FOREIGN KEY (`menu_seq`) REFERENCES `tb_menu` (`menu_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_mu_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자별 메뉴 권한';


-- ----------------------------------------------------------------------------
-- tb_nfc_card
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_nfc_card` (
  `card_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '카드 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '사용자 시퀀스',
  `card_identifier` varchar(255) NOT NULL COMMENT '카드 식별값 (raw)',
  `card_aid` varchar(32) DEFAULT NULL COMMENT 'Application Identifier (HEX)',
  `card_label` varchar(100) DEFAULT NULL COMMENT '카드 별칭 (예: 김교수 스마트폰)',
  `card_type` enum('CARD','PHONE') DEFAULT 'CARD' COMMENT '태그 유형',
  `card_status` enum('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE' COMMENT '카드 상태',
  `card_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`card_seq`),
  UNIQUE KEY `uk_card_identifier` (`card_identifier`),
  KEY `idx_card_user` (`tu_seq`),
  KEY `idx_card_aid` (`card_aid`),
  KEY `idx_card_type` (`card_type`),
  KEY `idx_card_status` (`card_status`),
  KEY `idx_card_isdel` (`card_isdel`),
  CONSTRAINT `fk_nfc_card_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 카드/태그 마스터';


-- ----------------------------------------------------------------------------
-- tb_nfc_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_nfc_log` (
  `nfc_log_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT 'NFC 로그 시퀀스',
  `reader_seq` int(11) NOT NULL COMMENT '리더기 시퀀스',
  `card_seq` int(11) DEFAULT NULL COMMENT '카드 시퀀스 (미등록 카드 시 null)',
  `tu_seq` int(11) DEFAULT NULL COMMENT '사용자 시퀀스 (미등록 시 null)',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스 (비정규화, 조회 편의)',
  `log_type` enum('ENTER','EXIT','DENIED','UNKNOWN','REGISTER_SAVE','REGISTER_NO','REGISTER_TIMEOUT') NOT NULL COMMENT '태깅 유형',
  `tag_identifier` varchar(255) NOT NULL COMMENT '태깅 시 읽힌 식별값 (raw)',
  `tag_aid` varchar(32) DEFAULT NULL COMMENT '태깅 시 읽힌 AID (raw)',
  `control_result` enum('SUCCESS','FAIL','PARTIAL','SKIPPED') DEFAULT NULL COMMENT '장비 제어 결과 요약',
  `control_detail` text DEFAULT NULL COMMENT '제어 상세 JSON (장비별 실행 결과)',
  `tagged_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '태깅 시각',
  PRIMARY KEY (`nfc_log_seq`),
  KEY `fk_nfc_log_user` (`tu_seq`),
  KEY `idx_nfc_log_reader` (`reader_seq`),
  KEY `idx_nfc_log_card` (`card_seq`),
  KEY `idx_nfc_log_space` (`space_seq`),
  KEY `idx_nfc_log_type` (`log_type`),
  KEY `idx_nfc_log_tagged` (`tagged_at`),
  CONSTRAINT `fk_nfc_log_card` FOREIGN KEY (`card_seq`) REFERENCES `tb_nfc_card` (`card_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_nfc_log_reader` FOREIGN KEY (`reader_seq`) REFERENCES `tb_nfc_reader` (`reader_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_nfc_log_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_nfc_log_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 태깅 로그';


-- ----------------------------------------------------------------------------
-- tb_nfc_reader
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_nfc_reader` (
  `reader_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '리더기 시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '설치 공간 시퀀스',
  `reader_name` varchar(100) NOT NULL COMMENT '리더기명 (예: 101호 입구 리더기)',
  `reader_code` varchar(50) NOT NULL COMMENT '리더기 코드 (RDR-001)',
  `reader_serial` varchar(100) DEFAULT NULL COMMENT '리더기 시리얼번호 (하드웨어 고유값)',
  `reader_api_key` varchar(100) NOT NULL COMMENT 'Agent 인증용 API Key',
  `reader_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '리더기 상태',
  `reader_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reader_tag_status` enum('ENTER','EXIT') DEFAULT NULL COMMENT '태깅상태 (입실/퇴실)',
  `reader_tag_card_seq` int(11) DEFAULT NULL COMMENT '현재 태깅한 카드 seq',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`reader_seq`),
  UNIQUE KEY `uk_reader_code` (`reader_code`),
  UNIQUE KEY `uk_reader_api_key` (`reader_api_key`),
  KEY `idx_reader_space` (`space_seq`),
  KEY `idx_reader_status` (`reader_status`),
  KEY `idx_reader_isdel` (`reader_isdel`),
  CONSTRAINT `fk_reader_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 리더기 마스터';


-- ----------------------------------------------------------------------------
-- tb_nfc_reader_command
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_nfc_reader_command` (
  `reader_command_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '리더기 명령어 매핑 시퀀스',
  `reader_seq` int(11) NOT NULL COMMENT '리더기 시퀀스',
  `space_device_seq` int(11) NOT NULL COMMENT '공간장비 시퀀스',
  `enter_command_seq` int(11) DEFAULT NULL COMMENT '입실 시 실행 명령어 시퀀스',
  `exit_command_seq` int(11) DEFAULT NULL COMMENT '퇴실 시 실행 명령어 시퀀스',
  `command_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`reader_command_seq`),
  UNIQUE KEY `uk_reader_device` (`reader_seq`,`space_device_seq`),
  KEY `fk_rc_enter_command` (`enter_command_seq`),
  KEY `fk_rc_exit_command` (`exit_command_seq`),
  KEY `idx_rc_reader` (`reader_seq`,`command_isdel`),
  KEY `idx_rc_device` (`space_device_seq`),
  CONSTRAINT `fk_rc_enter_command` FOREIGN KEY (`enter_command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_rc_exit_command` FOREIGN KEY (`exit_command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_rc_reader` FOREIGN KEY (`reader_seq`) REFERENCES `tb_nfc_reader` (`reader_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rc_space_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 리더기 명령어 매핑';


-- ----------------------------------------------------------------------------
-- tb_play_list
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_play_list` (
  `playlist_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '플레이리스트 시퀀스',
  `playlist_name` varchar(100) NOT NULL COMMENT '플레이리스트명',
  `playlist_code` varchar(50) NOT NULL COMMENT '플레이리스트 코드',
  `playlist_type` enum('NORMAL','EMERGENCY','ANNOUNCEMENT') DEFAULT 'NORMAL' COMMENT '플레이리스트 유형',
  `playlist_priority` tinyint(4) DEFAULT 0 COMMENT '우선순위 (높을수록 우선, 긴급 공지=99)',
  `playlist_duration` int(11) DEFAULT NULL COMMENT '총 재생 시간 (초, 계산값)',
  `playlist_loop` char(1) DEFAULT 'Y' COMMENT '반복 재생 여부 (Y/N)',
  `playlist_random` char(1) DEFAULT 'N' COMMENT '랜덤 재생 여부 (Y/N)',
  `playlist_screen_layout` enum('1x1','1x2','1x3','1x4','2x2','2x4','1x8') DEFAULT '1x1' COMMENT '화면 분할 레이아웃 (1x1=단일, 1x8=1행8열)',
  `playlist_description` text DEFAULT NULL COMMENT '플레이리스트 설명',
  `playlist_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `playlist_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '사용 상태 (ACTIVE=사용, INACTIVE=임시중지)',
  `playlist_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`playlist_seq`),
  UNIQUE KEY `uk_playlist_code` (`playlist_code`),
  KEY `idx_playlist_type` (`playlist_type`),
  KEY `idx_playlist_isdel` (`playlist_isdel`),
  KEY `idx_playlist_order` (`playlist_order`),
  KEY `idx_playlist_status` (`playlist_status`),
  KEY `idx_playlist_priority` (`playlist_priority`),
  KEY `idx_playlist_screen_layout` (`playlist_screen_layout`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이리스트 마스터';


-- ----------------------------------------------------------------------------
-- tb_play_list_content
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_play_list_content` (
  `plc_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '매핑 시퀀스',
  `playlist_seq` int(11) NOT NULL COMMENT '플레이리스트 시퀀스',
  `content_seq` int(11) NOT NULL COMMENT '콘텐츠 시퀀스',
  `zone_number` tinyint(4) DEFAULT 1 COMMENT '영역 번호 (1~8, 1x1일 때는 1만 사용)',
  `zone_width` decimal(5,2) DEFAULT 100.00 COMMENT '영역 너비 (%, 1x8일 때 12.5)',
  `zone_height` decimal(5,2) DEFAULT 100.00 COMMENT '영역 높이 (%)',
  `zone_x_position` decimal(5,2) DEFAULT 0.00 COMMENT 'X 좌표 (%, 좌측 기준)',
  `zone_y_position` decimal(5,2) DEFAULT 0.00 COMMENT 'Y 좌표 (%, 상단 기준)',
  `play_order` int(11) DEFAULT 0 COMMENT '재생 순서',
  `play_duration` int(11) DEFAULT NULL COMMENT '재생 시간 오버라이드 (NULL이면 원본 사용)',
  `transition_effect` varchar(50) DEFAULT NULL COMMENT '전환 효과 (fade, slide 등)',
  `transition_duration` int(11) DEFAULT 0 COMMENT '전환 시간 (밀리초)',
  `plc_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `requester_seq` int(11) DEFAULT NULL COMMENT '콘텐츠 등록 요청자 시퀀스',
  `approval_status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' COMMENT '승인 상태',
  `reviewer_seq` int(11) DEFAULT NULL COMMENT '승인/반려자 시퀀스',
  `reviewed_date` datetime DEFAULT NULL COMMENT '승인/반려 일시',
  `reject_reason` text DEFAULT NULL COMMENT '반려 사유',
  PRIMARY KEY (`plc_seq`),
  UNIQUE KEY `uk_playlist_content_zone` (`playlist_seq`,`content_seq`,`zone_number`),
  KEY `idx_plc_playlist` (`playlist_seq`,`play_order`),
  KEY `idx_plc_content` (`content_seq`),
  KEY `idx_plc_zone` (`playlist_seq`,`zone_number`),
  KEY `idx_plc_approval_status` (`approval_status`),
  KEY `idx_plc_reviewer` (`reviewer_seq`),
  KEY `idx_plc_requester` (`requester_seq`),
  CONSTRAINT `fk_plc_content` FOREIGN KEY (`content_seq`) REFERENCES `tb_content` (`content_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_plc_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_plc_requester` FOREIGN KEY (`requester_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_plc_reviewer` FOREIGN KEY (`reviewer_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이리스트-콘텐츠 매핑';


-- ----------------------------------------------------------------------------
-- tb_play_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_play_log` (
  `log_seq` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '로그 시퀀스',
  `player_seq` int(11) NOT NULL COMMENT '플레이어 시퀀스',
  `playlist_seq` int(11) DEFAULT NULL COMMENT '플레이리스트 시퀀스',
  `content_seq` int(11) NOT NULL COMMENT '콘텐츠 시퀀스',
  `zone_number` tinyint(4) DEFAULT 1 COMMENT '재생 영역 번호',
  `play_started_at` datetime NOT NULL COMMENT '재생 시작 시각',
  `play_ended_at` datetime DEFAULT NULL COMMENT '재생 종료 시각',
  `play_duration` int(11) DEFAULT NULL COMMENT '실제 재생 시간 (초)',
  `play_status` enum('COMPLETED','SKIPPED','ERROR') DEFAULT 'COMPLETED' COMMENT '재생 상태 (COMPLETED=정상완료, SKIPPED=건너뜀, ERROR=오류)',
  `error_message` text DEFAULT NULL COMMENT '오류 메시지 (ERROR 시)',
  PRIMARY KEY (`log_seq`),
  KEY `idx_log_player` (`player_seq`),
  KEY `idx_log_playlist` (`playlist_seq`),
  KEY `idx_log_content` (`content_seq`),
  KEY `idx_log_datetime` (`play_started_at`),
  KEY `idx_log_status` (`play_status`),
  CONSTRAINT `fk_log_content` FOREIGN KEY (`content_seq`) REFERENCES `tb_content` (`content_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='재생 로그 (통계/분석용)';


-- ----------------------------------------------------------------------------
-- tb_player
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_player` (
  `player_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '플레이어 시퀀스',
  `player_name` varchar(100) NOT NULL COMMENT '플레이어명 (예: 본관 1층 로비 디스플레이)',
  `player_code` varchar(50) NOT NULL COMMENT '플레이어 코드 (예: PLAYER-001)',
  `player_did` varchar(100) DEFAULT NULL COMMENT 'Device ID (하드웨어 고유 식별자)',
  `player_mac` varchar(17) DEFAULT NULL COMMENT 'MAC 주소 (AA:BB:CC:DD:EE:FF)',
  `building_seq` int(11) NOT NULL COMMENT '건물 시퀀스',
  `space_seq` int(11) DEFAULT NULL COMMENT '공간 시퀀스 (선택적, 상세 위치 지정)',
  `playlist_seq` int(11) DEFAULT NULL COMMENT '현재 활성 플레이리스트 시퀀스',
  `player_ip` varchar(45) NOT NULL COMMENT '플레이어 IP (IPv4/IPv6)',
  `player_port` int(11) DEFAULT 9090 COMMENT '플레이어 통신 포트',
  `player_api_key` varchar(100) NOT NULL COMMENT 'API Key (플레이어 인증용)',
  `player_secret` varchar(255) DEFAULT NULL COMMENT '암호화된 시크릿 (필요 시)',
  `player_approval` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' COMMENT '승인 상태',
  `approved_by` int(11) DEFAULT NULL COMMENT '승인자 시퀀스',
  `approved_at` datetime DEFAULT NULL COMMENT '승인 일시',
  `reject_reason` text DEFAULT NULL COMMENT '반려 사유',
  `player_status` enum('ONLINE','OFFLINE','ERROR','MAINTENANCE') DEFAULT 'OFFLINE' COMMENT '플레이어 현재 상태',
  `last_heartbeat_at` datetime DEFAULT NULL COMMENT '마지막 Health Check 시각',
  `last_content_played` varchar(255) DEFAULT NULL COMMENT '마지막 재생 콘텐츠 (비정규화)',
  `player_version` varchar(20) DEFAULT NULL COMMENT '플레이어 SW 버전',
  `player_resolution` varchar(20) DEFAULT NULL COMMENT '화면 해상도 (예: 1920x1080)',
  `player_orientation` enum('LANDSCAPE','PORTRAIT') DEFAULT 'LANDSCAPE' COMMENT '화면 방향',
  `default_volume` tinyint(4) DEFAULT 50 COMMENT '기본 볼륨 (0-100)',
  `player_description` text DEFAULT NULL COMMENT '플레이어 설명/메모',
  `player_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `player_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`player_seq`),
  UNIQUE KEY `uk_player_code` (`player_code`),
  UNIQUE KEY `uk_player_api_key` (`player_api_key`),
  UNIQUE KEY `uk_player_did` (`player_did`),
  KEY `idx_player_building` (`building_seq`),
  KEY `idx_player_space` (`space_seq`),
  KEY `idx_player_playlist` (`playlist_seq`),
  KEY `idx_player_status` (`player_status`),
  KEY `idx_player_approval` (`player_approval`),
  KEY `idx_player_isdel` (`player_isdel`),
  KEY `idx_player_order` (`player_order`),
  KEY `idx_player_last_heartbeat` (`last_heartbeat_at`),
  KEY `idx_player_building_status` (`building_seq`,`player_status`,`player_isdel`),
  KEY `fk_player_approver` (`approved_by`),
  CONSTRAINT `fk_player_approver` FOREIGN KEY (`approved_by`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_player_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_player_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_player_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Digital Signage Player (DID) 마스터';


-- ----------------------------------------------------------------------------
-- tb_player_group
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_player_group` (
  `group_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '그룹 시퀀스',
  `group_name` varchar(100) NOT NULL COMMENT '그룹명',
  `group_code` varchar(50) NOT NULL COMMENT '그룹 코드',
  `building_seq` int(11) DEFAULT NULL COMMENT '건물 시퀀스 (건물별 그룹화)',
  `group_description` text DEFAULT NULL COMMENT '그룹 설명',
  `group_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `group_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`group_seq`),
  UNIQUE KEY `uk_group_code` (`group_code`),
  KEY `idx_group_building` (`building_seq`),
  KEY `idx_group_isdel` (`group_isdel`),
  CONSTRAINT `fk_group_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어 그룹';


-- ----------------------------------------------------------------------------
-- tb_player_group_member
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_player_group_member` (
  `pgm_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '멤버 시퀀스',
  `group_seq` int(11) NOT NULL COMMENT '그룹 시퀀스',
  `player_seq` int(11) NOT NULL COMMENT '플레이어 시퀀스',
  `pgm_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  PRIMARY KEY (`pgm_seq`),
  UNIQUE KEY `uk_group_player` (`group_seq`,`player_seq`),
  KEY `idx_pgm_group` (`group_seq`),
  KEY `idx_pgm_player` (`player_seq`),
  CONSTRAINT `fk_pgm_group` FOREIGN KEY (`group_seq`) REFERENCES `tb_player_group` (`group_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_pgm_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어 그룹 멤버십';


-- ----------------------------------------------------------------------------
-- tb_player_heartbeat_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_player_heartbeat_log` (
  `heartbeat_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Heartbeat 시퀀스',
  `player_seq` int(11) NOT NULL COMMENT '플레이어 시퀀스',
  `heartbeat_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Health Check 시각',
  `player_ip` varchar(45) DEFAULT NULL COMMENT '요청 IP (검증용)',
  `player_version` varchar(20) DEFAULT NULL COMMENT '보고된 버전',
  `cpu_usage` decimal(5,2) DEFAULT NULL COMMENT 'CPU 사용률 (%)',
  `memory_usage` decimal(5,2) DEFAULT NULL COMMENT '메모리 사용률 (%)',
  `disk_usage` decimal(5,2) DEFAULT NULL COMMENT '디스크 사용률 (%)',
  `current_playlist` int(11) DEFAULT NULL COMMENT '현재 재생 중인 플레이리스트',
  `current_content` varchar(255) DEFAULT NULL COMMENT '현재 재생 중인 콘텐츠',
  `error_message` text DEFAULT NULL COMMENT '에러 메시지 (있을 경우)',
  `display_status` varchar(10) DEFAULT NULL COMMENT '화면\n  상태 (ON/OFF/STANDBY)',
  `resolution` varchar(20) DEFAULT NULL COMMENT '현재\n  해상도',
  `orientation` varchar(10) DEFAULT NULL COMMENT '화면 방향',
  `volume` tinyint(4) DEFAULT NULL COMMENT '볼륨 레벨 (0-100)',
  `network_type` varchar(10) DEFAULT NULL COMMENT '네트워크\n  종류 (ETHERNET/WIFI)',
  `network_speed` int(11) DEFAULT NULL COMMENT '네트워크 속도\n  (Mbps)',
  `uptime` bigint(20) DEFAULT NULL COMMENT '가동 시간 (초)',
  `storage_free` bigint(20) DEFAULT NULL COMMENT '남은 저장공간\n  (MB)',
  `os_version` varchar(50) DEFAULT NULL COMMENT 'OS 버전',
  `last_download_at` datetime DEFAULT NULL COMMENT '마지막\n  콘텐츠 다운로드 시각',
  PRIMARY KEY (`heartbeat_seq`),
  KEY `idx_heartbeat_player` (`player_seq`),
  KEY `idx_heartbeat_at` (`heartbeat_at`),
  CONSTRAINT `fk_heartbeat_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어 Health Check 로그';


-- ----------------------------------------------------------------------------
-- tb_player_playlist
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_player_playlist` (
  `pp_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '할당 시퀀스',
  `player_seq` int(11) NOT NULL COMMENT '플레이어 시퀀스',
  `playlist_seq` int(11) NOT NULL COMMENT '플레이리스트 시퀀스',
  `pp_priority` tinyint(4) DEFAULT 0 COMMENT '우선순위 (높을수록 우선)',
  `schedule_start_time` time DEFAULT NULL COMMENT '시작 시간 (예: 09:00:00)',
  `schedule_end_time` time DEFAULT NULL COMMENT '종료 시간 (예: 18:00:00)',
  `schedule_days` varchar(14) DEFAULT NULL COMMENT '요일 (예: 1,2,3,4,5 = 월~금, 1=월요일)',
  `pp_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '할당 상태',
  `pp_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부 (Y/N)',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '할당일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`pp_seq`),
  KEY `idx_pp_player` (`player_seq`),
  KEY `idx_pp_playlist` (`playlist_seq`),
  KEY `idx_pp_priority` (`pp_priority`),
  KEY `idx_pp_status` (`pp_status`),
  KEY `idx_pp_schedule` (`schedule_start_time`,`schedule_end_time`),
  CONSTRAINT `fk_pp_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어-플레이리스트 할당';


-- ----------------------------------------------------------------------------
-- tb_preset_command
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_preset_command` (
  `command_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '명령어 시퀀스',
  `preset_seq` int(11) NOT NULL COMMENT '프리셋 시퀀스',
  `command_name` varchar(100) NOT NULL COMMENT '명령어명',
  `command_code` varchar(500) NOT NULL COMMENT '명령어 코드',
  `command_type` varchar(20) DEFAULT 'CUSTOM' COMMENT '명령어 유형',
  `command_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `command_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`command_seq`),
  KEY `idx_command_preset` (`preset_seq`),
  KEY `idx_command_type` (`command_type`),
  KEY `idx_command_isdel` (`command_isdel`),
  KEY `idx_command_order` (`command_order`),
  CONSTRAINT `fk_command_preset` FOREIGN KEY (`preset_seq`) REFERENCES `tb_device_preset` (`preset_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프리셋 명령어';


-- ----------------------------------------------------------------------------
-- tb_recorder
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recorder` (
  `recorder_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '녹화기 시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스',
  `recorder_name` varchar(100) NOT NULL COMMENT '녹화기명',
  `recorder_ip` varchar(45) NOT NULL COMMENT '고정 IP',
  `recorder_port` int(11) DEFAULT 80 COMMENT '통신 포트',
  `recorder_protocol` enum('HTTP','ONVIF','RTSP') NOT NULL DEFAULT 'HTTP' COMMENT '통신 프로토콜',
  `recorder_username` varchar(100) DEFAULT NULL COMMENT '녹화기 로그인 ID',
  `recorder_password` varchar(255) DEFAULT NULL COMMENT '녹화기 로그인 PW (AES 암호화)',
  `recorder_model` varchar(100) DEFAULT NULL COMMENT '녹화기 모델명/제조사',
  `recorder_status` enum('ONLINE','OFFLINE','ERROR') NOT NULL DEFAULT 'OFFLINE' COMMENT '녹화기 상태',
  `current_user_seq` int(11) DEFAULT NULL COMMENT '현재 사용 중인 사용자',
  `last_health_check` datetime DEFAULT NULL COMMENT '마지막 상태 확인 시각',
  `recorder_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `recorder_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`recorder_seq`),
  UNIQUE KEY `uk_recorder_space` (`space_seq`),
  KEY `fk_recorder_current_user` (`current_user_seq`),
  KEY `idx_recorder_ip` (`recorder_ip`),
  KEY `idx_recorder_status` (`recorder_status`),
  KEY `idx_recorder_isdel` (`recorder_isdel`),
  KEY `idx_recorder_order` (`recorder_order`),
  CONSTRAINT `fk_recorder_current_user` FOREIGN KEY (`current_user_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_recorder_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기 마스터';


-- ----------------------------------------------------------------------------
-- tb_recorder_log
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recorder_log` (
  `rec_log_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 시퀀스',
  `recorder_seq` int(11) NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '실행자 시퀀스',
  `log_type` enum('PTZ','REC_START','REC_STOP','PRESET_APPLY','STATUS_CHECK','POWER') NOT NULL COMMENT '명령 유형',
  `command_detail` text DEFAULT NULL COMMENT '전송 명령 상세 (JSON)',
  `result_status` enum('SUCCESS','FAIL','TIMEOUT') NOT NULL COMMENT '실행 결과',
  `result_message` text DEFAULT NULL COMMENT '응답 메시지',
  `executed_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '실행 시각',
  PRIMARY KEY (`rec_log_seq`),
  KEY `idx_rl_recorder` (`recorder_seq`),
  KEY `idx_rl_user` (`tu_seq`),
  KEY `idx_rl_type` (`log_type`),
  KEY `idx_rl_status` (`result_status`),
  KEY `idx_rl_executed` (`executed_at`),
  CONSTRAINT `fk_rl_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rl_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기 명령 로그';


-- ----------------------------------------------------------------------------
-- tb_recorder_preset
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recorder_preset` (
  `rec_preset_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '프리셋 시퀀스',
  `recorder_seq` int(11) NOT NULL COMMENT '녹화기 시퀀스',
  `preset_name` varchar(100) NOT NULL COMMENT '프리셋명',
  `preset_number` int(11) NOT NULL COMMENT '녹화기 내부 프리셋 번호',
  `pan_value` float DEFAULT NULL COMMENT 'Pan 값',
  `tilt_value` float DEFAULT NULL COMMENT 'Tilt 값',
  `zoom_value` float DEFAULT NULL COMMENT 'Zoom 값',
  `preset_description` text DEFAULT NULL COMMENT '프리셋 설명',
  `preset_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `preset_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`rec_preset_seq`),
  UNIQUE KEY `uk_recorder_preset_number` (`recorder_seq`,`preset_number`),
  KEY `idx_rp_recorder` (`recorder_seq`),
  KEY `idx_rp_isdel` (`preset_isdel`),
  KEY `idx_rp_order` (`preset_order`),
  CONSTRAINT `fk_rp_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기 PTZ 프리셋';


-- ----------------------------------------------------------------------------
-- tb_recorder_user
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recorder_user` (
  `recorder_user_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq` int(11) NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq` int(11) NOT NULL COMMENT '사용자(교수) 시퀀스',
  `is_default` char(1) NOT NULL DEFAULT 'N' COMMENT '기본 사용자 여부',
  `recorder_user_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`recorder_user_seq`),
  UNIQUE KEY `uk_recorder_user` (`recorder_seq`,`tu_seq`),
  KEY `idx_ru_recorder` (`recorder_seq`),
  KEY `idx_ru_user` (`tu_seq`),
  KEY `idx_ru_isdel` (`recorder_user_isdel`),
  CONSTRAINT `fk_ru_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_ru_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기-사용자 매핑';


-- ----------------------------------------------------------------------------
-- tb_recording_file
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recording_file` (
  `rec_file_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '파일 시퀀스',
  `rec_session_seq` int(11) NOT NULL COMMENT '세션 시퀀스',
  `file_name` varchar(255) NOT NULL COMMENT '원본 파일명',
  `file_path` varchar(500) DEFAULT NULL COMMENT '녹화기 내 파일 경로',
  `file_size` bigint(20) DEFAULT NULL COMMENT '파일 크기 (bytes)',
  `file_format` varchar(20) DEFAULT NULL COMMENT '파일 포맷 (mp4, avi)',
  `file_duration_sec` int(11) DEFAULT NULL COMMENT '영상 길이 (초)',
  `ftp_status` enum('PENDING','UPLOADING','COMPLETED','FAILED','RETRY') NOT NULL DEFAULT 'PENDING' COMMENT 'FTP 업로드 상태',
  `ftp_config_seq` int(11) DEFAULT NULL COMMENT 'FTP 설정 시퀀스',
  `ftp_uploaded_path` varchar(500) DEFAULT NULL COMMENT 'FTP 업로드 경로',
  `ftp_uploaded_at` datetime DEFAULT NULL COMMENT '업로드 완료 시각',
  `ftp_retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '재시도 횟수',
  `ftp_error_message` text DEFAULT NULL COMMENT '업로드 실패 에러',
  `file_isdel` char(1) NOT NULL DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`rec_file_seq`),
  KEY `idx_rf_session` (`rec_session_seq`),
  KEY `idx_rf_ftp_status` (`ftp_status`),
  KEY `idx_rf_ftp_config` (`ftp_config_seq`),
  KEY `idx_rf_isdel` (`file_isdel`),
  CONSTRAINT `fk_rf_ftp` FOREIGN KEY (`ftp_config_seq`) REFERENCES `tb_ftp_config` (`ftp_config_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_rf_session` FOREIGN KEY (`rec_session_seq`) REFERENCES `tb_recording_session` (`rec_session_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화 파일';


-- ----------------------------------------------------------------------------
-- tb_recording_session
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_recording_session` (
  `rec_session_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '세션 시퀀스',
  `recorder_seq` int(11) NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq` int(11) DEFAULT NULL COMMENT '녹화 시작 사용자',
  `session_status` enum('RECORDING','COMPLETED','FAILED','CANCELLED') NOT NULL COMMENT '세션 상태',
  `rec_preset_seq` int(11) DEFAULT NULL COMMENT '사용된 프리셋',
  `session_title` varchar(200) DEFAULT NULL COMMENT '강의명 / 메모',
  `started_at` datetime NOT NULL COMMENT '녹화 시작 시각',
  `ended_at` datetime DEFAULT NULL COMMENT '녹화 종료 시각',
  `duration_sec` int(11) DEFAULT NULL COMMENT '녹화 시간 (초)',
  `reg_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`rec_session_seq`),
  KEY `fk_rs_preset` (`rec_preset_seq`),
  KEY `idx_rs_recorder` (`recorder_seq`),
  KEY `idx_rs_user` (`tu_seq`),
  KEY `idx_rs_status` (`session_status`),
  KEY `idx_rs_started` (`started_at`),
  CONSTRAINT `fk_rs_preset` FOREIGN KEY (`rec_preset_seq`) REFERENCES `tb_recorder_preset` (`rec_preset_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_rs_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rs_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화 세션';


-- ----------------------------------------------------------------------------
-- tb_setting
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_setting` (
  `ts_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `ts_api_time` varchar(10) DEFAULT NULL COMMENT 'api 실행 시간',
  `ts_player_time` varchar(10) DEFAULT '1' COMMENT '플레이어 실행 주기',
  `ts_screen_start` varchar(10) DEFAULT NULL COMMENT '스크린 세이버 시작',
  `ts_screen_end` varchar(10) DEFAULT NULL COMMENT '스크린 세이버 종료',
  `ts_player_ver` varchar(10) DEFAULT '1.0.0' COMMENT '플레이어 버전',
  `ts_player_link` varchar(255) DEFAULT NULL COMMENT '플레이어 다운로드 링크',
  `ts_watcher_ver` varchar(10) DEFAULT '1.0.0' COMMENT '와처 버전',
  `ts_watcher_link` varchar(255) DEFAULT NULL COMMENT '와처 다운로드 링크',
  `ts_notice_link` varchar(255) DEFAULT NULL COMMENT '공지사항링크',
  `ts_intro_link` varchar(255) DEFAULT NULL COMMENT '인트로링크',
  `ts_default_image` varchar(255) DEFAULT NULL,
  `reg_date` datetime NOT NULL COMMENT '등록일',
  PRIMARY KEY (`ts_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경설정';


-- ----------------------------------------------------------------------------
-- tb_socket_command
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_socket_command` (
  `socket_cmd_seq` int(11) NOT NULL AUTO_INCREMENT,
  `cmd_label` varchar(100) NOT NULL COMMENT '명령어 이름',
  `cmd_hex` varchar(500) NOT NULL COMMENT 'HEX 명령어 코드',
  `cmd_category` varchar(50) NOT NULL COMMENT '카테고리',
  `cmd_description` varchar(500) DEFAULT NULL COMMENT '설명',
  `cmd_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `cmd_isdel` char(1) DEFAULT 'N',
  `reg_date` datetime DEFAULT current_timestamp(),
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`socket_cmd_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- tb_space
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_space` (
  `space_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '공간 시퀀스',
  `building_seq` int(11) NOT NULL COMMENT '건물 시퀀스',
  `space_name` varchar(100) NOT NULL COMMENT '공간명',
  `space_code` varchar(50) NOT NULL COMMENT '공간 코드',
  `space_floor` varchar(10) DEFAULT NULL COMMENT '층',
  `space_type` varchar(20) DEFAULT NULL COMMENT '공간 유형',
  `space_capacity` int(11) DEFAULT 0 COMMENT '수용 인원',
  `space_description` text DEFAULT NULL COMMENT '공간 설명',
  `space_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `space_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`space_seq`),
  UNIQUE KEY `uk_space_code` (`space_code`),
  KEY `idx_space_building` (`building_seq`),
  KEY `idx_space_code` (`space_code`),
  KEY `idx_space_floor` (`space_floor`),
  KEY `idx_space_isdel` (`space_isdel`),
  KEY `idx_space_order` (`space_order`),
  CONSTRAINT `fk_space_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공간 마스터';


-- ----------------------------------------------------------------------------
-- tb_space_device
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_space_device` (
  `space_device_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '공간장비 시퀀스',
  `space_seq` int(11) NOT NULL COMMENT '공간 시퀀스',
  `preset_seq` int(11) NOT NULL COMMENT '프리셋 시퀀스',
  `device_name` varchar(100) NOT NULL COMMENT '장비명',
  `device_ip` varchar(45) DEFAULT NULL COMMENT '장비 IP',
  `device_port` int(11) DEFAULT NULL COMMENT '장비 포트',
  `device_status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE' COMMENT '장비 상태',
  `device_order` int(11) DEFAULT 0 COMMENT '정렬 순서',
  `device_isdel` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '등록일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`space_device_seq`),
  KEY `idx_space_device_space` (`space_seq`),
  KEY `idx_space_device_preset` (`preset_seq`),
  KEY `idx_space_device_status` (`device_status`),
  KEY `idx_space_device_isdel` (`device_isdel`),
  CONSTRAINT `fk_space_device_preset` FOREIGN KEY (`preset_seq`) REFERENCES `tb_device_preset` (`preset_seq`),
  CONSTRAINT `fk_space_device_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공간-장비 매핑';


-- ----------------------------------------------------------------------------
-- tb_user_building
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_user_building` (
  `tub_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq` int(11) NOT NULL COMMENT '사용자 시퀀스',
  `building_seq` int(11) NOT NULL COMMENT '건물 시퀀스',
  `reg_date` datetime DEFAULT current_timestamp() COMMENT '할당일시',
  `upd_date` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정일시',
  PRIMARY KEY (`tub_seq`),
  UNIQUE KEY `uq_user_building` (`tu_seq`,`building_seq`),
  KEY `idx_user_building_building` (`building_seq`),
  CONSTRAINT `fk_user_building_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_building_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자-건물 권한 매핑';


-- ----------------------------------------------------------------------------
-- tb_users
-- ----------------------------------------------------------------------------
CREATE TABLE `tb_users` (
  `tu_seq` int(11) NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_id` varchar(20) DEFAULT NULL COMMENT '아이디',
  `tu_pw` varchar(255) DEFAULT NULL COMMENT '패스워드',
  `tu_name` varchar(50) DEFAULT NULL COMMENT '이름',
  `tu_phone` varchar(15) DEFAULT NULL COMMENT '휴대폰',
  `tu_email` varchar(50) DEFAULT NULL COMMENT '이메일',
  `tu_isdel` char(1) DEFAULT NULL COMMENT '삭제여부',
  `tu_step` char(2) DEFAULT NULL COMMENT '상태',
  `tu_type` char(6) DEFAULT NULL COMMENT '타입',
  `tu_content_yn` enum('Y','N') DEFAULT 'Y' COMMENT '콘텐츠 사용여부',
  `tu_work_type` varchar(10) DEFAULT NULL COMMENT '계약타입',
  `tu_last_access_date` datetime DEFAULT NULL COMMENT '마지막 접속',
  `tu_log` text DEFAULT NULL COMMENT '로그',
  `tu_new_noti` char(1) DEFAULT NULL COMMENT '알림정보',
  `tu_access_token` varchar(300) DEFAULT NULL COMMENT '접근토큰',
  `tu_refresh_token` varchar(500) DEFAULT NULL COMMENT '리프레시토큰',
  `tu_push_token` varchar(100) DEFAULT NULL COMMENT 'PUSH 토큰',
  `tu_device_name` varchar(50) DEFAULT NULL COMMENT '디바이스명',
  `tu_app_ver` varchar(10) DEFAULT NULL COMMENT '앱버전',
  `si_seq` int(11) DEFAULT NULL COMMENT '사이트정보',
  `tu_approved_date` datetime DEFAULT NULL COMMENT '승인일시',
  `reg_date` datetime DEFAULT NULL COMMENT '등록일',
  `tu_token_ver` int(11) NOT NULL DEFAULT 1 COMMENT '토큰 버전',
  PRIMARY KEY (`tu_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 테이블';



-- ============================================================================
-- SEED DATA (운영 필수)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. tb_setting — 기본 설정
-- ----------------------------------------------------------------------------
INSERT INTO `tb_setting` (`ts_seq`, `ts_api_time`, `ts_player_time`, `ts_player_ver`, `ts_watcher_ver`, `ts_screen_start`, `ts_screen_end`, `reg_date`)
VALUES (1, '30', '1', '1.0.0', '1.0.0', '23:00', '07:00', NOW());

-- ----------------------------------------------------------------------------
-- 2. tb_users — admin 계정 (password: !konkuk@)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_users` (`tu_seq`, `tu_id`, `tu_pw`, `tu_name`, `tu_phone`, `tu_email`, `tu_isdel`, `tu_step`, `tu_type`, `tu_approved_date`, `reg_date`)
VALUES (1, 'admin', '$2b$10$x55JtEt43CKG5t9rDt8zj.FXpwDrBrm1GFgnWPy7PXEonKM3xXjwi', '관리자', '010-0000-0000', 'kuwave@konkuk.ac.kr', 'N', 'OK', 'SUPER', NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 3. tb_menu — GNB 7개 + LNB 메뉴
-- ----------------------------------------------------------------------------

-- GNB (Top-level navigation)
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(1, '컨트롤러', 'controller', NULL, 'GNB', NULL, 1),
(2, 'RFID', 'rfid', NULL, 'GNB', NULL, 2),
(3, '녹화기관리', 'recorder', NULL, 'GNB', NULL, 3),
-- (4, 'AI시스템', 'ai-system', NULL, 'GNB', NULL, 4),  -- 비활성화
(5, '디스플레이', 'display', NULL, 'GNB', NULL, 5),
(6, '회원관리', 'member', NULL, 'GNB', NULL, 6),
(7, '환경설정', 'settings', NULL, 'GNB', NULL, 7);

-- LNB: 컨트롤러 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(11, '하드웨어 설정', 'controller-hardware', '/controller/hardware', 'LNB', 1, 1),
(12, '제어관리', 'controller-control', '/controller/control', 'LNB', 1, 2);

-- LNB: RFID 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(21, '리더기 관리', 'rfid-reader', '/rfid/readers', 'LNB', 2, 1),
(22, '태그 관리', 'rfid-tag', '/rfid/tags', 'LNB', 2, 2),
(23, '로그', 'rfid-log', '/rfid/logs', 'LNB', 2, 3);

-- LNB: 녹화기관리 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(31, '녹화기 등록', 'recorder-list', '/recorder/list', 'LNB', 3, 1),
(32, '녹화기 제어', 'recorder-control', '/recorder/control', 'LNB', 3, 2),
(33, '녹화 이력', 'recorder-history', '/recorder/history', 'LNB', 3, 3),
(34, '녹화파일 관리', 'recorder-files', '/recorder/files', 'LNB', 3, 4),
(35, 'FTP 설정', 'recorder-ftp', '/recorder/ftp', 'LNB', 3, 5);

-- LNB: AI시스템 하위 (비활성화)
-- INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
-- (41, '강의요약', 'ai-lecture-summary', '/ai-system/lecture-summary', 'LNB', 4, 1),
-- (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2),
-- (43, '음성 명령', 'ai-voice-commands', '/ai-system/voice-commands', 'LNB', 4, 3),
-- (44, 'Worker 서버', 'ai-worker-servers', '/ai-system/worker-servers', 'LNB', 4, 4);

-- LNB: 디스플레이 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(51, '플레이어', 'display-player', '/display/player', 'LNB', 5, 1),
(52, '리스트관리', 'display-list', '/display/list', 'LNB', 5, 2),
(53, '콘텐츠관리', 'display-content', '/display/content', 'LNB', 5, 3);

-- LNB: 회원관리 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(61, '사용자 목록', 'member-list', '/members', 'LNB', 6, 1),
(62, '권한 관리', 'member-permissions', '/members/permissions', 'LNB', 6, 2),
(63, '활동 로그', 'member-activity', '/members/activity', 'LNB', 6, 3);

-- LNB: 환경설정 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(71, '건물관리', 'settings-buildings', '/settings/buildings', 'LNB', 7, 1),
(72, '시스템 설정', 'settings-system', '/settings', 'LNB', 7, 2);

-- 추가 LNB 메뉴
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(73, '콘텐츠 승인', 'display-content-approval', '/display/content-approval', 'LNB', 5, 4),
(74, '소켓연동', 'controller-socket', '/controller/socket', 'LNB', 1, 3);

-- ----------------------------------------------------------------------------
-- 4. tb_menu_users — admin에게 모든 메뉴 권한
-- ----------------------------------------------------------------------------
-- admin(tu_seq=1)에게 전체 메뉴 권한
INSERT INTO `tb_menu_users` (`tu_seq`, `menu_seq`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(1, 11), (1, 12),
(1, 21), (1, 22), (1, 23),
(1, 31), (1, 32), (1, 33), (1, 34), (1, 35),
(1, 41), (1, 42),
(1, 51), (1, 52), (1, 53),
(1, 61), (1, 62), (1, 63),
(1, 71), (1, 72),
(1, 73), (1, 74);

-- ----------------------------------------------------------------------------
-- 5. tb_building — 산학협동관
-- ----------------------------------------------------------------------------
INSERT INTO `tb_building` (`building_seq`, `building_name`, `building_code`, `building_location`, `building_floor_count`, `building_order`)
VALUES (1, '산학협동관', 'BLD-001', '서울시 광진구 능동로 120', 5, 1);

-- ----------------------------------------------------------------------------
-- 6. tb_user_building — admin에게 건물 권한
-- ----------------------------------------------------------------------------
INSERT INTO `tb_user_building` (`tub_seq`, `tu_seq`, `building_seq`)
VALUES (1, 1, 1);

-- ----------------------------------------------------------------------------
-- 7. tb_space — 산학협동관 호실
-- ----------------------------------------------------------------------------
INSERT INTO `tb_space` (`space_seq`, `building_seq`, `space_name`, `space_code`, `space_floor`, `space_type`, `space_capacity`, `space_order`) VALUES
(1, 1, '201호', 'SPC-001', '2', '강의실', 40, 1);

-- ----------------------------------------------------------------------------
-- 8. tb_device_preset — 장비 프리셋
-- ----------------------------------------------------------------------------
INSERT INTO `tb_device_preset` (`preset_seq`, `preset_name`, `protocol_type`, `comm_ip`, `comm_port`, `preset_description`, `preset_order`) VALUES
(1, '프로젝터', 'TCP', '117.16.139.145', 9090, '강의실용 프로젝터', 1),
(2, '전자칠판', 'TCP', '117.16.139.145', 9090, '전자칠판', 2),
(3, '녹화기', 'TCP', '117.16.139.145', 6060, '녹화기', 3),
(4, '스크린', 'TCP', '117.16.139.145', 9090, '스크린 프리셋', 4);

-- ----------------------------------------------------------------------------
-- 9. tb_preset_command — 프리셋 명령어
-- ----------------------------------------------------------------------------
INSERT INTO `tb_preset_command` (`command_seq`, `preset_seq`, `command_name`, `command_code`, `command_type`, `command_order`) VALUES
-- 프로젝터
(1, 1, '프로젝터-켜기', 'EF3031C2303230303130303031FFFFFCFF', 'POWER_ON', 0),
(2, 1, '프로젝터-끄기', 'EF3031C2303230303230303031FFFFFCFF', 'POWER_OFF', 1),
-- 전자칠판
(3, 2, '칠판켜기 ON', 'EF3031C2303130303130303031FFFFFCFF', 'POWER_ON', 0),
(4, 2, '칠판끄기 OFF', 'EF3031C2303130303230303031FFFFFCFF', 'POWER_OFF', 1),
-- 녹화기
(5, 3, '녹화시작', '3000000DCDA90000010000027A', 'POWER_ON', 0),
(6, 3, '녹화정지', '4000000DCDA90000010000027A', 'CUSTOM', 1),
(7, 3, '일시정지', '5000000DCDA90000010000027A', 'CUSTOM', 2),
-- 스크린
(8, 4, '스크린 DOWN', 'EF 30 31 C1 30 31 30 30 30 30 30 30 31 C1 30 32 30 30 31 30 30 30 31 FF FF FC FF', 'POWER_ON', 0),
(9, 4, '스크린 STOP', 'EF 30 31 C1 30 31 30 30 30 30 30 30 31 C1 30 32 30 30 30 30 30 30 31 FF FF FC FF', 'CUSTOM', 1),
(10, 4, '스크린 UP', 'EF 30 31 C1 30 32 30 30 30 30 30 30 31 C1 30 31 30 30 31 30 30 30 31 FF FF FC FF', 'POWER_OFF', 2);

-- ----------------------------------------------------------------------------
-- 10. tb_socket_command — NFC 소켓 명령어
-- ----------------------------------------------------------------------------
INSERT INTO `tb_socket_command` (`socket_cmd_seq`, `cmd_label`, `cmd_hex`, `cmd_category`, `cmd_description`, `cmd_order`) VALUES
(1, 'NFC 페이지 전환', 'EEB111001B03E6100100FFFCFFFF', 'NFC', 'TX — 컨트롤러를 NFC 페이지로 전환', 1),
(2, 'MAIN 페이지 전환', 'EEB111000103E6100100FFFCFFFF', 'NFC', 'TX — NFC 페이지에서 MAIN으로 전환', 2);

-- ----------------------------------------------------------------------------
-- 11. tb_recorder — 녹화기 (호실당 1대, space_seq와 매핑)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_recorder` (`recorder_seq`, `space_seq`, `recorder_name`, `recorder_ip`, `recorder_port`, `recorder_protocol`, `recorder_model`, `recorder_status`) VALUES
(1, 1, 'BON 녹화기', '192.168.1.2', 6060, 'HTTP', 'BON BR-500', 'OFFLINE');

-- ----------------------------------------------------------------------------
-- 11-1. tb_recorder_preset — 녹화기 프리셋 초기 데이터
-- ----------------------------------------------------------------------------
INSERT INTO `tb_recorder_preset` (`rec_preset_seq`, `recorder_seq`, `preset_name`, `preset_number`, `preset_description`, `preset_order`) VALUES
(1, 1, 'PC화면', 0, 'PC 화면 프리셋', 1),
(2, 1, 'PC+강사화면', 1, 'PC와 강사 화면 동시 프리셋', 2),
(3, 1, '강사카메라', 2, '강사 카메라 프리셋', 3);

-- ----------------------------------------------------------------------------
-- 12. tb_ftp_config — FTP 설정 (글로벌 기본 1개)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_ftp_config` (`ftp_config_seq`, `recorder_seq`, `ftp_name`, `ftp_host`, `ftp_port`, `ftp_username`, `ftp_password`, `ftp_path`, `ftp_protocol`, `ftp_passive_mode`, `is_default`) VALUES
(1, NULL, '기본 FTP', '117.16.145.227', 21, 'kuwave', 'kuwave', '/', 'FTP', 'Y', 'Y');

-- ----------------------------------------------------------------------------
-- 13. tb_nfc_reader — NFC 리더기 초기 데이터
-- ----------------------------------------------------------------------------
INSERT INTO `tb_nfc_reader` (`reader_seq`, `space_seq`, `reader_name`, `reader_code`, `reader_api_key`, `reader_status`) VALUES
(1, 1, 'ACR122U', 'RDR-001', 'rdr_3db60088-be2b-484d-8972-56ac3bbf4aca', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 14. tb_ai_worker_server — GPU 서버
-- ----------------------------------------------------------------------------
INSERT INTO `tb_ai_worker_server` (`worker_server_seq`, `server_name`, `server_url`, `api_key`, `callback_secret`, `server_status`, `gpu_info`, `max_concurrent_jobs`, `default_stt_model`, `default_llm_model`) VALUES
(1, '건국대 AI GPU 서버', 'http://203.252.151.52:9000', '4b9a528ac855348e01efee832f64f3d933b57d75f40aaa3b', 'ku-wave-callback-secret-2026', 'ONLINE', 'GPU Server', 1, 'large-v3', 'llama3');


SET FOREIGN_KEY_CHECKS = 1;

-- init_database.sql complete: 41 tables, seed data updated
