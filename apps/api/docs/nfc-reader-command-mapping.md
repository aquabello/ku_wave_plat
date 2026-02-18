# NFC 리더기 명령어 매핑 기능

## 개요

NFC 리더기별로 입실/퇴실 시 실행할 장비 및 명령어를 세밀하게 매핑할 수 있는 기능입니다.

기존 NFC 태깅 로직은 해당 호실의 모든 ACTIVE 장비에 대해 POWER_ON/POWER_OFF 명령어를 일괄 실행했지만, 이제 리더기별로 특정 장비만 선택하거나, 다른 유형의 명령어(INPUT_CHANGE 등)를 지정할 수 있습니다.

## 데이터베이스

### 테이블: `tb_nfc_reader_command`

```sql
CREATE TABLE tb_nfc_reader_command (
  reader_command_seq INT AUTO_INCREMENT PRIMARY KEY COMMENT 'NFC 리더기 명령어 매핑 시퀀스',
  reader_seq INT NOT NULL COMMENT 'NFC 리더기 시퀀스',
  space_device_seq INT NOT NULL COMMENT '공간장비 시퀀스',
  enter_command_seq INT NULL COMMENT '입실 시 실행할 명령어 시퀀스',
  exit_command_seq INT NULL COMMENT '퇴실 시 실행할 명령어 시퀀스',
  command_isdel CHAR(1) DEFAULT 'N' COMMENT '삭제 여부',
  reg_date DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  upd_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (reader_seq) REFERENCES tb_nfc_reader(reader_seq),
  FOREIGN KEY (space_device_seq) REFERENCES tb_space_device(space_device_seq),
  FOREIGN KEY (enter_command_seq) REFERENCES tb_preset_command(command_seq),
  FOREIGN KEY (exit_command_seq) REFERENCES tb_preset_command(command_seq)
) COMMENT 'NFC 리더기 명령어 매핑';
```

## API 엔드포인트

### 1. GET /api/v1/nfc/readers/:readerSeq/commands

**설명**: NFC 리더기의 명령어 매핑 조회

**인증**: Bearer Token (JWT)

**응답 예시**:
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
      "presetName": "Epson 프로젝터",
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
          "commandCode": "A1 B2 C3",
          "commandType": "POWER_ON"
        },
        {
          "commandSeq": 2,
          "commandName": "전원 OFF",
          "commandCode": "D4 E5 F6",
          "commandType": "POWER_OFF"
        },
        {
          "commandSeq": 3,
          "commandName": "HDMI 입력",
          "commandCode": "11 22 33",
          "commandType": "INPUT_CHANGE"
        }
      ]
    }
  ],
  "mappedCount": 2,
  "totalDevices": 3
}
```

### 2. PUT /api/v1/nfc/readers/:readerSeq/commands

**설명**: NFC 리더기의 명령어 매핑 등록/수정

**인증**: Bearer Token (JWT)

**요청 Body**:

#### 옵션 1: 개별 매핑
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
      "enterCommandSeq": 3,
      "exitCommandSeq": null
    }
  ]
}
```

#### 옵션 2: 전체 삭제
```json
{
  "mappings": []
}
```

#### 옵션 3: 자동 매핑 (모든 ACTIVE 장비에 POWER_ON/POWER_OFF 자동 설정)
```json
{
  "mapAll": true
}
```

**응답 예시**:
```json
{
  "message": "명령어 매핑이 성공적으로 저장되었습니다",
  "mappedCount": 2,
  "totalDevices": 3
}
```

## 동작 로직

### NFC 태깅 시 제어 흐름

1. **매핑 확인**: `tb_nfc_reader_command`에서 해당 리더기의 활성 매핑 조회
2. **매핑이 있는 경우**:
   - ENTER 태깅 → `enter_command_seq`에 지정된 명령어만 실행
   - EXIT 태깅 → `exit_command_seq`에 지정된 명령어만 실행
   - null인 경우 해당 장비는 제어하지 않음
3. **매핑이 없는 경우**:
   - 기존 동작 유지: 호실의 모든 ACTIVE 장비에 대해 POWER_ON/POWER_OFF 실행

### 유효성 검증

- `spaceDeviceSeq`는 해당 리더기의 호실(space_seq)에 속한 장비여야 함
- `enterCommandSeq`, `exitCommandSeq`는 유효한 명령어 시퀀스여야 함
- 존재하지 않는 장비나 명령어를 참조하면 422 Unprocessable Entity 응답

## 구현 파일

### Entity
- `/apps/api/src/modules/nfc/entities/tb-nfc-reader-command.entity.ts`

### DTO
- `/apps/api/src/modules/nfc/dto/nfc-reader-command.dto.ts`

### Service
- `/apps/api/src/modules/nfc/services/nfc-reader-command.service.ts`
- `/apps/api/src/modules/controller/control/control.service.ts` (새 메서드 추가)
  - `executeForNfcWithMappings()`: 매핑 기반 제어

### Controller
- `/apps/api/src/modules/nfc/nfc.controller.ts` (새 엔드포인트 추가)

### Module
- `/apps/api/src/modules/nfc/nfc.module.ts` (Entity 및 Service 등록)

### 수정된 태깅 로직
- `/apps/api/src/modules/nfc/services/nfc-tag.service.ts`
  - Step 6에서 매핑 확인 후 조건부 제어 실행

## 테스트

테스트 파일: `/apps/api/test/nfc-reader-commands.http`

1. 로그인하여 JWT 토큰 발급
2. `.http` 파일의 `@token` 변수에 토큰 값 붙여넣기
3. 각 엔드포인트 테스트 실행

## 사용 시나리오

### 시나리오 1: 프로젝터만 제어
101호에 프로젝터, 조명, 스크린이 있지만, NFC 태깅 시 프로젝터만 ON/OFF하고 싶은 경우:

```json
{
  "mappings": [
    {
      "spaceDeviceSeq": 1,
      "enterCommandSeq": 1,
      "exitCommandSeq": 2
    }
  ]
}
```

### 시나리오 2: 입실 시만 제어
입실 시에만 장비를 켜고, 퇴실 시에는 수동으로 관리하고 싶은 경우:

```json
{
  "mappings": [
    {
      "spaceDeviceSeq": 1,
      "enterCommandSeq": 1,
      "exitCommandSeq": null
    }
  ]
}
```

### 시나리오 3: 다른 유형의 명령어 사용
입실 시 HDMI 입력으로 자동 전환:

```json
{
  "mappings": [
    {
      "spaceDeviceSeq": 1,
      "enterCommandSeq": 3,
      "exitCommandSeq": 2
    }
  ]
}
```

## 주의사항

- 매핑 저장 시 기존 매핑은 전부 soft delete(`command_isdel='Y'`) 처리 후 새로 생성됨
- `mapAll` 옵션 사용 시 해당 호실의 모든 ACTIVE 장비에 대해 POWER_ON/POWER_OFF 명령어가 자동으로 매핑됨
- 프리셋에 POWER_ON 또는 POWER_OFF 유형의 명령어가 없는 장비는 자동 매핑에서 제외됨
- 매핑을 완전히 삭제하려면 빈 배열(`"mappings": []`)을 전달하면 됨
