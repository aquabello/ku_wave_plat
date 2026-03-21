# 데이터 모델

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 데이터 모델

---

## 1. 개요

40개 테이블이 8개 도메인에 걸쳐 분포하며, 41개의 TypeORM 엔티티로 매핑된다. 전체 DDL은 `docs/init_database.sql`을 참조한다.

---

## 2. 도메인별 테이블 구조

### 2.1 시스템/인증 (3 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_setting` | Setting | 시스템 전역 설정 | setting_key, setting_value, logo_path |
| `tb_users` | User | 사용자 (허브 테이블, 15개 FK 참조) | user_seq, user_id, password, role, user_isdel |
| `tb_activity_log` | ActivityLog | HTTP 요청/응답 활동 로그 | log_seq, user_seq, method, path, status_code, reg_date |

### 2.2 RBAC (2 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_menu` | Menu | GNB/LNB 메뉴 트리 | menu_seq, parent_seq, menu_name, menu_path, sort_order |
| `tb_menu_users` | MenuUser | 메뉴별 사용자 권한 매핑 | menu_seq, user_seq |

### 2.3 물리 계층 (3 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_building` | Building | 건물 | building_seq, building_name, building_isdel |
| `tb_space` | Space | 공간 (허브 테이블, 8개 참조) | space_seq, building_seq, space_name, space_isdel |
| `tb_user_building` | UserBuilding | 사용자-건물 권한 매핑 | user_seq, building_seq |

### 2.4 IoT 컨트롤러 (5 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_device_preset` | DevicePreset | 디바이스 프리셋 | preset_seq, space_seq, preset_name |
| `tb_preset_command` | PresetCommand | 프리셋 명령어 | command_seq, preset_seq, command_type, command_value |
| `tb_space_device` | SpaceDevice | 공간-디바이스 매핑 | space_seq, device_type, device_ip, device_port |
| `tb_control_log` | ControlLog | 제어 명령 로그 | log_seq, space_seq, command, result, reg_date |
| `tb_socket_command` | SocketCommand | 소켓 통신 명령 정의 | command_seq, command_name, command_data |

### 2.5 NFC/RFID (4 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_nfc_reader` | NfcReader | NFC 리더 장치 | reader_seq, space_seq, reader_name, api_key |
| `tb_nfc_card` | NfcCard | NFC 카드 | card_seq, user_seq, card_uid, card_isdel |
| `tb_nfc_log` | NfcLog | NFC 태깅 이력 | log_seq, reader_seq, card_uid, tag_result, reg_date |
| `tb_nfc_reader_command` | NfcReaderCommand | 리더 명령 | command_seq, reader_seq, command_type |

### 2.6 디스플레이/DID (11 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_content` | Content | 콘텐츠 | content_seq, content_type (VIDEO/IMAGE/HTML/STREAM), file_path |
| `tb_play_list` | PlayList | 플레이리스트 | playlist_seq, playlist_name |
| `tb_play_list_content` | PlayListContent | 플레이리스트-콘텐츠 매핑 | playlist_seq, content_seq, sort_order, duration |
| `tb_content_approval_log` | ContentApprovalLog | 콘텐츠 승인 이력 | log_seq, content_seq, approval_status, approver_seq |
| `tb_player` | Player | 디스플레이 장치 | player_seq, space_seq, player_name, api_key, approval_status |
| `tb_player_heartbeat_log` | PlayerHeartbeatLog | 플레이어 하트비트 | log_seq, player_seq, reg_date |
| `tb_player_group` | PlayerGroup | 플레이어 그룹 | group_seq, group_name |
| `tb_player_group_member` | PlayerGroupMember | 그룹-플레이어 매핑 | group_seq, player_seq |
| `tb_player_playlist` | PlayerPlaylist | 플레이어-플레이리스트 매핑 | player_seq, playlist_seq |
| `tb_group_playlist` | GroupPlaylist | 그룹-플레이리스트 매핑 | group_seq, playlist_seq |
| `tb_play_log` | PlayLog | 재생 로그 | log_seq, player_seq, content_seq, play_start, play_end |

### 2.7 녹화 (7 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_recorder` | Recorder | ONVIF 녹화기 | recorder_seq, space_seq, recorder_ip, recorder_port |
| `tb_recorder_user` | RecorderUser | 녹화기 접속 계정 | recorder_seq, username, password |
| `tb_recorder_preset` | RecorderPreset | 녹화기 PTZ 프리셋 | preset_seq, recorder_seq, preset_name, pan, tilt, zoom |
| `tb_ftp_config` | FtpConfig | FTP 서버 설정 | ftp_seq, host, port, protocol (FTP/SFTP/FTPS), username |
| `tb_recording_session` | RecordingSession | 녹화 세션 | session_seq, recorder_seq, start_time, end_time, status |
| `tb_recording_file` | RecordingFile | 녹화 파일 | file_seq, session_seq, file_path, file_size, ftp_status |
| `tb_recorder_log` | RecorderLog | 녹화기 제어 로그 | log_seq, recorder_seq, action, result, reg_date |

