# AI System API (AI 시스템)

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

> AI시스템은 2개 LNB 메뉴로 구성됩니다:
> - **강의요약** (`/ai-system/lecture-summary`): 강의 녹음 STT + 요약 결과 관리
> - **실시간 음성인식** (`/ai-system/speech`): 음성인식 세션/명령어 관리

> 호출 주체:
> - **Console**: 관리자 콘솔 (Next.js) - 조회/관리 기능
> - **MiniPC**: 강의실 미니PC Python 클라이언트 - 세션/로그/Voice Detect
> - **ku_ai_worker**: AI GPU 서버 - Callback 결과 전송

> 통신 흐름:
> ```
> ① miniPC → ku_wave_plat : Voice Detect (장비 제어), 로그/세션 저장
> ② miniPC → ku_ai_worker : .wav 청크 업로드 (직접, ku_wave_plat 미경유)
> ③ ku_ai_worker → ku_wave_plat : AI 처리 결과 Callback
> ```

---

# 1. 강의요약 (Lecture Summary)

## GET /ai-system/lecture-summaries

강의요약 목록 조회 (페이징 + 필터). 삭제된 항목(summary_isdel='Y') 제외.
공간/건물/강의자 정보 JOIN 포함.

### 호출자: Console

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| spaceSeq | number | N | - | 공간 시퀀스 필터 |
| buildingSeq | number | N | - | 건물 시퀀스 필터 |
| processStatus | string | N | - | 상태 필터 (UPLOADING/PROCESSING/COMPLETED/FAILED) |
| search | string | N | - | 통합 검색 (강의제목, 파일명, 키워드 LIKE) |
| startDate | string | N | - | 녹음일 시작 (YYYY-MM-DD) |
| endDate | string | N | - | 녹음일 종료 (YYYY-MM-DD) |

### Response (200)

