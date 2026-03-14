# KU-WAVE-PLAT Database Schema & Data Model Analysis
Generated: 2026-03-14 10:41:53

---

## Executive Summary

KU-WAVE-PLAT uses a MariaDB 11.2 schema with **40 tables across 8 functional domains**: System/Auth, Physical Hierarchy, Controller, NFC/RFID, Display/DID, Recorder, AI System, and Audit. The **physical hierarchy (building → space)** is the central backbone — 8 tables directly reference `tb_space`. **`tb_users` is the most-referenced hub** with 15 inbound foreign keys across all domains. Soft-delete (`*_isdel CHAR DEFAULT 'N'`) is the universal deletion pattern. Migrations are managed manually via TypeORM with `synchronize: false` enforced.

---

## Table Inventory (40 tables)

### Domain 1: System / Auth (3 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_setting` | `ts_seq` INT | Global singleton settings (player version, screen saver times, download links) |
| `tb_users` | `tu_seq` INT | User accounts — JWT tokens stored in DB columns, token_ver for force re-login |
| `tb_activity_log` | `log_seq` BIGINT | HTTP request/response audit (all API calls, denormalized user info) |

### Domain 2: Auth / RBAC (2 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_menu` | `menu_seq` INT | Self-referencing menu tree (GNB = top nav 7 items, LNB = side nav 16 items) |
| `tb_menu_users` | `mu_seq` INT | User ↔ Menu permission mapping (M:N with UNIQUE constraint) |

**Seed data:** 7 GNB menus (컨트롤러, RFID, 화면공유, AI시스템, 디스플레이, 회원관리, 환경설정) and 16 LNB sub-menus pre-inserted.

### Domain 3: Physical Hierarchy (3 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_building` | `building_seq` INT | Building master (code UNIQUE, manager info, floor count) |
| `tb_user_building` | `tub_seq` INT | User ↔ Building permission (M:N, UNIQUE(tu_seq, building_seq)) |
| `tb_space` | `space_seq` INT | Room/space within building (code UNIQUE, floor, type, capacity) |

**Key design:** tb_space is the **pivot point** for all 5 subsystems (controller, NFC, recorder, AI speech, AI summary).

### Domain 4: Controller System (4 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_device_preset` | `preset_seq` INT | Device type template (projector, PC, etc.) with protocol (TCP/UDP/WOL/HTTP/RS232) |
| `tb_preset_command` | `command_seq` INT | Commands per preset (POWER_ON, POWER_OFF, CUSTOM with HEX/text code) |
| `tb_space_device` | `space_device_seq` INT | Physical device instance in a space (IP, port, status) |
| `tb_control_log` | `log_seq` INT | Device control execution log (trigger: MANUAL/NFC/SCHEDULE/VOICE) |

**Design pattern:** Preset → Command is a template; SpaceDevice is the concrete instance. Control is triggered from 4 sources via `trigger_type` enum.

### Domain 5: NFC / RFID System (4 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_nfc_reader` | `reader_seq` INT | Hardware reader per space (UNIQUE reader_code + api_key for auth) |
| `tb_nfc_card` | `card_seq` INT | NFC card or phone credential (UNIQUE card_identifier) |
| `tb_nfc_log` | `nfc_log_seq` INT | Tagging events (ENTER/EXIT/DENIED/UNKNOWN with control result) |
| `tb_nfc_reader_command` | `reader_command_seq` INT | Reader + device → enter/exit command mapping |

**Notable:** `tb_nfc_log.space_seq` is **denormalized** from the reader for faster queries. Nullable `card_seq`/`tu_seq` handles unregistered cards gracefully.

### Domain 6: Display / DID System (11 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_content` | `content_seq` INT | Digital content (VIDEO/IMAGE/HTML/STREAM, file or URL, validity window) |
| `tb_play_list` | `playlist_seq` INT | Playlist with type (NORMAL/EMERGENCY/ANNOUNCEMENT), screen layout (1x1 to 1x8) |
| `tb_play_list_content` | `plc_seq` INT | Playlist ↔ Content mapping with zone coords + approval workflow |
| `tb_content_approval_log` | `log_seq` INT | Immutable approval/rejection audit trail |
| `tb_player` | `player_seq` INT | DID player device (approval workflow, heartbeat, orientation) |
| `tb_player_heartbeat_log` | `heartbeat_seq` INT | Periodic health report (CPU/MEM/DISK/display status) |
| `tb_player_group` | `group_seq` INT | Player group for batch playlist assignment |
| `tb_player_group_member` | `pgm_seq` INT | Player ↔ Group membership (M:N) |
| `tb_player_playlist` | `pp_seq` INT | Direct player → playlist assignment with time/day scheduling |
| `tb_group_playlist` | `gp_seq` INT | Group → playlist assignment with time/day scheduling |
| `tb_play_log` | `log_seq` BIGINT | Per-content playback events (COMPLETED/SKIPPED/ERROR) |

