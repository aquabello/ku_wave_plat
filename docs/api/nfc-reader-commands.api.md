# NFC 리더기 명령어 매핑 API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

> **리더기관리 > 등록된 리더기 > 할당된 호실 > 명령어 매핑** 기능
>
> 리더기가 할당된 호실의 장비에 대해 NFC 태깅 시 실행할 명령어를 개별 매핑합니다.
> - 매핑이 있으면: 매핑된 장비+명령어만 실행
> - 매핑이 없으면: 기존 동작 유지 (호실 전체 장비 POWER_ON/POWER_OFF)

---

## DB 테이블

### tb_nfc_reader_command

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|------|------|------|--------|------|
| reader_command_seq | INT | NO | AUTO_INCREMENT | PK |
| reader_seq | INT | NO | - | FK → tb_nfc_reader |
| space_device_seq | INT | NO | - | FK → tb_space_device |
| enter_command_seq | INT | YES | NULL | FK → tb_preset_command (입실 시 실행 명령어) |
| exit_command_seq | INT | YES | NULL | FK → tb_preset_command (퇴실 시 실행 명령어) |
| command_isdel | VARCHAR(1) | NO | 'N' | 삭제 플래그 |
| reg_date | DATETIME | NO | CURRENT_TIMESTAMP | 등록일 |
| upd_date | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE | 수정일 |

**인덱스:**
- `UNIQUE(reader_seq, space_device_seq)` — 리더기+장비 조합 중복 방지
- `INDEX(reader_seq, command_isdel)` — 리더기별 매핑 조회

---

## GET /nfc/readers/:readerSeq/commands

리더기에 할당된 호실의 장비 목록 + 현재 명령어 매핑 상태를 반환합니다.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| readerSeq | number | 리더기 시퀀스 |

### Response (200)