### 2.8 AI 시스템 (6 테이블)

| 테이블 | 엔티티 | 설명 | 핵심 컬럼 |
|--------|--------|------|-----------|
| `tb_ai_worker_server` | AiWorkerServer | AI Worker GPU 서버 | server_seq, server_url, status, last_heartbeat |
| `tb_ai_voice_command` | AiVoiceCommand | 음성 명령 정의 | command_seq, keyword, action_type, space_seq |
| `tb_ai_speech_session` | AiSpeechSession | 음성 인식 세션 | session_seq, space_seq, start_time, end_time |
| `tb_ai_speech_log` | AiSpeechLog | STT 결과 로그 | log_seq, session_seq, text, confidence |
| `tb_ai_command_log` | AiCommandLog | 음성 명령 실행 로그 | log_seq, command_seq, result, reg_date |
| `tb_ai_lecture_summary` | AiLectureSummary | AI 강의 요약 | summary_seq, session_seq, summary_text |

---

## 3. 핵심 관계도

```
tb_users (허브)
  ├── tb_nfc_card (1:N) — 사용자별 NFC 카드
  ├── tb_menu_users (N:M) — 메뉴 접근 권한
  ├── tb_user_building (N:M) — 건물 접근 권한
  ├── tb_activity_log (1:N) — 활동 로그
  └── tb_content (1:N) — 콘텐츠 등록자
       └── tb_content_approval_log (1:N) — 승인 이력

tb_building
  └── tb_space (1:N) — 건물 하위 공간
       ├── tb_nfc_reader (1:N) — 공간별 NFC 리더
       ├── tb_recorder (1:N) — 공간별 녹화기
       ├── tb_space_device (1:N) — 공간별 IoT 디바이스
       ├── tb_player (1:N) — 공간별 디스플레이
       ├── tb_device_preset (1:N) — 공간별 프리셋
       ├── tb_ai_voice_command (1:N) — 공간별 음성 명령
       └── tb_ai_speech_session (1:N) — 공간별 STT 세션

tb_recorder
  ├── tb_recorder_user (1:N) — 접속 계정
  ├── tb_recorder_preset (1:N) — PTZ 프리셋
  ├── tb_recording_session (1:N) — 녹화 세션
  │    └── tb_recording_file (1:N) — 녹화 파일
  └── tb_recorder_log (1:N) — 제어 로그

tb_player
  ├── tb_player_heartbeat_log (1:N) — 하트비트
  ├── tb_player_playlist (N:M) — 플레이리스트 매핑
  ├── tb_player_group_member (N:M) — 그룹 멤버십
  └── tb_play_log (1:N) — 재생 로그

tb_play_list
  ├── tb_play_list_content (N:M) — 콘텐츠 매핑 (sort_order)
  ├── tb_player_playlist (N:M) — 플레이어 매핑
  └── tb_group_playlist (N:M) — 그룹 매핑
```

---

## 4. 공통 패턴

### 소프트 삭제

약 28/40 테이블에서 소프트 삭제를 사용한다.

```sql
-- 컬럼 네이밍 패턴
<entity>_isdel CHAR(1) DEFAULT 'N'

-- 쿼리 패턴
WHERE user_isdel = 'N'
```

### 타임스탬프

```sql
-- 등록일 (자동)
reg_date DATETIME DEFAULT CURRENT_TIMESTAMP

-- 수정일 (자동 갱신)
upd_date DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
```

**주의**: TypeORM의 `@CreateDateColumn`/`@UpdateDateColumn`이 아닌 DB 레벨에서 수동 관리된다.

### Primary Key 네이밍

```sql
-- 패턴: <entity>_seq (AUTO_INCREMENT)
user_seq INT AUTO_INCREMENT PRIMARY KEY
building_seq INT AUTO_INCREMENT PRIMARY KEY
```

---

## 5. 전체 DDL 참조

전체 테이블 DDL(CREATE TABLE 문)은 다음 파일에서 확인할 수 있다:

→ **`docs/init_database.sql`**

이 파일에는 40개 테이블의 완전한 스키마 정의가 포함되어 있으며, 컬럼 타입, 제약조건, 인덱스, 외래 키 등 모든 상세 정보를 담고 있다.