**Key design:** Two assignment paths: direct (tb_player_playlist) and group-based (tb_group_playlist → tb_player_group_member → tb_player). `tb_play_log` uses BIGINT PK for high-volume inserts.

### Domain 7: Recorder System (7 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_recorder` | `recorder_seq` INT | PTZ camera recorder — **1:1 with space** via UNIQUE(space_seq) |
| `tb_recorder_user` | `recorder_user_seq` INT | Professor assignment to recorder (M:N, UNIQUE(recorder_seq, tu_seq)) |
| `tb_recorder_preset` | `rec_preset_seq` INT | PTZ presets (pan/tilt/zoom values, UNIQUE(recorder_seq, preset_number)) |
| `tb_ftp_config` | `ftp_config_seq` INT | FTP/SFTP/FTPS upload config (NULL recorder_seq = global default) |
| `tb_recording_session` | `rec_session_seq` INT | Recording session lifecycle (RECORDING/COMPLETED/FAILED/CANCELLED) |
| `tb_recording_file` | `rec_file_seq` INT | File metadata + FTP upload status tracking with retry count |
| `tb_recorder_log` | `rec_log_seq` INT | Recorder command execution audit |

**Notable:** Passwords AES-encrypted in DB. FTP config supports global default (NULL recorder_seq) or per-recorder override.

### Domain 8: AI System (6 tables)

| Table | PK | Purpose |
|-------|-----|---------|
| `tb_ai_worker_server` | `worker_server_seq` INT | GPU server registry (UNIQUE server_url, STT/LLM model config) |
| `tb_ai_voice_command` | `voice_command_seq` INT | Keyword → device command mapping per space (confidence threshold) |
| `tb_ai_speech_session` | `session_seq` INT | Real-time STT session (ACTIVE/PAUSED/ENDED, segment/command counts) |
| `tb_ai_speech_log` | `speech_log_seq` INT | Per-segment STT results (text, timestamps, confidence, is_command flag) |
| `tb_ai_command_log` | `command_log_seq` INT | Voice-to-command execution log (verify_source: LOCAL_VOSK/REMOTE_WHISPER) |
| `tb_ai_lecture_summary` | `summary_seq` INT | Async STT+LLM job result (job_id UUID from external worker, LONGTEXT fields) |

---

## Entity-Relationship Diagram

```
PHYSICAL BACKBONE:
tb_building ──→ tb_space ──┬──→ tb_space_device ──→ tb_device_preset
                            │         │                    │
                            │         └──→ tb_preset_command
                            │
                            ├──→ tb_nfc_reader ──→ tb_nfc_reader_command
                            │
                            ├──→ tb_recorder (1:1 UNIQUE)
                            │
                            ├──→ tb_ai_speech_session
                            │
                            └──→ tb_ai_lecture_summary

AUTH HUB (tb_users referenced by 15 tables):
tb_users ←── tb_menu_users ──→ tb_menu (self-ref tree)
tb_users ←── tb_user_building ──→ tb_building
tb_users ←── tb_nfc_card ──→ (tb_nfc_log nullable)
tb_users ←── tb_play_list_content (requester + reviewer)
tb_users ←── tb_player (approved_by)
tb_users ←── tb_recorder (current_user + recorder_user + recording_session + recorder_log)
tb_users ←── tb_ai_speech_session + tb_ai_lecture_summary
tb_users ←── tb_control_log + tb_content_approval_log + tb_activity_log

DISPLAY ASSIGNMENT (dual path):
tb_play_list ──→ tb_player (direct active playlist)
tb_play_list ←── tb_player_playlist ──→ tb_player        (direct+scheduled)
tb_play_list ←── tb_group_playlist ──→ tb_player_group
                                              └──→ tb_player_group_member ──→ tb_player

APPROVAL WORKFLOW (display content):
tb_play_list_content: approval_status ENUM(PENDING/APPROVED/REJECTED)
  requester_seq ──→ tb_users
  reviewer_seq  ──→ tb_users
  └──→ tb_content_approval_log (immutable audit: APPROVED/REJECTED/CANCELLED)
```

---

## All 66 Foreign Key Relationships

### Cascade DELETE (45): Entity deletion propagates to children
### SET NULL (20): Audit log preservation — actor/user references become NULL on delete
### RESTRICT (1): tb_space_device → tb_device_preset (preset cannot be deleted while devices exist)

