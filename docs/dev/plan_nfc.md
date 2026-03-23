# NFC 태깅 → IoT + AI 통합 개발 계획

> **작성일**: 2026-03-23
> **대상**: ku_wave_plat NFC 모듈 확장
> **목표**: NFC ENTER/EXIT 태깅 시 기존 IoT 제어에 더해 ku_ai_pc AI 녹음을 자동 트리거

---

## 1. 현재 NFC 프로세스 (기존)

```
NFC 태깅
  │
  ▼
NfcTagService.processTag()
  │
  ├── Step 1: 카드 식별 (cardIdentifier → tb_nfc_card)
  │   └── 미등록 → IoT 디스플레이 등록 확인 → REGISTER_SAVE / REGISTER_NO / REGISTER_TIMEOUT
  │
  ├── Step 2: 카드 상태 확인 (INACTIVE/BLOCKED → DENIED)
  │
  ├── Step 3: 건물 권한 확인 (tb_user_building → DENIED)
  │
  ├── Step 4: 쿨다운 체크 (30초 간격 제한)
  │
  ├── Step 5: ENTER/EXIT 토글 (마지막 로그 기반)
  │
  ├── Step 6: IoT 디바이스 제어 ← [기존, 유지]
  │   ├── tb_nfc_reader_command 매핑 조회
  │   ├── ENTER → enterCommandSeq 실행
  │   ├── EXIT → exitCommandSeq 실행
  │   └── ControlService.executeForNfcWithMappings() → TCP 9090
  │
  ├── Step 7: NFC 로그 저장 (tb_nfc_log)
  │
  └── Step 8: 응답 반환
```

---

## 2. 변경 후 NFC 프로세스 (신규)

```
NFC 태깅
  │
  ▼
NfcTagService.processTag()
  │
  ├── Step 1~5: [기존 그대로]
  │
  ├── Step 6: IoT 디바이스 제어 [기존, 유지]
  │   └── ControlService.executeForNfcWithMappings()
  │
  ├── Step 6-1: AI 녹음 연동 ← ★ [신규 추가]
  │   │
  │   ├── Space에 매핑된 ku_ai_pc URL 조회
  │   │   └── space.aiPcUrl (예: http://192.168.1.50:9100)
  │   │
  │   ├── ENTER 판정 시:
  │   │   ├── POST {aiPcUrl}/ai/start
  │   │   │   Body: {spaceSeq, tuSeq, callbackUrl, wavePlatUrl}
  │   │   └── 응답: {status: "started", sessionSeq}
  │   │
  │   ├── EXIT 판정 시:
  │   │   ├── POST {aiPcUrl}/ai/stop
  │   │   │   Body: {spaceSeq}
  │   │   └── 응답: {status: "stopped", sessionSeq, filename, durationSec}
  │   │
  │   └── 에러 처리:
  │       ├── try-catch로 감싸기 (AI 실패해도 IoT는 정상)
  │       ├── 타임아웃: 3초 (AbortController)
  │       └── 실패 시 controlDetail에 AI 에러 기록
  │
  ├── Step 7: NFC 로그 저장 [기존, AI 결과 추가]
  │   └── controlDetail에 AI 호출 결과도 포함
  │
  └── Step 8: 응답 반환
```

---

## 3. 코드 변경 상세

### 3-1. Space ↔ ku_ai_pc URL 매핑

**방법 A (권장): tb_space 테이블 컬럼 활용**

```
tb_space 테이블에 이미 있는 컬럼 또는 추가할 컬럼:
  ai_pc_url VARCHAR(255) NULL  -- 예: http://192.168.1.50:9100

조회: space.aiPcUrl가 NULL이 아니면 AI 연동 실행
      NULL이면 AI 연동 스킵 (AI PC가 없는 공간)
```

> ⚠️ CRITICAL RULE: 테이블 생성 금지. 기존 tb_space에 컬럼이 없다면 사용자 확인 후 진행.

### 3-2. NfcTagService 수정 위치

```
파일: apps/api/src/modules/nfc/services/nfc-tag.service.ts

수정 위치: Step 6 (Device Control) 이후, Step 7 (Save NFC Log) 이전

추가할 로직:
  1. space 조회 시 aiPcUrl도 함께 가져오기 (이미 space 조회 중)
  2. aiPcUrl이 존재하면 AI 연동 실행
  3. try-catch로 감싸서 실패해도 NFC 응답은 정상 반환
```

### 3-3. 의사 코드

```typescript
// Step 6 이후, Step 7 이전에 추가
// [Step 6-1] AI Recording Control
let aiResult: { status: string; sessionSeq?: number } | null = null;
if (space?.aiPcUrl) {
  try {
    const aiEndpoint = logType === 'ENTER' ? '/ai/start' : '/ai/stop';
    const aiBody = logType === 'ENTER'
      ? {
          spaceSeq: reader.spaceSeq,
          tuSeq: card.tuSeq,
          callbackUrl: `${configService.get('WAVE_PLAT_URL')}/ai-system/ai/callback`,
          wavePlatUrl: configService.get('WAVE_PLAT_URL'),
        }
      : { spaceSeq: reader.spaceSeq };

    const response = await ofetch(`${space.aiPcUrl}${aiEndpoint}`, {
      method: 'POST',
      body: aiBody,
      timeout: 3000, // 3초 타임아웃
    });
    aiResult = response;
    this.logger.log(`AI ${logType}: ${aiEndpoint} → ${response.status}`);
  } catch (error) {
    this.logger.error(`AI ${logType} failed: ${error.message}`);
    aiResult = { status: 'FAILED', error: error.message };
    // IoT 제어는 이미 완료됨 — AI 실패해도 계속 진행
  }
}
```

