# NFC 기반 AI 강의 녹음 통합 플로우

> **작성일**: 2026-03-23
> **목표**: NFC 태깅으로 강의 시작/종료 시 IoT 제어 + AI 녹음/분석을 자동 트리거
> **삭제 대상**: ku_ai_pc의 키보드 수동 제어 (`s`: 시작, `e`: 종료) → 전면 삭제

---

## 전체 시퀀스 다이어그램

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ NFC 카드  │     │ ku_wave_plat │     │  ku_ai_pc    │     │ ku_ai_worker │
│ (교수)    │     │ (운영 서버)   │     │ (강의실 PC)  │     │ (GPU 서버)   │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                    │                    │
     │  ═══════════  NFC 인증 + 강의 시작  ═══════════════════    │
     │                  │                    │                    │
     │ ① NFC 태깅      │                    │                    │
     ├─────────────────▶│                    │                    │
     │                  │ ②-a 카드 인증      │                    │
     │                  │  (등록/ACTIVE/권한)  │                    │
     │                  │  (→ ENTER 판정)     │                    │
     │                  │                    │                    │
     │                  │ ②-b IoT 명령어     │                    │
     │                  │ ═══TCP 9090═══════▶│ IoT 컨트롤러       │
     │                  │                    │                    │
     │                  │ ②-c AI 녹음 시작    │                    │
     │                  ├───────────────────▶│                    │
     │                  │  POST /ai/start    │                    │
     │                  │                    │ ③ 녹음+STT 시작    │
     │                  │ ④ Session 생성     │                    │
     │                  │◀───────────────────┤                    │
     │                  │                    │                    │
     │  ═══════════  강의 중 (실시간 루프)  ════════════════════   │
     │                  │                    │                    │
     │                  │ ⑥ STT 로그 전송    │                    │
     │                  │◀───────────────────┤                    │
     │                  │ ⑦ Voice Detect     │                    │
     │                  │◀───────────────────┤                    │
     │                  │ ⑧ 장비 제어 실행   │                    │
     │                  │ ═══TCP 9090═══════▶│ IoT 컨트롤러       │
     │                  │                    │                    │
     │  ═══════════  NFC 인증 + 강의 종료  ═══════════════════    │
     │                  │                    │                    │
     │ ⑨ NFC 태깅      │                    │                    │
     ├─────────────────▶│                    │                    │
     │                  │ ⑩-a (→ EXIT 판정)  │                    │
     │                  │ ⑩-b IoT 명령어     │                    │
     │                  │ ═══TCP 9090═══════▶│ IoT 컨트롤러       │
     │                  │ ⑩-c AI 녹음 종료   │                    │
     │                  ├───────────────────▶│                    │
     │                  │  POST /ai/stop     │                    │
     │                  │                    │ ⑪ 녹음정지+WAV저장  │
     │                  │                    │ ⑫ 청크 업로드       │
     │                  │                    ├───────────────────▶│
     │                  │ ⑬ Session 종료     │                    │
     │                  │◀───────────────────┤                    │
     │                  │                    │                    │
     │  ═══════════  AI 비동기 처리  ══════════════════════════   │
     │                  │                    │    ⑭ .wav→txt(STT) │
     │                  │                    │    ⑮ txt→ollama    │
     │                  │ ⑯ Callback 결과    │                    │
     │                  │◀───────────────────────────────────────┤
     │                  │ ⑰ 결과 저장        │                    │
     └                  └                    └                    └