**Critical cascade chains:**
1. `tb_building` DELETE → CASCADE → `tb_space` → CASCADE → `tb_space_device`, `tb_nfc_reader`, `tb_recorder`, `tb_ai_speech_session`, `tb_ai_lecture_summary`
2. `tb_recorder` DELETE → CASCADE → `tb_recorder_preset`, `tb_recorder_user`, `tb_ftp_config`, `tb_recording_session` → `tb_recording_file`
3. `tb_play_list` DELETE → CASCADE → `tb_play_list_content` → CASCADE → `tb_content_approval_log`
4. `tb_player` DELETE → CASCADE → `tb_player_heartbeat_log`, `tb_play_log`, `tb_player_group_member`, `tb_player_playlist`

---

## Indexes & Performance Considerations

### Indexed columns (from init_database.sql):

| Domain | Table | Indexed Columns |
|--------|-------|-----------------|
| Physical | tb_building | building_code, building_isdel, building_name, building_order |
| Physical | tb_space | building_seq, space_code, space_floor, space_isdel, space_order |
| Physical | tb_menu | menu_type, parent_seq, menu_order |
| Physical | tb_menu_users | tu_seq, menu_seq |
| Physical | tb_user_building | building_seq |
| Controller | tb_device_preset | protocol_type, preset_isdel, preset_order |
| Controller | tb_preset_command | preset_seq, command_type, command_isdel, command_order |
| Controller | tb_space_device | space_seq, preset_seq, device_status, device_isdel |
| Controller | tb_control_log | space_device_seq, command_seq, tu_seq, trigger_type, result_status, executed_at |
| NFC | tb_nfc_reader | space_seq, reader_status, reader_isdel |
| NFC | tb_nfc_card | tu_seq, card_aid, card_type, card_status, card_isdel |
| NFC | tb_nfc_log | reader_seq, card_seq, tu_seq, space_seq, log_type, control_result, tagged_at |
| NFC | tb_nfc_reader_command | (reader_seq, command_isdel) composite, space_device_seq |
| Display | tb_play_list_content | approval_status, reviewer_seq, requester_seq |
| Display | tb_content_approval_log | plc_seq, actor_seq, created_at |
| AI | tb_ai_voice_command | space_seq, keyword, space_device_seq, command_isdel |
| AI | tb_ai_speech_session | space_seq, tu_seq, session_status, started_at, session_isdel |
| AI | tb_ai_speech_log | session_seq, is_command, created_at |
| AI | tb_ai_command_log | session_seq, voice_command_seq, execution_status, created_at |
| AI | tb_ai_lecture_summary | space_seq, tu_seq, device_code, process_status, recorded_at, summary_isdel |
| Recorder | tb_recorder | recorder_ip, recorder_status, recorder_isdel, recorder_order |
| Recorder | tb_recorder_user | recorder_seq, tu_seq, recorder_user_isdel |
| Recorder | tb_recorder_preset | recorder_seq, preset_isdel, preset_order |
| Recorder | tb_ftp_config | recorder_seq, is_default, ftp_isdel |
| Recorder | tb_recording_session | recorder_seq |
| AI Worker | tb_ai_worker_server | server_status, server_isdel |

**Performance notes:**
- tb_play_log uses BIGINT PK (high-volume playback events)
- tb_activity_log uses BIGINT PK (all HTTP requests logged)
- tb_nfc_log.space_seq is denormalized from reader to avoid join on frequent queries
- tb_control_log.executed_at indexed for time-range queries
- Composite index on tb_nfc_reader_command (reader_seq, command_isdel) for active command lookups

---

## TypeORM Entity Mapping Patterns

### 1. Soft Delete Pattern (universal)
```typescript
// All deletable tables use CHAR(1) DEFAULT 'N' — never actual DELETE
@Column({ name: 'X_isdel', type: 'char', length: 1, default: 'N' })
xIsdel: 'Y' | 'N';
// Query always includes: WHERE X_isdel = 'N'
```

### 2. Auto-timestamp Pattern (all mutable tables)
```typescript
@Column({ name: 'reg_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
regDate: Date;

@Column({ name: 'upd_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP',
  onUpdate: 'CURRENT_TIMESTAMP' })
updDate: Date;
```

### 3. Approval Workflow Pattern (display + players)
```typescript
// Used in tb_player and tb_play_list_content
@Column({ name: 'approval_status', type: 'enum',
  enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
```

### 4. Enum Columns (TypeORM enum type)
```
tb_content.content_type: VIDEO | IMAGE | HTML | STREAM
tb_player.player_status: ONLINE | OFFLINE | ERROR | MAINTENANCE
tb_play_list.playlist_type: NORMAL | EMERGENCY | ANNOUNCEMENT
tb_control_log.trigger_type: MANUAL | NFC | SCHEDULE | VOICE
tb_nfc_log.log_type: ENTER | EXIT | DENIED | UNKNOWN
tb_recording_session.session_status: RECORDING | COMPLETED | FAILED | CANCELLED
tb_ai_lecture_summary.process_status: UPLOADING | PROCESSING | COMPLETED | FAILED
tb_ai_speech_session.session_status: ACTIVE | PAUSED | ENDED
```

