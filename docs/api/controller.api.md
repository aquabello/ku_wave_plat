# Controller API (컨트롤러 시스템)

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

> 컨트롤러 시스템은 2개 메뉴로 구성됩니다:
> - **하드웨어 설정** (`/controller/hardware`): 프리셋 템플릿 관리 (장비 유형 + 명령어 정의)
> - **제어관리** (`/controller/control`): 공간 중심 통합 화면 (장비등록 + 장비제어 + 로그)

---

# 1. 프리셋 관리 (하드웨어 설정)

## GET /controller/presets

프리셋 목록 조회 (페이징 + 검색). 삭제된 프리셋(preset_isdel='Y') 제외.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (프리셋명 LIKE) |
| protocol | string | N | - | 프로토콜 필터 (TCP, UDP, WOL, HTTP, RS232) |

### Response (200)

```json
{
  "items": [
    {
      "no": 3,
      "presetSeq": 1,
      "presetName": "강의실 프로젝터",
      "protocolType": "TCP",
      "defaultPort": 4001,
      "presetDescription": "엡손 EB-X51 프로젝터",
      "commandCount": 3,
      "deviceCount": 12,
      "presetOrder": 1
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].presetSeq | number | 프리셋 시퀀스 (PK) |
| items[].presetName | string | 프리셋명 |
| items[].protocolType | string | 프로토콜 (TCP/UDP/WOL/HTTP/RS232) |
| items[].defaultPort | number/null | 기본 통신 포트 |
| items[].presetDescription | string/null | 프리셋 설명 |
| items[].commandCount | number | 등록된 명령어 수 |
| items[].deviceCount | number | 이 프리셋을 사용하는 장비 수 |
| items[].presetOrder | number | 정렬 순서 |

### 정렬

- `preset_order ASC, preset_name ASC`

---

## GET /controller/presets/:presetSeq

프리셋 상세 조회 (명령어 목록 포함).

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| presetSeq | number | 프리셋 시퀀스 |

### Response (200)

```json
{
  "presetSeq": 1,
  "presetName": "강의실 프로젝터",
  "protocolType": "TCP",
  "defaultPort": 4001,
  "presetDescription": "엡손 EB-X51 프로젝터",
  "presetOrder": 1,
  "presetIsdel": "N",
  "regDate": "2026-02-09T00:00:00.000Z",
  "updDate": "2026-02-09T09:00:00.000Z",
  "commands": [
    {
      "commandSeq": 1,
      "commandName": "전원 ON",
      "commandCode": "PWR ON\\r",
      "commandType": "POWER_ON",
      "commandOrder": 1
    },
    {
      "commandSeq": 2,
      "commandName": "전원 OFF",
      "commandCode": "PWR OFF\\r",
      "commandType": "POWER_OFF",
      "commandOrder": 2
    }
  ]
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 프리셋을 찾을 수 없습니다 |

---

## POST /controller/presets

프리셋 등록 (명령어 포함, 원자적 처리).

### Request Body

```json
{
  "presetName": "강의실 프로젝터",
  "protocolType": "TCP",
  "defaultPort": 4001,
  "presetDescription": "엡손 EB-X51 프로젝터",
  "presetOrder": 1,
  "commands": [
    {
      "commandName": "전원 ON",
      "commandCode": "PWR ON\\r",
      "commandType": "POWER_ON",
      "commandOrder": 1
    },
    {
      "commandName": "전원 OFF",
      "commandCode": "PWR OFF\\r",
      "commandType": "POWER_OFF",
      "commandOrder": 2
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| presetName | string | Y | 프리셋명 |
| protocolType | string | Y | 프로토콜 (TCP/UDP/WOL/HTTP/RS232) |
| defaultPort | number | N | 기본 통신 포트 (장비 등록 시 자동 채움) |
| presetDescription | string | N | 프리셋 설명 |
| presetOrder | number | N | 정렬 순서 (기본 0) |
| commands | array | N | 명령어 배열 |
| commands[].commandName | string | Y | 명령어명 |
| commands[].commandCode | string | Y | 명령어 코드 (HEX 또는 텍스트) |
| commands[].commandType | string | N | 유형 (POWER_ON/POWER_OFF/INPUT_CHANGE/CUSTOM, 기본 CUSTOM) |
| commands[].commandOrder | number | N | 정렬 순서 (기본 0) |

### Response (201)

등록된 프리셋 정보 (명령어 포함) 반환.

---

## PUT /controller/presets/:presetSeq

프리셋 수정 (명령어 동기화 포함, 원자적 처리).

### Request Body

```json
{
  "presetName": "강의실 프로젝터 (업데이트)",
  "protocolType": "TCP",
  "defaultPort": 4001,
  "presetDescription": "엡손 EB-X51 프로젝터 펌웨어 업데이트",
  "presetOrder": 1,
  "commands": [
    {
      "commandSeq": 1,
      "commandName": "전원 ON",
      "commandCode": "PWR ON\\r",
      "commandType": "POWER_ON",
      "commandOrder": 1
    },
    {
      "commandName": "입력 HDMI1",
      "commandCode": "SOURCE 30\\r",
      "commandType": "INPUT_CHANGE",
      "commandOrder": 3
    }
  ]
}
```

> **명령어 동기화 규칙:**
> - `commandSeq`가 있는 항목: 해당 명령어 수정
> - `commandSeq`가 없는 항목: 새 명령어 추가
> - 요청에 포함되지 않은 기존 명령어: soft delete

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 프리셋을 찾을 수 없습니다 |

---

## DELETE /controller/presets/:presetSeq

프리셋 삭제 (소프트 삭제). 이 프리셋을 사용 중인 장비가 있으면 삭제 불가.

### Response (200)

```json
{
  "message": "프리셋이 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 프리셋을 찾을 수 없습니다 |
| 409 | 이 프리셋을 사용 중인 장비가 있어 삭제할 수 없습니다 (N개 장비 사용 중) |

---

# 2. 제어관리 (공간 중심 통합)

## GET /controller/control/spaces

제어관리 메인 화면용. 건물 내 공간 목록 + 각 공간의 장비 수 반환.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| buildingSeq | number | Y | - | 건물 시퀀스 |
| search | string | N | - | 공간명 검색 |

### Response (200)

```json
{
  "buildingSeq": 1,
  "buildingName": "공학관 A동",
  "spaces": [
    {
      "spaceSeq": 1,
      "spaceName": "101호",
      "spaceFloor": "1",
      "spaceType": "강의실",
      "deviceCount": 3
    },
    {
      "spaceSeq": 2,
      "spaceName": "102호",
      "spaceFloor": "1",
      "spaceType": "강의실",
      "deviceCount": 2
    },
    {
      "spaceSeq": 3,
      "spaceName": "103호",
      "spaceFloor": "1",
      "spaceType": "실험실",
      "deviceCount": 0
    }
  ]
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |

---

## GET /controller/control/spaces/:spaceSeq/devices

공간별 등록된 장비 목록 조회 (장비등록/장비제어 공용).

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| spaceSeq | number | 공간 시퀀스 |

### Response (200)

```json
{
  "spaceSeq": 1,
  "spaceName": "101호",
  "spaceFloor": "1",
  "devices": [
    {
      "spaceDeviceSeq": 1,
      "deviceName": "101호 프로젝터",
      "presetSeq": 1,
      "presetName": "강의실 프로젝터",
      "protocolType": "TCP",
      "deviceIp": "192.168.1.101",
      "devicePort": 4001,
      "deviceStatus": "ACTIVE",
      "deviceOrder": 1,
      "commands": [
        {
          "commandSeq": 1,
          "commandName": "전원 ON",
          "commandCode": "PWR ON\\r",
          "commandType": "POWER_ON"
        },
        {
          "commandSeq": 2,
          "commandName": "전원 OFF",
          "commandCode": "PWR OFF\\r",
          "commandType": "POWER_OFF"
        }
      ]
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| devices[].spaceDeviceSeq | number | 공간장비 시퀀스 (PK) |
| devices[].deviceName | string | 장비명 |
| devices[].presetSeq | number | 프리셋 시퀀스 |
| devices[].presetName | string | 프리셋명 |
| devices[].protocolType | string | 프로토콜 |
| devices[].deviceIp | string | 장비 IP |
| devices[].devicePort | number | 장비 포트 |
| devices[].deviceStatus | string | 상태 (ACTIVE/INACTIVE) |
| devices[].deviceOrder | number | 정렬 순서 |
| devices[].commands | array | 프리셋에 등록된 명령어 목록 |

---

## POST /controller/control/devices

장비 등록 (공간-프리셋 매핑). 단건 등록.

### Request Body

```json
{
  "spaceSeq": 1,
  "presetSeq": 1,
  "deviceName": "101호 프로젝터",
  "deviceIp": "192.168.1.101",
  "devicePort": 4001,
  "deviceOrder": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceSeq | number | Y | 공간 시퀀스 |
| presetSeq | number | Y | 프리셋 시퀀스 |
| deviceName | string | Y | 장비명 |
| deviceIp | string | Y | 장비 IP |
| devicePort | number | Y | 장비 포트 (프리셋 defaultPort에서 자동 채움, 수정 가능) |
| deviceOrder | number | N | 정렬 순서 (기본 0) |

### Response (201)

등록된 장비 정보 반환.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간 또는 프리셋을 찾을 수 없습니다 |

---

## POST /controller/control/devices/bulk

장비 일괄 등록. 하나의 프리셋으로 여러 공간에 동시 등록.

### Request Body

```json
{
  "presetSeq": 1,
  "devices": [
    {
      "spaceSeq": 1,
      "deviceName": "101호 프로젝터",
      "deviceIp": "192.168.1.101",
      "devicePort": 4001
    },
    {
      "spaceSeq": 2,
      "deviceName": "102호 프로젝터",
      "deviceIp": "192.168.1.102",
      "devicePort": 4001
    },
    {
      "spaceSeq": 3,
      "deviceName": "103호 프로젝터",
      "deviceIp": "192.168.1.103",
      "devicePort": 4001
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| presetSeq | number | Y | 프리셋 시퀀스 |
| devices | array | Y | 등록할 장비 배열 |
| devices[].spaceSeq | number | Y | 공간 시퀀스 |
| devices[].deviceName | string | Y | 장비명 |
| devices[].deviceIp | string | Y | 장비 IP |
| devices[].devicePort | number | Y | 장비 포트 |

### Response (201)

```json
{
  "totalRequested": 3,
  "successCount": 3,
  "results": [
    {
      "spaceSeq": 1,
      "spaceName": "101호",
      "deviceName": "101호 프로젝터",
      "status": "SUCCESS"
    },
    {
      "spaceSeq": 2,
      "spaceName": "102호",
      "deviceName": "102호 프로젝터",
      "status": "SUCCESS"
    },
    {
      "spaceSeq": 3,
      "spaceName": "103호",
      "deviceName": "103호 프로젝터",
      "status": "SUCCESS"
    }
  ]
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 프리셋을 찾을 수 없습니다 |
| 400 | devices 배열이 비어있습니다 |

---

## PUT /controller/control/devices/:spaceDeviceSeq

장비 수정. `spaceSeq`는 수정 불가 (공간 변경 시 삭제 후 재등록).

### Request Body

```json
{
  "presetSeq": 2,
  "deviceName": "101호 프로젝터 (교체)",
  "deviceIp": "192.168.1.201",
  "devicePort": 4002,
  "deviceStatus": "ACTIVE",
  "deviceOrder": 1
}
```

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 장비를 찾을 수 없습니다 |

---

## DELETE /controller/control/devices/:spaceDeviceSeq

장비 삭제 (소프트 삭제, device_isdel='Y').

### Response (200)

```json
{
  "message": "장비가 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 장비를 찾을 수 없습니다 |

---

## POST /controller/control/execute

단일 장비 명령어 실행.

### Request Body

```json
{
  "spaceDeviceSeq": 1,
  "commandSeq": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceDeviceSeq | number | Y | 공간장비 시퀀스 |
| commandSeq | number | Y | 명령어 시퀀스 |

### Response (200)

```json
{
  "logSeq": 1,
  "resultStatus": "SUCCESS",
  "resultMessage": "명령어 전송 완료",
  "executedAt": "2026-02-09T10:30:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 장비 또는 명령어를 찾을 수 없습니다 |
| 422 | 장비가 비활성 상태(INACTIVE)입니다 |
| 504 | 장비 응답 시간 초과 (TIMEOUT) |

---

## POST /controller/control/execute-batch

공간 일괄 제어. 해당 공간의 모든 ACTIVE 장비에 같은 유형의 명령어 실행.

### Request Body

```json
{
  "spaceSeq": 1,
  "commandType": "POWER_ON"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceSeq | number | Y | 공간 시퀀스 |
| commandType | string | Y | 명령어 유형 (POWER_ON/POWER_OFF) |

### Response (200)

```json
{
  "spaceSeq": 1,
  "spaceName": "101호",
  "totalDevices": 3,
  "results": [
    {
      "spaceDeviceSeq": 1,
      "deviceName": "101호 프로젝터",
      "resultStatus": "SUCCESS",
      "resultMessage": "명령어 전송 완료"
    },
    {
      "spaceDeviceSeq": 2,
      "deviceName": "101호 에어컨",
      "resultStatus": "FAIL",
      "resultMessage": "Connection refused"
    }
  ],
  "successCount": 2,
  "failCount": 1,
  "executedAt": "2026-02-09T10:30:00.000Z"
}
```

---

## GET /controller/control/logs

제어 로그 조회 (페이징).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| buildingSeq | number | N | - | 건물 시퀀스 필터 |
| spaceSeq | number | N | - | 공간 시퀀스 필터 |
| spaceDeviceSeq | number | N | - | 장비 시퀀스 필터 |
| resultStatus | string | N | - | 결과 필터 (SUCCESS/FAIL/TIMEOUT) |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 20 | 페이지당 항목 수 |

### Response (200)

```json
{
  "items": [
    {
      "no": 100,
      "logSeq": 1,
      "spaceName": "101호",
      "deviceName": "101호 프로젝터",
      "commandName": "전원 ON",
      "commandType": "POWER_ON",
      "executedBy": "관리자",
      "resultStatus": "SUCCESS",
      "resultMessage": "명령어 전송 완료",
      "executedAt": "2026-02-09T10:30:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].logSeq | number | 로그 시퀀스 |
| items[].spaceName | string | 공간명 |
| items[].deviceName | string | 장비명 |
| items[].commandName | string | 명령어명 |
| items[].commandType | string | 명령어 유형 |
| items[].executedBy | string | 실행자 이름 |
| items[].resultStatus | string | 결과 (SUCCESS/FAIL/TIMEOUT) |
| items[].resultMessage | string/null | 응답/에러 메시지 |
| items[].executedAt | string | 실행 시각 (ISO 8601) |

### 정렬

- `executed_at DESC` (최신순)