```

---

## 개발 문서

| 문서 | 대상 | 설명 |
|------|------|------|
| [plan_nfc.md](./plan_nfc.md) | **NFC 연동** | NFC 태깅 → IoT + AI 트리거 통합 개발 |
| [plan_ku_wave_plat.md](./plan_ku_wave_plat.md) | **ku_wave_plat** | 운영 서버 셋업 + AI 연동 API |
| [plan_ku_ai_pc.md](./plan_ku_ai_pc.md) | **ku_ai_pc** | 강의실 클라이언트 + FastAPI HTTP 서버 |

---

## TODO — 개발 진행 관리

### Phase 1: ku_wave_plat — NfcTagService AI 연동 ✅ 완료

- [x] Space ↔ ku_ai_pc URL 매핑 방식 결정 → `tb_space.ai_pc_url` 컬럼 (VARCHAR 255, nullable)
- [x] NfcTagService.processTag() 수정 — ENTER 시 ku_ai_pc `/ai/start` 호출
- [x] NfcTagService.processTag() 수정 — EXIT 시 ku_ai_pc `/ai/stop` 호출
- [x] AI 호출 에러 처리 (AiPcClientService, 3초 타임아웃, try-catch 격리)
- [x] tb_nfc_log.controlDetail에 AI 호출 결과 기록 (`{iotControl, aiControl}` 구조)
- [x] .http 테스트 파일 작성 (`docs/api/nfc-ai.http`)
- [x] API 빌드 성공 확인

**DB 설정 필요 (운영 시):**
```sql
ALTER TABLE tb_space ADD COLUMN ai_pc_url VARCHAR(255) NULL COMMENT 'AI PC 클라이언트 URL';
UPDATE tb_space SET ai_pc_url = 'http://192.168.1.50:9100' WHERE space_seq = 1;
```

**변경 파일:**
| 파일 | 변경 |
|------|------|
| `apps/api/src/modules/nfc/services/ai-pc-client.service.ts` | 신규 — ofetch 기반, 3초 타임아웃 |
| `apps/api/src/modules/nfc/services/nfc-tag.service.ts` | Step 6-1 AI 연동 추가 + controlDetail 확장 + 응답에 aiResult |
| `apps/api/src/modules/spaces/entities/tb-space.entity.ts` | aiPcUrl 컬럼 추가 |
| `apps/api/src/modules/nfc/nfc.module.ts` | AiPcClientService 등록 |
| `docs/api/nfc-ai.http` | 신규 — 테스트 시나리오 |

### Phase 2: ku_ai_pc — FastAPI HTTP 서버

- [ ] 키보드 제어 (s/e) 전면 삭제
- [ ] FastAPI 서버 구축 (:9100)
- [ ] POST /ai/start 구현 (SpeechSession 생성 → 녹음 → STT → Voice Detect)
- [ ] POST /ai/stop 구현 (녹음정지 → WAV 저장 → Worker 청크 전송 → Session 종료)
- [ ] GET /ai/status 구현
- [ ] .env에 AI_PC_PORT=9100 추가
- [ ] systemd 서비스 파일 업데이트

### Phase 3: 통합 테스트

- [ ] 정상 플로우: NFC 태깅(ENTER) → IoT ON + AI 시작 → 녹음 → 음성명령 → NFC 태깅(EXIT) → IoT OFF + AI 종료 → Worker 전송 → Callback → 결과 저장
- [ ] 에러 케이스: ku_ai_pc 다운 시 IoT 정상 동작 확인
- [ ] 에러 케이스: 네트워크 단절 시 Offline Queue 동작 확인
- [ ] 에러 케이스: 중복 태깅 (쿨다운 30초) 확인
- [ ] 에러 케이스: 미등록/비활성/차단 카드 → AI 시작 안 됨 확인

### Phase 4: 운영 배포

- [ ] ku_wave_plat 서버 빌드 + 배포
- [ ] ku_ai_pc 방화벽 9100 포트 개방
- [ ] ku_ai_pc FastAPI 서비스 systemd 등록
- [ ] 호실별 .env 설정 (SPACE_SEQ, AI_PC_PORT)
- [ ] 전체 호실 통합 테스트

---

## 방화벽 / 포트 정리

| 시스템 | 포트 | 프로토콜 | 방향 | 용도 |
|--------|------|----------|------|------|
| ku_wave_plat | 80 | HTTP | IN | Nginx → Console + API |
| ku_wave_plat | 8000 | HTTP | 내부 | NestJS API |
| ku_wave_plat | 3000 | HTTP | 내부 | Next.js Console |
| ku_wave_plat | 3306 | TCP | 내부 | MariaDB |
| ku_ai_pc | **9100** | HTTP | IN | **[신규]** FastAPI AI 제어 서버 |
| ku_ai_pc | — | HTTP | OUT | ku_wave_plat API, ku_ai_worker |
| ku_ai_worker | 9000 | HTTP | IN | AI Job 수신 서버 |
| ku_ai_worker | — | HTTP | OUT | ku_wave_plat Callback |
| IoT 컨트롤러 | 9090 | TCP | IN | 디바이스 제어 소켓 |