### 5. Char(Y/N) Boolean Pattern
```typescript
// Older/legacy boolean representation (not TypeScript boolean)
// e.g.: playlist_loop, playlist_random, is_default, ftp_passive_mode
@Column({ name: 'playlist_loop', type: 'char', length: 1, default: 'Y' })
playlistLoop: 'Y' | 'N';
```

### 6. Denormalization Pattern (performance)
```sql
-- tb_nfc_log.space_seq denormalized from tb_nfc_reader.space_seq
-- Avoids JOIN on high-frequency log queries
-- tb_activity_log stores tu_id, tu_name (denormalized from tb_users)
-- Ensures log integrity after user deletion
```

### 7. Audit Trail Preservation Pattern
```typescript
// FK with ON DELETE SET NULL preserves log records even after referenced entity deleted
// actor_seq, reviewer_seq, requester_seq all nullable in log tables
@ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
actor: TbUser | null;
```

---

## Migration History & Strategy

### Current migrations:
| File | Content |
|------|---------|
| `1708300000000-AddContentApproval.ts` | Adds 5 approval columns to `tb_play_list_content` + creates `tb_content_approval_log` + 6 indexes |

### Migration pattern:
- `synchronize: false` enforced (never auto-sync in any environment)
- Migrations via TypeORM CLI: `migration:generate` → review → `migration:run`
- Rollback supported via `down()` method on each migration
- Migration files in `apps/api/src/database/migrations/`

### Schema evolution notes:
- Display system extended post-initial with approval workflow (migration 1708300000000)
- AI system tables added separately in `init_database.sql` with date comment 2026-02-19
- Recorder system added 2026-02-22 per SQL comments

---

## Seed Data Structure

Pre-seeded from `init_database.sql`:
- **tb_menu**: 7 GNB + 16 LNB items (menu_seq 1-7, 11-72)
- **tb_setting**: Expected to have 1 singleton row inserted at startup

No other seed data in codebase (`.omc/scientist/seeds/.gitkeep` is empty).

---

## Notable Data Patterns

### 1. JWT Tokens Stored in DB
`tb_users` stores `tu_access_token` (VARCHAR 300) and `tu_refresh_token` (VARCHAR 500) directly.  `tu_token_ver INT DEFAULT 1` increments on permission change to invalidate all sessions.

### 2. AES Encrypted Passwords
`tb_recorder.recorder_password` and `tb_ftp_config.ftp_password` are AES-encrypted (not bcrypt). `tb_users.tu_pw` uses bcrypt.

### 3. No Created_by/Updated_by Audit
Tables track `reg_date`/`upd_date` timestamps but NOT who made the change. Only dedicated log tables (`tb_activity_log`, `tb_control_log`, `tb_content_approval_log`, `tb_recorder_log`, `tb_nfc_log`) capture actor identity.

### 4. External GPU Worker Integration
`tb_ai_lecture_summary.job_id` is a UUID from the external `ku_ai_worker` GPU server. The platform receives async results via webhook/callback. The worker server URL/key registered in `tb_ai_worker_server`.

### 5. Dual STT Architecture
- **Real-time** (local): `tb_ai_speech_session` + `tb_ai_speech_log` + `tb_ai_command_log` → uses faster-whisper locally
- **Async batch** (GPU server): `tb_ai_lecture_summary` → uploads recording → receives transcript + summary via callback

### 6. Content Zone Layout
`tb_play_list_content` stores zone_number (1-8), zone_width/height/x/y as DECIMAL(5,2) percentages. Supports screen split layouts up to 1x8 as defined in `tb_play_list.playlist_screen_layout`.

---

## Limitations

- `tb_users.tu_type` (CHAR 6) and `tu_step` (CHAR 2) use opaque code values — no lookup table found in schema
- `tb_content.content_tags` stored as VARCHAR(500) JSON/CSV string — not normalized
- `tb_ai_voice_command.keyword_aliases` stored as TEXT JSON — not queryable by SQL
- `tb_ai_lecture_summary.summary_keywords` stored as TEXT JSON — same limitation
- No `tb_recorder_file` to `tb_recording_session` index found in entity (only in SQL)
- `tb_player` lacks explicit index on `player_code`, `player_ip`, `player_api_key` in SQL DDL
- `si_seq` in `tb_users` references a "site" concept not present in any other table (legacy field)
- Migration timestamp `1708300000000` = Unix ms for 2024-02-19 — pre-dates AI tables (2026)

---
*Generated by Scientist Agent — KU-WAVE-PLAT DB Schema Analysis*
*Source files: docs/init_database.sql, apps/api/src/modules/*/entities/*.ts*