```json
{
  "readerSeq": 1,
  "readerName": "101호 입구 리더기",
  "spaceSeq": 1,
  "spaceName": "101호",
  "buildingName": "공학관 A동",
  "devices": [
    {
      "spaceDeviceSeq": 1,
      "deviceName": "101호 프로젝터",
      "presetName": "강의실 프로젝터",
      "deviceStatus": "ACTIVE",
      "isMapped": true,
      "enterCommand": {
        "commandSeq": 1,
        "commandName": "전원 ON",
        "commandType": "POWER_ON"
      },
      "exitCommand": {
        "commandSeq": 2,
        "commandName": "전원 OFF",
        "commandType": "POWER_OFF"
      },
      "availableCommands": [
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
        },
        {
          "commandSeq": 3,
          "commandName": "입력 HDMI1",
          "commandCode": "SOURCE 30\\r",
          "commandType": "INPUT_CHANGE"
        }
      ]
    },
    {
      "spaceDeviceSeq": 2,
      "deviceName": "101호 스크린",
      "presetName": "전동 스크린",
      "deviceStatus": "ACTIVE",
      "isMapped": false,
      "enterCommand": null,
      "exitCommand": null,
      "availableCommands": [
        {
          "commandSeq": 10,
          "commandName": "스크린 DOWN",
          "commandCode": "01 02 03",
          "commandType": "POWER_ON"
        },
        {
          "commandSeq": 11,
          "commandName": "스크린 UP",
          "commandCode": "01 02 04",
          "commandType": "POWER_OFF"
        }
      ]
    }
  ],
  "mappedCount": 1,
  "totalDevices": 2
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| readerSeq | number | 리더기 시퀀스 |
| readerName | string | 리더기명 |
| spaceSeq | number | 할당된 호실 시퀀스 |
| spaceName | string | 호실명 |
| buildingName | string | 건물명 |
| devices | array | 호실에 등록된 장비 목록 |
| devices[].spaceDeviceSeq | number | 공간장비 시퀀스 |
| devices[].deviceName | string | 장비명 |
| devices[].presetName | string | 프리셋명 |
| devices[].deviceStatus | string | 장비 상태 (ACTIVE/INACTIVE) |
| devices[].isMapped | boolean | 명령어 매핑 여부 |
| devices[].enterCommand | object/null | 입실 시 실행할 명령어 (매핑 안됨 = null) |
| devices[].exitCommand | object/null | 퇴실 시 실행할 명령어 (매핑 안됨 = null) |
| devices[].availableCommands | array | 해당 장비 프리셋의 사용 가능한 명령어 목록 |
| mappedCount | number | 매핑된 장비 수 |
| totalDevices | number | 전체 장비 수 |

> `availableCommands`는 해당 장비의 프리셋에 등록된 명령어 목록입니다.
> FE에서 드롭다운으로 명령어를 선택할 때 사용합니다.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 리더기를 찾을 수 없습니다 |

---

## PUT /nfc/readers/:readerSeq/commands

리더기의 명령어 매핑을 등록/수정합니다.
**전체 교체(Replace All) 방식**: 요청에 포함된 매핑만 유지, 나머지는 soft delete 처리.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| readerSeq | number | 리더기 시퀀스 |

### Request Body

**개별 장비 선택 등록:**

```json
{
  "mappings": [
    {
      "spaceDeviceSeq": 1,
      "enterCommandSeq": 1,
      "exitCommandSeq": 2
    },
    {
      "spaceDeviceSeq": 2,
      "enterCommandSeq": 10,
      "exitCommandSeq": null
    }
  ]
}
```

**전체 장비 등록 (모든 장비에 POWER_ON/POWER_OFF 자동 매핑):**

```json
{
  "mapAll": true
}
```

> `mapAll: true` 시 호실의 모든 ACTIVE 장비에 대해:
> - enterCommandSeq = 해당 프리셋의 POWER_ON 명령어
> - exitCommandSeq = 해당 프리셋의 POWER_OFF 명령어
> - POWER_ON/POWER_OFF가 없는 프리셋은 건너뜀

**전체 매핑 해제 (기존 동작으로 복원):**

```json
{
  "mappings": []
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| mappings | array | N* | 매핑 배열 (*mapAll과 택1) |
| mappings[].spaceDeviceSeq | number | Y | 공간장비 시퀀스 |
| mappings[].enterCommandSeq | number/null | N | 입실 시 명령어 시퀀스 (null = 입실 시 미실행) |
| mappings[].exitCommandSeq | number/null | N | 퇴실 시 명령어 시퀀스 (null = 퇴실 시 미실행) |
| mapAll | boolean | N* | true 시 전체 장비 자동 매핑 (*mappings와 택1) |

### Response (200)

```json
{
  "readerSeq": 1,
  "readerName": "101호 입구 리더기",
  "mappedCount": 2,
  "mappings": [
    {
      "spaceDeviceSeq": 1,
      "deviceName": "101호 프로젝터",
      "enterCommandName": "전원 ON",
      "exitCommandName": "전원 OFF"
    },
    {
      "spaceDeviceSeq": 2,
      "deviceName": "101호 스크린",
      "enterCommandName": "스크린 DOWN",
      "exitCommandName": null
    }
  ],
  "message": "명령어 매핑이 저장되었습니다"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| readerSeq | number | 리더기 시퀀스 |
| readerName | string | 리더기명 |
| mappedCount | number | 매핑된 장비 수 |
| mappings | array | 저장된 매핑 목록 |
| mappings[].spaceDeviceSeq | number | 공간장비 시퀀스 |
| mappings[].deviceName | string | 장비명 |
| mappings[].enterCommandName | string/null | 입실 명령어명 |
| mappings[].exitCommandName | string/null | 퇴실 명령어명 |
| message | string | 결과 메시지 |

### Error Responses

| Status | 설명 |
|--------|------|
| 400 | mappings와 mapAll 둘 다 전송하거나, 둘 다 없는 경우 |
| 404 | 해당 리더기를 찾을 수 없습니다 |
| 404 | 해당 장비를 찾을 수 없습니다 (spaceDeviceSeq 유효성) |
| 422 | 해당 장비가 이 리더기의 호실에 속하지 않습니다 |

---

## NFC 태깅 시 동작 변경

### 기존 흐름 (매핑 없음)
```
태깅 → ENTER/EXIT 판별 → 호실 전체 장비 POWER_ON/POWER_OFF
```

### 변경 흐름 (매핑 있음)
```
태깅 → ENTER/EXIT 판별 → tb_nfc_reader_command 조회
  ├── 매핑 있음 → 매핑된 장비만 해당 명령어 실행
  │   - ENTER: enter_command_seq로 실행
  │   - EXIT: exit_command_seq로 실행 (null이면 해당 장비 skip)
  └── 매핑 없음 → 기존 동작 (전체 POWER_ON/POWER_OFF)
```

---

## 엔드포인트 요약

| # | Method | Endpoint | 설명 |
|---|--------|----------|------|
| 16 | GET | /nfc/readers/:readerSeq/commands | 리더기 명령어 매핑 조회 |
| 17 | PUT | /nfc/readers/:readerSeq/commands | 리더기 명령어 매핑 등록/수정 |

> 기존 NFC API 15개 + 신규 2개 = 총 17개 엔드포인트
