# Recorder API (녹화기 관리 시스템)

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

> 녹화기관리 시스템은 5개 LNB 메뉴로 구성됩니다:
> - **녹화기 등록** (`/recorder/list`): 녹화기 CRUD + 사용자 배정
> - **녹화기 제어** (`/recorder/control`): PTZ/녹화 실시간 제어
> - **녹화 이력** (`/recorder/history`): 녹화 세션 이력 조회
> - **녹화파일 관리** (`/recorder/files`): FTP 파일 관리/다운로드
> - **FTP 설정** (`/recorder/ftp`): FTP 서버 설정 관리

---

# 1. 녹화기 CRUD

## GET /recorders

녹화기 목록 조회 (페이징 + 필터). 삭제된 녹화기(recorder_isdel='Y') 제외.
건물/공간 정보 JOIN 포함.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| buildingSeq | number | N | - | 건물 시퀀스 필터 |
| search | string | N | - | 통합 검색 (녹화기명, IP LIKE) |
| status | string | N | - | 상태 필터 (ONLINE/OFFLINE/ERROR) |

### Response (200)

```json
{
  "items": [
    {
      "no": 10,
      "recorderSeq": 1,
      "recorderName": "101호 녹화기",
      "recorderIp": "192.168.1.101",
      "recorderPort": 80,
      "recorderProtocol": "HTTP",
      "recorderModel": "SONY SRG-X120",
      "recorderStatus": "ONLINE",
      "lastHealthCheck": "2026-02-22T10:30:00.000Z",
      "buildingName": "공학관 A동",
      "spaceName": "101호",
      "spaceFloor": "1",
      "currentUserName": "김교수",
      "assignedUserCount": 3
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].recorderSeq | number | 녹화기 시퀀스 (PK) |
| items[].recorderName | string | 녹화기명 |
| items[].recorderIp | string | 고정 IP |
| items[].recorderPort | number | 통신 포트 |
| items[].recorderProtocol | string | 프로토콜 (HTTP/ONVIF/RTSP) |
| items[].recorderModel | string/null | 모델명 |
| items[].recorderStatus | string | 상태 (ONLINE/OFFLINE/ERROR) |
| items[].lastHealthCheck | string/null | 마지막 상태 확인 (ISO 8601) |
| items[].buildingName | string | 건물명 (JOIN) |
| items[].spaceName | string | 공간명 (JOIN) |
| items[].spaceFloor | string | 층 (JOIN) |
| items[].currentUserName | string/null | 현재 사용 중인 사용자 이름 |
| items[].assignedUserCount | number | 배정된 사용자 수 |

### 정렬

- `recorder_order ASC, recorder_name ASC`

---

## GET /recorders/:recorderSeq

녹화기 상세 조회 (배정된 사용자 목록 + 프리셋 목록 포함).

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| recorderSeq | number | 녹화기 시퀀스 |

### Response (200)

```json
{
  "recorderSeq": 1,
  "recorderName": "101호 녹화기",
  "recorderIp": "192.168.1.101",
  "recorderPort": 80,
  "recorderProtocol": "HTTP",
  "recorderUsername": "admin",
  "recorderModel": "SONY SRG-X120",
  "recorderStatus": "ONLINE",
  "lastHealthCheck": "2026-02-22T10:30:00.000Z",
  "recorderOrder": 1,
  "buildingSeq": 1,
  "buildingName": "공학관 A동",
  "spaceSeq": 1,
  "spaceName": "101호",
  "spaceFloor": "1",
  "currentUser": {
    "tuSeq": 5,
    "tuName": "김교수"
  },
  "assignedUsers": [
    {
      "recorderUserSeq": 1,
      "tuSeq": 5,
      "tuName": "김교수",
      "tuEmail": "kim@konkuk.ac.kr",
      "isDefault": "Y"
    },
    {
      "recorderUserSeq": 2,
      "tuSeq": 8,
      "tuName": "이교수",
      "tuEmail": "lee@konkuk.ac.kr",
      "isDefault": "N"
    }
  ],
  "presets": [
    {
      "recPresetSeq": 1,
      "presetName": "칠판 중심",
      "presetNumber": 1,
      "panValue": 0.0,
      "tiltValue": -15.0,
      "zoomValue": 2.0,
      "presetOrder": 1
    }
  ],
  "regDate": "2026-02-22T00:00:00.000Z",
  "updDate": "2026-02-22T10:30:00.000Z"
}
```

> **주의**: `recorderPassword`는 보안상 응답에 포함하지 않음

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |

---

## POST /recorders

녹화기 등록 (사용자 배정 포함, 원자적 처리).

### Request Body

```json
{
  "spaceSeq": 1,
  "recorderName": "101호 녹화기",
  "recorderIp": "192.168.1.101",
  "recorderPort": 80,
  "recorderProtocol": "HTTP",
  "recorderUsername": "admin",
  "recorderPassword": "password123",
  "recorderModel": "SONY SRG-X120",
  "recorderOrder": 1,
  "assignedUsers": [
    { "tuSeq": 5, "isDefault": "Y" },
    { "tuSeq": 8, "isDefault": "N" }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceSeq | number | Y | 공간 시퀀스 (호실) |
| recorderName | string | Y | 녹화기명 |
| recorderIp | string | Y | 고정 IP |
| recorderPort | number | N | 통신 포트 (기본 80) |
| recorderProtocol | string | N | 프로토콜 (HTTP/ONVIF/RTSP, 기본 HTTP) |
| recorderUsername | string | N | 녹화기 로그인 ID |
| recorderPassword | string | N | 녹화기 로그인 PW (AES 암호화 저장) |
| recorderModel | string | N | 모델명 |
| recorderOrder | number | N | 정렬 순서 (기본 0) |
| assignedUsers | array | N | 배정 사용자 배열 |
| assignedUsers[].tuSeq | number | Y | 사용자 시퀀스 |
| assignedUsers[].isDefault | string | N | 기본 사용자 여부 (Y/N, 기본 N) |

### Response (201)

등록된 녹화기 정보 (사용자 배정 포함) 반환.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간을 찾을 수 없습니다 |
| 409 | 해당 공간에 이미 녹화기가 등록되어 있습니다 (1:1 제약) |

---

## PUT /recorders/:recorderSeq

녹화기 수정 (사용자 배정 동기화 포함, 원자적 처리).

### Request Body

```json
{
  "recorderName": "101호 녹화기 (교체)",
  "recorderIp": "192.168.1.201",
  "recorderPort": 80,
  "recorderProtocol": "HTTP",
  "recorderUsername": "admin",
  "recorderPassword": "newpass456",
  "recorderModel": "SONY SRG-X400",
  "recorderOrder": 1,
  "assignedUsers": [
    { "tuSeq": 5, "isDefault": "Y" },
    { "tuSeq": 12, "isDefault": "N" }
  ]
}
```

> **사용자 동기화 규칙:**
> - `assignedUsers`에 포함된 사용자: 유지 또는 신규 배정
> - `assignedUsers`에 포함되지 않은 기존 사용자: soft delete
> - `spaceSeq`는 변경 불가 (공간 변경 시 삭제 후 재등록)

모든 필드 선택 사항 (보낸 필드만 수정됨). `recorderPassword`를 빈 값으로 보내면 기존 비밀번호 유지.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |

---

## DELETE /recorders/:recorderSeq

녹화기 삭제 (소프트 삭제, recorder_isdel='Y').

### Response (200)

```json
{
  "message": "녹화기가 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |

---

# 2. 녹화기 제어

## POST /recorders/:recorderSeq/control/ptz

PTZ 명령어 전송. 녹화기 HTTP API를 통해 Pan/Tilt/Zoom 제어.

### Request Body

```json
{
  "action": "move",
  "pan": 10.0,
  "tilt": -5.0,
  "zoom": 0
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| action | string | Y | PTZ 액션 (move/stop/home) |
| pan | number | N | Pan 이동값 (-100 ~ 100, move 시 필수) |
| tilt | number | N | Tilt 이동값 (-100 ~ 100, move 시 필수) |
| zoom | number | N | Zoom 이동값 (-100 ~ 100, move 시 필수) |

### Response (200)

```json
{
  "recLogSeq": 1,
  "resultStatus": "SUCCESS",
  "resultMessage": "PTZ 명령 전송 완료",
  "executedAt": "2026-02-22T10:30:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |
| 422 | 녹화기가 OFFLINE 상태입니다 |
| 504 | 녹화기 응답 시간 초과 (TIMEOUT) |

---

## POST /recorders/:recorderSeq/control/record/start

녹화 시작. 세션을 생성하고 녹화기에 녹화 시작 명령 전송.

### Request Body

```json
{
  "sessionTitle": "데이터구조론 3주차",
  "recPresetSeq": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sessionTitle | string | N | 강의명 / 메모 |
| recPresetSeq | number | N | 사용할 프리셋 시퀀스 (프리셋 적용 후 녹화 시작) |

### Response (200)

```json
{
  "recSessionSeq": 1,
  "recorderSeq": 1,
  "sessionStatus": "RECORDING",
  "sessionTitle": "데이터구조론 3주차",
  "startedAt": "2026-02-22T09:00:00.000Z",
  "message": "녹화가 시작되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |
| 409 | 이미 녹화 중입니다 (진행 중인 세션 존재) |
| 422 | 녹화기가 OFFLINE 상태입니다 |
| 504 | 녹화기 응답 시간 초과 |

---

## POST /recorders/:recorderSeq/control/record/stop

녹화 종료. 진행 중인 세션을 COMPLETED로 변경하고 녹화기에 종료 명령 전송.

### Request Body

없음 (현재 RECORDING 상태인 세션을 자동으로 찾아 종료)

### Response (200)

```json
{
  "recSessionSeq": 1,
  "sessionStatus": "COMPLETED",
  "startedAt": "2026-02-22T09:00:00.000Z",
  "endedAt": "2026-02-22T09:50:00.000Z",
  "durationSec": 3000,
  "message": "녹화가 종료되었습니다 (50분)"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |
| 404 | 진행 중인 녹화 세션이 없습니다 |
| 504 | 녹화기 응답 시간 초과 |

---

## POST /recorders/:recorderSeq/control/preset/:recPresetSeq

프리셋 적용. 녹화기에 저장된 PTZ 프리셋을 호출.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| recorderSeq | number | 녹화기 시퀀스 |
| recPresetSeq | number | 프리셋 시퀀스 |

### Response (200)

```json
{
  "recLogSeq": 5,
  "presetName": "칠판 중심",
  "presetNumber": 1,
  "resultStatus": "SUCCESS",
  "resultMessage": "프리셋 적용 완료",
  "executedAt": "2026-02-22T10:30:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기 또는 프리셋을 찾을 수 없습니다 |
| 422 | 녹화기가 OFFLINE 상태입니다 |
| 504 | 녹화기 응답 시간 초과 |

---

## GET /recorders/:recorderSeq/control/status

녹화기 실시간 상태 조회. 녹화기 API 직접 호출하여 현재 상태 반환.

### Response (200)

```json
{
  "recorderSeq": 1,
  "recorderName": "101호 녹화기",
  "recorderStatus": "ONLINE",
  "isRecording": true,
  "currentSession": {
    "recSessionSeq": 1,
    "sessionTitle": "데이터구조론 3주차",
    "startedAt": "2026-02-22T09:00:00.000Z",
    "elapsedSec": 1800
  },
  "currentUser": {
    "tuSeq": 5,
    "tuName": "김교수"
  },
  "lastHealthCheck": "2026-02-22T10:30:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| recorderStatus | string | ONLINE/OFFLINE/ERROR |
| isRecording | boolean | 현재 녹화 중 여부 |
| currentSession | object/null | 진행 중인 녹화 세션 (없으면 null) |
| currentUser | object/null | 현재 사용 중인 교수 (없으면 null) |

---

# 3. 프리셋 관리

## GET /recorders/:recorderSeq/presets

녹화기별 PTZ 프리셋 목록 조회.

### Response (200)

```json
{
  "recorderSeq": 1,
  "recorderName": "101호 녹화기",
  "presets": [
    {
      "recPresetSeq": 1,
      "presetName": "칠판 중심",
      "presetNumber": 1,
      "panValue": 0.0,
      "tiltValue": -15.0,
      "zoomValue": 2.0,
      "presetDescription": "칠판을 중심으로 촬영",
      "presetOrder": 1
    },
    {
      "recPresetSeq": 2,
      "presetName": "강단 전체",
      "presetNumber": 2,
      "panValue": 0.0,
      "tiltValue": 0.0,
      "zoomValue": 1.0,
      "presetDescription": "강단 전체 와이드 뷰",
      "presetOrder": 2
    }
  ]
}
```

---

## POST /recorders/:recorderSeq/presets

프리셋 등록.

### Request Body

```json
{
  "presetName": "칠판 중심",
  "presetNumber": 1,
  "panValue": 0.0,
  "tiltValue": -15.0,
  "zoomValue": 2.0,
  "presetDescription": "칠판을 중심으로 촬영",
  "presetOrder": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| presetName | string | Y | 프리셋명 |
| presetNumber | number | Y | 녹화기 내부 프리셋 번호 |
| panValue | number | N | Pan 값 |
| tiltValue | number | N | Tilt 값 |
| zoomValue | number | N | Zoom 값 |
| presetDescription | string | N | 설명 |
| presetOrder | number | N | 정렬 순서 (기본 0) |

### Response (201)

등록된 프리셋 정보 반환.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 녹화기를 찾을 수 없습니다 |
| 409 | 이미 같은 프리셋 번호가 존재합니다 |

---

## PUT /recorders/:recorderSeq/presets/:recPresetSeq

프리셋 수정. 모든 필드 선택 사항.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 프리셋을 찾을 수 없습니다 |
| 409 | 변경하려는 프리셋 번호가 이미 존재합니다 |

---

## DELETE /recorders/:recorderSeq/presets/:recPresetSeq

프리셋 삭제 (소프트 삭제).

### Response (200)

```json
{
  "message": "프리셋이 삭제되었습니다"
}
```

---

# 4. 녹화 세션 / 파일

## GET /recordings/sessions

녹화 세션 이력 조회 (페이징 + 필터).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 20 | 페이지당 항목 수 |
| buildingSeq | number | N | - | 건물 필터 |
| recorderSeq | number | N | - | 녹화기 필터 |
| tuSeq | number | N | - | 사용자 필터 |
| status | string | N | - | 상태 필터 (RECORDING/COMPLETED/FAILED/CANCELLED) |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |

### Response (200)

```json
{
  "items": [
    {
      "no": 50,
      "recSessionSeq": 1,
      "recorderName": "101호 녹화기",
      "buildingName": "공학관 A동",
      "spaceName": "101호",
      "sessionTitle": "데이터구조론 3주차",
      "userName": "김교수",
      "sessionStatus": "COMPLETED",
      "startedAt": "2026-02-22T09:00:00.000Z",
      "endedAt": "2026-02-22T09:50:00.000Z",
      "durationSec": 3000,
      "fileCount": 1,
      "presetName": "칠판 중심"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### 정렬

- `started_at DESC` (최신순)

---

## GET /recordings/sessions/:recSessionSeq

녹화 세션 상세 조회 (파일 목록 포함).

### Response (200)

```json
{
  "recSessionSeq": 1,
  "recorderSeq": 1,
  "recorderName": "101호 녹화기",
  "buildingName": "공학관 A동",
  "spaceName": "101호",
  "sessionTitle": "데이터구조론 3주차",
  "userName": "김교수",
  "sessionStatus": "COMPLETED",
  "presetName": "칠판 중심",
  "startedAt": "2026-02-22T09:00:00.000Z",
  "endedAt": "2026-02-22T09:50:00.000Z",
  "durationSec": 3000,
  "files": [
    {
      "recFileSeq": 1,
      "fileName": "rec_20260222_090000.mp4",
      "filePath": "/recordings/2026/02/22/",
      "fileSize": 1288490188,
      "fileFormat": "mp4",
      "fileDurationSec": 3000,
      "ftpStatus": "COMPLETED",
      "ftpUploadedPath": "/recordings/2026/02/22/rec_20260222_090000.mp4",
      "ftpUploadedAt": "2026-02-22T09:55:00.000Z",
      "ftpRetryCount": 0
    }
  ]
}
```

---

## GET /recordings/files

녹화 파일 목록 조회 (페이징 + 필터).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 20 | 페이지당 항목 수 |
| buildingSeq | number | N | - | 건물 필터 |
| ftpStatus | string | N | - | FTP 상태 필터 (PENDING/UPLOADING/COMPLETED/FAILED/RETRY) |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |

### Response (200)

```json
{
  "items": [
    {
      "no": 100,
      "recFileSeq": 1,
      "fileName": "rec_20260222_090000.mp4",
      "fileSize": 1288490188,
      "fileSizeFormatted": "1.2 GB",
      "fileFormat": "mp4",
      "fileDurationSec": 3000,
      "ftpStatus": "COMPLETED",
      "ftpUploadedAt": "2026-02-22T09:55:00.000Z",
      "ftpRetryCount": 0,
      "ftpErrorMessage": null,
      "sessionTitle": "데이터구조론 3주차",
      "userName": "김교수",
      "buildingName": "공학관 A동",
      "spaceName": "101호",
      "regDate": "2026-02-22T09:50:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 정렬

- `reg_date DESC` (최신순)

---

## GET /recordings/files/:recFileSeq/download

녹화 파일 다운로드. BE가 FTP에서 스트림으로 읽어 클라이언트로 pipe.

### Response (200)

- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="rec_20260222_090000.mp4"`
- Body: 파일 바이너리 스트림

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 파일을 찾을 수 없습니다 |
| 404 | FTP 서버에서 파일을 찾을 수 없습니다 |
| 502 | FTP 서버 연결 실패 |

---

## POST /recordings/files/:recFileSeq/retry-upload

FTP 업로드 재시도. FAILED 또는 RETRY 상태인 파일만 재시도 가능.

### Response (200)

```json
{
  "recFileSeq": 2,
  "ftpStatus": "UPLOADING",
  "ftpRetryCount": 2,
  "message": "FTP 업로드 재시도를 시작합니다 (2/3회)"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 파일을 찾을 수 없습니다 |
| 409 | 이미 업로드 완료된 파일입니다 |
| 409 | 최대 재시도 횟수(3회)를 초과했습니다 |

---

# 5. FTP 설정

## GET /ftp-configs

FTP 설정 목록 조회. 삭제된 설정(ftp_isdel='Y') 제외.

### Response (200)

```json
{
  "items": [
    {
      "ftpConfigSeq": 1,
      "ftpName": "기본 FTP 서버",
      "ftpHost": "ftp.konkuk.ac.kr",
      "ftpPort": 21,
      "ftpProtocol": "FTP",
      "ftpPath": "/recordings/",
      "ftpPassiveMode": "Y",
      "isDefault": "Y",
      "recorderSeq": null,
      "recorderName": null,
      "regDate": "2026-02-22T00:00:00.000Z"
    },
    {
      "ftpConfigSeq": 2,
      "ftpName": "101호 전용",
      "ftpHost": "10.0.1.100",
      "ftpPort": 22,
      "ftpProtocol": "SFTP",
      "ftpPath": "/101/",
      "ftpPassiveMode": "N",
      "isDefault": "N",
      "recorderSeq": 1,
      "recorderName": "101호 녹화기",
      "regDate": "2026-02-22T00:00:00.000Z"
    }
  ]
}
```

> 페이징 없이 전체 목록 반환 (FTP 설정은 소수)

---

## POST /ftp-configs

FTP 설정 등록.

### Request Body

```json
{
  "ftpName": "기본 FTP 서버",
  "ftpHost": "ftp.konkuk.ac.kr",
  "ftpPort": 21,
  "ftpUsername": "recorder_user",
  "ftpPassword": "ftp_password",
  "ftpPath": "/recordings/",
  "ftpProtocol": "FTP",
  "ftpPassiveMode": "Y",
  "isDefault": "Y",
  "recorderSeq": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ftpName | string | Y | 설정명 |
| ftpHost | string | Y | FTP 호스트 |
| ftpPort | number | N | FTP 포트 (기본 21) |
| ftpUsername | string | Y | FTP 계정 |
| ftpPassword | string | Y | FTP 비밀번호 (AES 암호화 저장) |
| ftpPath | string | N | 업로드 기본 경로 (기본 /) |
| ftpProtocol | string | N | 프로토콜 (FTP/SFTP/FTPS, 기본 FTP) |
| ftpPassiveMode | string | N | 패시브 모드 (Y/N, 기본 Y) |
| isDefault | string | N | 기본 설정 여부 (Y/N, 기본 N) |
| recorderSeq | number | N | 연결할 녹화기 (null이면 글로벌 설정) |

### Response (201)

등록된 FTP 설정 정보 반환 (비밀번호 제외).

---

## PUT /ftp-configs/:ftpConfigSeq

FTP 설정 수정. 모든 필드 선택 사항. `ftpPassword`를 빈 값으로 보내면 기존 비밀번호 유지.

---

## DELETE /ftp-configs/:ftpConfigSeq

FTP 설정 삭제 (소프트 삭제).

### Response (200)

```json
{
  "message": "FTP 설정이 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 FTP 설정을 찾을 수 없습니다 |
| 409 | 이 FTP 설정을 사용 중인 파일이 있어 삭제할 수 없습니다 |

---

## POST /ftp-configs/:ftpConfigSeq/test

FTP 연결 테스트. 설정 정보로 FTP 서버에 접속 시도 후 결과 반환.

> **구현 패키지**: `basic-ftp` (FTP/FTPS), `ssh2-sftp-client` (SFTP)
> - FTP/FTPS: 10초 타임아웃, FTPS 시 self-signed 인증서 허용
> - SFTP: 10초 readyTimeout
> - 연결 성공 시 설정된 경로(`ftpPath`)에 대한 `list()` 검증까지 수행

### Response (200) - 성공

```json
{
  "result": "SUCCESS",
  "message": "FTP 연결 성공",
  "serverInfo": "220 FTP Server ready",
  "testedAt": "2026-02-22T10:30:00.000Z"
}
```

### Response (200) - 실패

```json
{
  "result": "FAIL",
  "message": "FTP 연결 실패: Connection refused",
  "testedAt": "2026-02-22T10:30:00.000Z"
}
```

---

# 6. 녹화기 로그

## GET /recorders/:recorderSeq/logs

녹화기 명령 실행 로그 조회 (페이징).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 20 | 페이지당 항목 수 |
| logType | string | N | - | 유형 필터 (PTZ/REC_START/REC_STOP/PRESET_APPLY/STATUS_CHECK/POWER) |
| resultStatus | string | N | - | 결과 필터 (SUCCESS/FAIL/TIMEOUT) |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |

### Response (200)

```json
{
  "items": [
    {
      "no": 200,
      "recLogSeq": 1,
      "logType": "REC_START",
      "commandDetail": "{\"sessionTitle\":\"데이터구조론 3주차\"}",
      "resultStatus": "SUCCESS",
      "resultMessage": "녹화 시작 완료",
      "executedBy": "김교수",
      "executedAt": "2026-02-22T09:00:00.000Z"
    }
  ],
  "total": 200,
  "page": 1,
  "limit": 20,
  "totalPages": 10
}
```

### 정렬

- `executed_at DESC` (최신순)