```json
{
  "items": [
    {
      "no": 10,
      "summarySeq": 1,
      "buildingName": "공학관 A동",
      "spaceName": "101호",
      "spaceFloor": "1",
      "userName": "김교수",
      "deviceCode": "PC-101",
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "recordingTitle": "데이터구조 3주차",
      "recordingFilename": "20260223001.wav",
      "durationSeconds": 5400,
      "durationFormatted": "1시간 30분",
      "recordedAt": "2026-02-23T09:00:00.000Z",
      "processStatus": "COMPLETED",
      "summaryKeywords": ["데이터구조", "연결리스트", "트리"],
      "completedAt": "2026-02-23T11:30:00.000Z",
      "regDate": "2026-02-23T09:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 정렬

- `recorded_at DESC, reg_date DESC`

---

## GET /ai-system/lecture-summaries/:summarySeq

강의요약 상세 조회. STT 전문 + 요약문 포함.

### 호출자: Console

### Response (200)

```json
{
  "summarySeq": 1,
  "spaceSeq": 1,
  "buildingName": "공학관 A동",
  "spaceName": "101호",
  "spaceFloor": "1",
  "tuSeq": 5,
  "userName": "김교수",
  "deviceCode": "PC-101",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "recordingTitle": "데이터구조 3주차",
  "recordingFilename": "20260223001.wav",
  "durationSeconds": 5400,
  "durationFormatted": "1시간 30분",
  "recordedAt": "2026-02-23T09:00:00.000Z",
  "sttText": "오늘 강의에서는 데이터구조의 기본 개념을 다루겠습니다...",
  "sttLanguage": "ko",
  "sttConfidence": 0.92,
  "summaryText": "본 강의는 데이터구조의 기본 개념을 다루며, 연결리스트와 트리 구조의 특성을 설명합니다...",
  "summaryKeywords": ["데이터구조", "연결리스트", "트리"],
  "processStatus": "COMPLETED",
  "completedAt": "2026-02-23T11:30:00.000Z",
  "sessionSeq": 10,
  "regDate": "2026-02-23T09:00:00.000Z",
  "updDate": "2026-02-23T11:30:00.000Z"
}
```

---

## POST /ai-system/lecture-summaries

강의요약 레코드 생성. 미니PC가 강의종료 후 업로드 시작 시 호출.

### 호출자: MiniPC

### Request Body

```json
{
  "spaceSeq": 1,
  "tuSeq": 5,
  "deviceCode": "PC-101",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "recordingTitle": "데이터구조 3주차",
  "recordingFilename": "20260223001.wav",
  "durationSeconds": 5400,
  "recordedAt": "2026-02-23T09:00:00"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceSeq | number | Y | 공간 시퀀스 |
| tuSeq | number | N | 강의자 시퀀스 |
| deviceCode | string | Y | 미니PC 식별자 |
| jobId | string | Y | ku_ai_worker Job UUID |
| recordingTitle | string | N | 강의 제목 |
| recordingFilename | string | Y | 원본 파일명 |
| durationSeconds | number | N | 녹음 길이 (초) |
| recordedAt | string | N | 녹음 시각 (ISO 8601) |

### Response (201)

```json
{
  "summarySeq": 1,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "processStatus": "UPLOADING",
  "message": "강의요약 레코드가 생성되었습니다."
}
```

---

## PUT /ai-system/lecture-summaries/:summarySeq/status

강의요약 상태 변경. 미니PC가 업로드 완료 후 PROCESSING으로 변경.

### 호출자: MiniPC

### Request Body

```json
{
  "processStatus": "PROCESSING"
}
```

### Response (200)

```json
{
  "summarySeq": 1,
  "processStatus": "PROCESSING",
  "message": "상태가 변경되었습니다."
}
```

---

## PUT /ai-system/lecture-summaries/:summarySeq/result

강의요약 결과 저장. 미니PC가 ku_ai_worker callback 수신 후 호출.

### 호출자: MiniPC

### Request Body

```json
{
  "sttText": "오늘 강의에서는 데이터구조의...",
  "sttLanguage": "ko",
  "sttConfidence": 0.92,
  "summaryText": "본 강의는 데이터구조의 기본 개념을 다루며...",
  "summaryKeywords": ["데이터구조", "연결리스트", "트리"],
  "completedAt": "2026-02-23T11:30:00",
  "sessionSeq": 10
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sttText | string | Y | STT 전체 텍스트 |
| sttLanguage | string | N | 감지 언어 |
| sttConfidence | number | N | STT 신뢰도 (0~1) |
| summaryText | string | Y | 요약 텍스트 |
| summaryKeywords | string[] | N | 키워드 배열 |
| completedAt | string | Y | 처리 완료 시각 |
| sessionSeq | number | N | 연결된 음성인식 세션 시퀀스 |

### Response (200)

```json
{
  "summarySeq": 1,
  "processStatus": "COMPLETED",
  "message": "강의요약 결과가 저장되었습니다."
}
```

---

# 2. 음성인식 세션 (Speech Session)

## GET /ai-system/speech-sessions

음성인식 세션 목록 조회.

### 호출자: Console

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 10 | 페이지당 항목 수 |
| spaceSeq | number | N | - | 공간 필터 |
| sessionStatus | string | N | - | 상태 필터 (ACTIVE/PAUSED/ENDED) |
| startDate | string | N | - | 시작일 필터 |
| endDate | string | N | - | 종료일 필터 |

### Response (200)

```json
{
  "items": [
    {
      "no": 1,
      "sessionSeq": 10,
      "buildingName": "공학관 A동",
      "spaceName": "101호",
      "userName": "김교수",
      "sessionStatus": "ENDED",
      "sttEngine": "faster-whisper",
      "sttModel": "small",
      "startedAt": "2026-02-23T09:00:00.000Z",
      "endedAt": "2026-02-23T10:30:00.000Z",
      "totalDurationSec": 5400,
      "totalSegments": 320,
      "totalCommands": 5,
      "recordingFilename": "20260223001.wav"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## GET /ai-system/speech-sessions/:sessionSeq

세션 상세 조회. STT 로그 + 명령 실행 로그 포함.

### 호출자: Console

### Response (200)

```json
{
  "sessionSeq": 10,
  "spaceSeq": 1,
  "buildingName": "공학관 A동",
  "spaceName": "101호",
  "tuSeq": 5,
  "userName": "김교수",
  "sessionStatus": "ENDED",
  "sttEngine": "faster-whisper",
  "sttModel": "small",
  "startedAt": "2026-02-23T09:00:00.000Z",
  "endedAt": "2026-02-23T10:30:00.000Z",
  "totalDurationSec": 5400,
  "totalSegments": 320,
  "totalCommands": 5,
  "recordingFilename": "20260223001.wav",
  "summarySeq": 1,
  "logs": [
    {
      "speechLogSeq": 1,
      "segmentText": "오늘 강의에서는",
      "segmentStartSec": 0.0,
      "segmentEndSec": 2.5,
      "confidence": 0.95,
      "isCommand": "N",
      "createdAt": "2026-02-23T09:00:02.000Z"
    }
  ],
  "commandLogs": [
    {
      "commandLogSeq": 1,
      "sessionSeq": 10,
      "voiceCommandSeq": 3,
      "recognizedText": "스크린 올려",
      "matchedKeyword": "스크린 올려",
      "matchScore": 0.97,
      "verifySource": "LOCAL_VOSK",
      "executionStatus": "EXECUTED",
      "executionResult": "{\"deviceName\":\"스크린\",\"action\":\"UP\"}",
      "createdAt": "2026-02-23T09:15:30.000Z"
    }
  ]
}
```

---

## POST /ai-system/speech-sessions

음성인식 세션 생성. 미니PC가 강의시작 시 호출.

### 호출자: MiniPC

### Request Body

```json
{
  "spaceSeq": 1,
  "tuSeq": 5,
  "sttEngine": "faster-whisper",
  "sttModel": "small",
  "recordingFilename": "20260223001.wav"
}
```

### Response (201)

```json
{
  "sessionSeq": 10,
  "sessionStatus": "ACTIVE",
  "startedAt": "2026-02-23T09:00:00.000Z",
  "message": "음성인식 세션이 시작되었습니다."
}
```

---

## PUT /ai-system/speech-sessions/:sessionSeq/end

음성인식 세션 종료. 미니PC가 강의종료 시 호출.

### 호출자: MiniPC

### Request Body

```json
{
  "totalDurationSec": 5400,
  "totalSegments": 320,
  "totalCommands": 5,
  "summarySeq": 1
}
```

### Response (200)

```json
{
  "sessionSeq": 10,
  "sessionStatus": "ENDED",
  "endedAt": "2026-02-23T10:30:00.000Z",
  "message": "세션이 종료되었습니다."
}
```

---

## POST /ai-system/speech-logs

STT 로그 저장 (벌크). 미니PC가 실시간 STT 결과 전송.

### 호출자: MiniPC

### Request Body

```json
{
  "sessionSeq": 10,
  "segmentText": "데이터구조의 기본 개념을 살펴보겠습니다",
  "segmentStartSec": 120.5,
  "segmentEndSec": 125.3,
  "confidence": 0.93,
  "isCommand": "N"
}
```

### Response (201)

```json
{
  "speechLogSeq": 150,
  "message": "로그가 저장되었습니다."
}
```

---

## POST /ai-system/commands/execute

Voice Detect 장비 제어 실행. miniPC가 음성명령 감지 시 호출.
ku_wave_plat이 장비 제어를 실행하고 command_log를 자동 저장합니다.

### 호출자: MiniPC (Voice Detect)

### Request Body

```json
{
  "sessionSeq": 10,
  "voiceCommandSeq": 3,
  "recognizedText": "스크린 올려",
  "matchedKeyword": "스크린 올려",
  "matchScore": 0.97,
  "verifySource": "LOCAL_WHISPER"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sessionSeq | number | Y | 현재 음성인식 세션 시퀀스 |
| voiceCommandSeq | number | Y | 매칭된 음성 명령어 시퀀스 (tb_ai_voice_command) |
| recognizedText | string | Y | STT 인식 원문 텍스트 |
| matchedKeyword | string | Y | 매칭된 키워드 |
| matchScore | number | Y | 매칭 신뢰도 (0~1) |
| verifySource | string | N | 검증 소스 (LOCAL_WHISPER / LOCAL_VOSK) |

### Response (200)

```json
{
  "success": true,
  "commandLogSeq": 5,
  "executionStatus": "EXECUTED",
  "executionResult": {
    "deviceName": "전동스크린",
    "action": "UP",
    "deviceResponse": "OK"
  },
  "message": "장비 제어가 실행되었습니다."
}
```

### 처리 로직

1. `voiceCommandSeq`로 `tb_ai_voice_command` 조회
2. 연결된 `space_device_seq` + `command_seq`로 장비 제어 실행
3. `tb_ai_command_log`에 실행 결과 자동 저장
4. 실행 결과 응답

### 실패 응답 (장비 제어 실패)

```json
{
  "success": false,
  "commandLogSeq": 6,
  "executionStatus": "FAILED",
  "executionResult": {
    "deviceName": "전동스크린",
    "action": "UP",
    "error": "DEVICE_TIMEOUT"
  },
  "message": "장비 제어에 실패했습니다."
}
```

> 참고: 장비 제어 실패 시에도 command_log는 저장됩니다 (executionStatus: FAILED).

---

## POST /ai-system/command-logs

음성 명령 실행 로그 수동 저장. (보조용 - commands/execute 사용 권장)

### 호출자: MiniPC

### Request Body

```json
{
  "sessionSeq": 10,
  "recognizedText": "스크린 올려",
  "matchedKeyword": "스크린 올려",
  "matchScore": 0.97,
  "voiceCommandSeq": 3,
  "verifySource": "LOCAL_VOSK",
  "executionStatus": "EXECUTED",
  "executionResult": "{\"deviceName\":\"스크린\",\"action\":\"UP\"}"
}
```

### Response (201)

```json
{
  "commandLogSeq": 5,
  "message": "명령 로그가 저장되었습니다."
}
```

---

# 3. 음성 명령어 관리 (Voice Command)

## GET /ai-system/voice-commands

음성 명령어 목록 조회. 공간별 필터 지원.

### 호출자: Console, MiniPC

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| spaceSeq | number | N | - | 공간 시퀀스 필터 |
| search | string | N | - | 키워드 검색 |

### Response (200)

```json
{
  "items": [
    {
      "voiceCommandSeq": 3,
      "spaceSeq": 1,
      "spaceName": "101호",
      "keyword": "스크린 올려",
      "keywordAliases": ["화면 올려", "스크린 업"],
      "spaceDeviceSeq": 10,
      "deviceName": "전동스크린",
      "commandSeq": 5,
      "commandName": "스크린 UP",
      "minConfidence": 0.85,
      "commandPriority": 0,
      "regDate": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

> 참고: 페이징 없음. 공간당 명령어 수가 적으므로 전체 반환.

---

## POST /ai-system/voice-commands

음성 명령어 추가.

### 호출자: Console

### Request Body

```json
{
  "spaceSeq": 1,
  "keyword": "스크린 올려",
  "keywordAliases": ["화면 올려", "스크린 업"],
  "spaceDeviceSeq": 10,
  "commandSeq": 5,
  "minConfidence": 0.85
}
```

### Response (201)

```json
{
  "voiceCommandSeq": 3,
  "message": "음성 명령어가 등록되었습니다."
}
```

---

## PUT /ai-system/voice-commands/:voiceCommandSeq

음성 명령어 수정.

### 호출자: Console

### Request Body

```json
{
  "keyword": "스크린 올려줘",
  "keywordAliases": ["화면 올려", "스크린 업", "스크린 올려"],
  "minConfidence": 0.80
}
```

### Response (200)

```json
{
  "voiceCommandSeq": 3,
  "message": "음성 명령어가 수정되었습니다."
}
```

---

## DELETE /ai-system/voice-commands/:voiceCommandSeq

음성 명령어 삭제 (Soft Delete).

### 호출자: Console

### Response (200)

```json
{
  "voiceCommandSeq": 3,
  "message": "음성 명령어가 삭제되었습니다."
}
```

---

# 4. AI Worker 서버 관리

## GET /ai-system/worker-servers

Worker 서버 목록 조회.

### 호출자: Console

### Response (200)

```json
{
  "items": [
    {
      "workerServerSeq": 1,
      "serverName": "GPU서버-1호",
      "serverUrl": "http://10.0.1.50:8080",
      "serverStatus": "ONLINE",
      "lastHealthCheck": "2026-02-23T10:00:00.000Z",
      "gpuInfo": "RTX 4070 12GB",
      "maxConcurrentJobs": 1,
      "defaultSttModel": "large-v3",
      "defaultLlmModel": "llama3",
      "regDate": "2026-02-20T10:00:00.000Z"
    }
  ]
}
```

---

## POST /ai-system/worker-servers

Worker 서버 등록.

### 호출자: Console

### Request Body

```json
{
  "serverName": "GPU서버-1호",
  "serverUrl": "http://10.0.1.50:8080",
  "apiKey": "wk-xxxxxxxxxxxxxxxxxxxxxxxx",
  "callbackSecret": "cs-xxxxxxxx",
  "gpuInfo": "RTX 4070 12GB",
  "maxConcurrentJobs": 1,
  "defaultSttModel": "large-v3",
  "defaultLlmModel": "llama3"
}
```

### Response (201)

```json
{
  "workerServerSeq": 1,
  "message": "Worker 서버가 등록되었습니다."
}
```

---

## PUT /ai-system/worker-servers/:workerServerSeq

Worker 서버 수정.

### 호출자: Console

---

## DELETE /ai-system/worker-servers/:workerServerSeq

Worker 서버 삭제 (Soft Delete).

### 호출자: Console

---

## GET /ai-system/worker-servers/:workerServerSeq/health

Worker 서버 헬스체크 (Proxy). NestJS가 ku_ai_worker의 `/api/health`를 중계.

### 호출자: Console

### Response (200)

```json
{
  "serverStatus": "ONLINE",
  "gpuUsage": 45.2,
  "memoryUsage": 60.1,
  "activeJobs": 1,
  "queuedJobs": 3,
  "uptime": 86400
}
```

---

# 5. AI Callback (ku_ai_worker → ku_wave_plat)

## POST /ai-system/ai/callback

AI 처리 결과 Callback 수신. ku_ai_worker가 STT + 요약 처리 완료 시 호출.
miniPC가 업로드할 때 전달한 `callback_url`로 ku_ai_worker가 POST 합니다.

### 호출자: ku_ai_worker

### 인증 방식

JWT Bearer 토큰 대신 **callback_secret 서명 검증 (HMAC-SHA256)** 사용.

```
Headers:
  Content-Type: application/json
  X-Callback-Signature: sha256=HMAC(callback_secret, request_body)
```

### Request Body

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadId": "upload-uuid-here",
  "status": "COMPLETED",
  "result": {
    "sttText": "오늘 강의에서는 데이터구조의 기본 개념을 다루겠습니다. 먼저 연결리스트부터...",
    "sttLanguage": "ko",
    "sttConfidence": 0.95,
    "sttSegments": [
      { "start": 0.0, "end": 5.2, "text": "오늘 강의에서는" },
      { "start": 5.2, "end": 10.1, "text": "데이터구조의 기본 개념을 다루겠습니다" }
    ],
    "sttProcessingTimeMs": 180000,
    "summaryText": "본 강의는 데이터구조의 기본 개념을 다루며, 연결리스트와 트리 구조의 특성을 설명합니다...",
    "summaryKeywords": ["데이터구조", "연결리스트", "트리", "정렬"],
    "summaryProcessingTimeMs": 30000
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| jobId | string | Y | ku_ai_worker Job UUID |
| uploadId | string | Y | 업로드 UUID |
| status | string | Y | 처리 결과 (COMPLETED / FAILED) |
| result | object | N | 처리 결과 (COMPLETED일 때) |
| result.sttText | string | Y | STT 전체 텍스트 |
| result.sttLanguage | string | N | 감지 언어 (ko, en 등) |
| result.sttConfidence | number | N | STT 신뢰도 (0~1) |
| result.sttSegments | array | N | 구간별 STT 결과 |
| result.sttProcessingTimeMs | number | N | STT 처리 시간 (ms) |
| result.summaryText | string | Y | 요약 텍스트 |
| result.summaryKeywords | string[] | N | 키워드 배열 |
| result.summaryProcessingTimeMs | number | N | 요약 처리 시간 (ms) |

### 처리 로직

1. `X-Callback-Signature` 헤더로 HMAC 검증 (tb_ai_worker_server.callback_secret 사용)
2. `jobId`로 `tb_ai_lecture_summary` 레코드 조회
3. STT 결과 + 요약 결과 저장
4. `process_status` → `COMPLETED` (또는 `FAILED`)
5. `completed_at` 기록

### Response (200) - 성공

```json
{
  "received": true,
  "summarySeq": 1,
  "processStatus": "COMPLETED",
  "message": "결과가 저장되었습니다."
}
```

### Response (200) - 실패 결과 수신

```json
// ku_ai_worker가 처리 실패를 알릴 때
// Request Body:
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "uploadId": "upload-uuid-here",
  "status": "FAILED",
  "errorCode": "STT_TIMEOUT",
  "errorMessage": "Whisper 처리 시간 초과 (30분 타임아웃)"
}

// Response:
{
  "received": true,
  "summarySeq": 1,
  "processStatus": "FAILED",
  "message": "실패 상태가 기록되었습니다."
}
```

### 에러 응답

| 상태 | 설명 |
|------|------|
| 401 | 서명 검증 실패 (callback_secret 불일치) |
| 404 | jobId에 해당하는 lecture_summary 레코드 없음 |
| 409 | 이미 COMPLETED 상태 (중복 Callback 방지) |

> 참고: 이 엔드포인트는 JWT 인증이 아닌 HMAC 서명 인증을 사용합니다.
> JwtAuthGuard에서 이 경로를 제외(@Public 데코레이터)하고, 별도의 CallbackGuard로 보호합니다.