---

## 4. Voice Detect 명령어 실행 흐름 (강의 중)

> 이 부분은 기존 코드가 이미 완성되어 있음. ku_ai_pc가 호출하는 기존 API.

```
ku_ai_pc (강의 중 실시간 루프)
  │
  ├── 마이크 → faster-whisper (5초 청크) → STT 텍스트
  │
  ├── STT 로그 전송
  │   POST /api/v1/ai-system/speech-sessions/:seq/logs
  │   → SpeechSessionsService.createSpeechLog()
  │
  └── Voice Detect 매칭 시
      POST /api/v1/ai-system/voice-commands/execute
      {voiceCommandSeq, recognizedText, matchedKeyword, matchScore}
      │
      └── VoiceCommandsService.executeCommand()
          ├── voiceCommand 조회 → spaceDeviceSeq, commandSeq
          ├── ControlService.execute() → TCP 9090 → IoT 컨트롤러
          └── tb_ai_command_log 저장
```

**기존 코드 위치:**
- `apps/api/src/modules/ai-system/voice-commands.service.ts` (line 153~217)
- `VoiceCommandsService.executeCommand()` — 이미 완성, 변경 없음

---

## 5. API 인터페이스

### 5-1. ku_wave_plat → ku_ai_pc (신규)

```http
### 녹음 시작 (ENTER 태깅 시)
POST http://{ai_pc_url}/ai/start
Content-Type: application/json

{
  "spaceSeq": 1,
  "tuSeq": 5,
  "callbackUrl": "http://운영서버IP/api/v1/ai-system/ai/callback",
  "wavePlatUrl": "http://운영서버IP/api/v1"
}

→ 200: { "status": "started", "sessionSeq": 42 }
```

```http
### 녹음 종료 (EXIT 태깅 시)
POST http://{ai_pc_url}/ai/stop
Content-Type: application/json

{ "spaceSeq": 1 }

→ 200: { "status": "stopped", "sessionSeq": 42, "filename": "...", "durationSec": 2700 }
```

### 5-2. ku_ai_pc → ku_wave_plat (기존 API, 변경 없음)

```http
# Session 생성
POST /api/v1/ai-system/speech-sessions

# STT 로그 (실시간 반복)
POST /api/v1/ai-system/speech-sessions/:seq/logs

# 음성 명령 실행 (Voice Detect 매칭 시)
POST /api/v1/ai-system/voice-commands/execute

# Session 종료
PATCH /api/v1/ai-system/speech-sessions/:seq/end
```

### 5-3. ku_ai_pc → ku_ai_worker (기존 API, 변경 없음)

```http
# 녹음 파일 청크 업로드
POST http://ku_ai_worker:9000/jobs
Content-Type: multipart/form-data
(audioFile + callbackUrl + sessionSeq)
```

### 5-4. ku_ai_worker → ku_wave_plat (기존 Callback, 변경 없음)

```http
# AI 결과 콜백
POST /api/v1/ai-system/ai/callback
X-Signature: HMAC-SHA256
{ jobId, status, result: { sttText, summaryText, keywords } }
```

---

## 6. 에러 처리 원칙

| 상황 | 처리 |
|------|------|
| ku_ai_pc URL 미설정 (aiPcUrl = NULL) | AI 연동 스킵, IoT만 실행 |
| ku_ai_pc 서버 다운 | 3초 타임아웃 → 에러 로그 → IoT 정상 반환 |
| ku_ai_pc 응답 오류 (4xx/5xx) | 에러 로그 → IoT 정상 반환 |
| 이미 녹음 중인데 ENTER 다시 태깅 | 쿨다운 30초로 방지 (기존 로직) |
| 녹음 안 하고 있는데 EXIT 태깅 | ku_ai_pc가 "not recording" 응답 → 무시 |
| 네트워크 단절 (ku_ai_pc ↔ ku_wave_plat) | ku_ai_pc Offline Queue로 STT 로그 재전송 |

---

## 7. 수정 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `apps/api/src/modules/nfc/services/nfc-tag.service.ts` | 수정 | Step 6-1 AI 연동 로직 추가 |
| `apps/api/src/modules/spaces/entities/tb-space.entity.ts` | 수정 | aiPcUrl 컬럼 매핑 (기존 컬럼 확인 필요) |
| `apps/api/src/modules/nfc/nfc.module.ts` | 수정 | HttpClientModule 또는 ofetch import (필요 시) |
| `docs/api/nfc-ai.http` | 신규 | NFC → AI 연동 테스트 시나리오 |

> ku_ai_pc, ku_ai_worker 코드는 이 문서 범위 밖. 각각 plan_ku_ai_pc.md 참조.
