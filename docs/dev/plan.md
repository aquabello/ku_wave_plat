# NFC 태깅 시스템 통합 개발 계획

> **목표**: NFC 태깅 → DB 식별 → 입실/퇴실 or 컨트롤러 연동(신규 등록) 전체 프로세스 구현
> **작성일**: 2026-03-14

---

## 1. 전체 프로세스

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ ACR122U     │     │ NFC Agent    │     │ KU_WAVE_PLAT  │     │ 컨트롤러 HW  │
│ USB 리더기   │     │ (@ku/nfc)    │     │ (NestJS BE)   │     │ (TCP:9090)   │
└──────┬──────┘     └──────┬───────┘     └──────┬────────┘     └──────┬───────┘
       │ 카드 태깅          │                     │                     │
       │──────────────────→│                     │                     │
       │                   │ POST /nfc/tag       │                     │
       │                   │ (X-NFC-Api-Key)     │                     │
       │                   │────────────────────→│                     │
       │                   │                     │                     │
       │                   │                     │ [DB 조회]            │
       │                   │                     │ cardIdentifier 검색  │
       │                   │                     │                     │
       │                   │         ┌───────────┴───────────┐         │
       │                   │         │                       │         │
       │                   │    [카드 존재]              [카드 미존재]   │
       │                   │         │                       │         │
       │                   │    입실/퇴실 토글            TCP 연결       │
       │                   │    장비 제어 실행           NFC 페이지 전환  │
       │                   │         │                       │────────→│
       │                   │         │                       │         │
       │                   │         │               RX 대기 (30초)     │
       │                   │         │                       │         │
       │                   │         │              ┌────────┴────┐    │
       │                   │         │         [Nfc save]    [Nfc no]  │
       │                   │         │              │            │     │
       │                   │         │         카드 자동등록   로그만 저장 │
       │                   │         │         (INACTIVE)       │     │
       │                   │         │              │            │     │
       │                   │         │         MAIN 전환 TX      │     │
       │                   │         │              │────────────┼────→│
       │                   │         │              │            │     │
       │                   │         │         소켓 종료          │     │
       │                   │         │              │            │     │
       │                   │←────────┴──────────────┴────────────┘     │
       │                   │  Response                                 │
       │←─────────────────│                                           │
```

---

## 2. 현재 구현 상태

| 기능 | 상태 | 위치 |
|------|------|------|
| NFC 리더기 등록 + API Key 발급 | **완료** | `nfc.controller.ts`, `nfc-reader.service.ts` |
| NFC Agent 카드 읽기 + BE 전송 | **완료** | `apps/nfc/src/reader.ts`, `api-client.ts` |
| API Key 인증 (NfcApiKeyGuard) | **완료** | `nfc-api-key.guard.ts` |
| 카드 존재 시 입실/퇴실 토글 | **완료** | `nfc-tag.service.ts` (ENTER/EXIT) |
| 장비 제어 실행 (POWER_ON/OFF) | **완료** | `control.service.ts` (executeForNfc) |
| 컨트롤러 TCP 소켓 통신 | **완료** | `socket.service.ts` (sendNfcSequence) |
| **카드 미존재 시 컨트롤러 NFC 페이지 전환** | **미구현** | — |
| **Nfc save 응답 시 카드 자동 등록** | **미구현** | — |
| **Agent 24시간 구동 + 오류 시 AID 테스트 노출** | **부분 구현** | Agent 실행은 됨, 상태 모니터링 미흡 |
| **오프라인 큐 재시도** | **미구현** | `queue.ts` 존재하나 retry 미호출 |
| **버저** | **미구현** | 스텁만 존재 (APDU 미전송) |

---

## 3. 개발 범위

### 3.1 [핵심] 카드 미존재 시 컨트롤러 연동 + 자동 등록

**위치**: `apps/api/src/modules/nfc/services/nfc-tag.service.ts`

현재 `processTag()`에서 카드가 없으면 `UNKNOWN` 로그만 저장하고 종료. 여기에 컨트롤러 연동을 추가:

```typescript
// nfc-tag.service.ts — processTag() 수정

// 현재 코드: 카드 미존재 시
// → log UNKNOWN → return { result: 'UNKNOWN' }

// 변경 후: 카드 미존재 시
// 1. 해당 리더기의 spaceSeq로 컨트롤러 디바이스 IP 조회
// 2. socketService.sendNfcSequence(ip, port) 호출
//    → TCP 연결 → NFC 페이지 전환 TX → 30초 대기
// 3. 결과 처리:
//    - 'save': 카드 자동 등록 (cardStatus: 'INACTIVE' = 관리자 승인 대기)
//              MAIN 전환 TX → 소켓 종료
//    - 'no':   MAIN 전환 TX → 소켓 종료 → 로그만 저장
//    - 'timeout': MAIN 전환 TX → 소켓 종료 → 로그만 저장
// 4. 응답 반환
```

**필요한 변경:**

```
apps/api/src/modules/nfc/services/nfc-tag.service.ts
├── SocketService 주입 (DI)
├── processTag() 내 UNKNOWN 분기 확장
│   ├── 컨트롤러 IP 조회 (spaceSeq → tb_space_device)
│   ├── sendNfcSequence(ip, port) 호출
│   ├── 'save' → nfcCardRepository.create() (INACTIVE)
│   └── 로그 저장 (logType: 'REGISTER_REQUEST')
└── NfcTagResponse 타입에 신규 필드 추가

apps/api/src/modules/nfc/nfc.module.ts
└── SocketModule import 추가 (SocketService 사용)
```

**카드 자동 등록 시 저장 데이터 (사용자 정보 없이 태그 정보만):**

```typescript
{
  cardIdentifier: dto.identifier,  // UID (NFC Agent에서 읽은 값)
  cardAid: dto.aid ?? null,        // AID (있으면)
  cardLabel: null,                 // 관리자가 나중에 설정
  cardType: dto.aid ? 'PHONE' : 'CARD',
  cardStatus: 'INACTIVE',         // 승인 대기 (관리자가 ACTIVE로 변경)
  tuSeq: null,                    // 사용자 미매핑 — 사용자 정보 없이 등록
  cardIsdel: 'N',
}
// NOTE: 사용자 정보(tuSeq)는 필수값에서 제외.
// 관리자가 콘솔에서 INACTIVE 카드 확인 → 사용자 매핑 + ACTIVE 승인.
// tb_nfc_card.tu_seq 컬럼이 NOT NULL이면 nullable로 변경 필요.
```

**컨트롤러 IP 조회 로직:**

```typescript
// spaceSeq (리더기가 설치된 공간) → tb_space_device에서 컨트롤러 IP 조회
const device = await this.spaceDeviceRepository.findOne({
  where: { spaceSeq: reader.spaceSeq, deviceStatus: 'ACTIVE', deviceIsdel: 'N' },
});
// device.deviceIp, device.devicePort → sendNfcSequence()
```

### 3.2 [핵심] NFC Agent 24시간 안정 구동

**위치**: `apps/nfc/src/`

| 항목 | 현재 | 개선 |
|------|------|------|
| 리더기 연결 끊김 | 에러 로그만 출력 | **자동 재연결** (5초 간격, 무한 재시도) — NFC USB 연결 끊김/복구 시에도 자동 복구 |
| API Key 인증 실패 | 에러 throw → 프로세스 종료 | AID 테스트 모드로 전환 |
| BE 서버 다운 | 큐에 저장하나 재시도 안 함 | 30초 간격 오프라인 큐 재시도 |
| NFC 프로세스 크래시 | 프로세스 종료 | **PM2/systemd로 프로세스 자동 재시작** |
| 버저 | 스텁 (미구현) | APDU 전송 구현 |

**API Key 미인증 시 AID 테스트 모드:**

```typescript
// index.ts 수정
try {
  // 정상 시작: API Key 인증 → 태깅 처리 모드
  await apiClient.healthCheck();
  reader.startTagMode();
} catch (error) {
  if (error.message.includes('API Key') || error.message.includes('401')) {
    // AID 테스트 모드: 태깅 시 AID 스캔 결과만 WS로 브로드캐스트
    logger.warn('API Key 인증 실패 — AID 테스트 모드로 전환');
    reader.startAidTestMode();
  }
}
```

**오프라인 큐 재시도:**

```typescript
// index.ts에 추가
setInterval(async () => {
  const item = queue.peek();
  if (!item) return;
  try {
    await apiClient.sendTag(item);
    queue.dequeue();
  } catch {
    // 다음 주기에 재시도
  }
}, 30000);
```

### 3.3 [선택] NFC 로그 타입 확장

현재 `logType`: `ENTER | EXIT | DENIED | UNKNOWN`

추가: `REGISTER_SAVE | REGISTER_NO | REGISTER_TIMEOUT`

```sql
-- tb_nfc_log.log_type 확장 (ENUM 변경 필요 여부 확인)
-- 현재 varchar이면 그대로 사용 가능
```

---

## 4. 파일 변경 목록

### BE (apps/api)

| 파일 | 변경 | 설명 |
|------|------|------|
| `modules/nfc/services/nfc-tag.service.ts` | 수정 | UNKNOWN 분기에 컨트롤러 연동 + 자동 등록 |
| `modules/nfc/nfc.module.ts` | 수정 | SocketModule import 추가 |
| `modules/nfc/entities/tb-nfc-log.entity.ts` | 수정 | logType ENUM 값 추가 |
| `modules/nfc/entities/tb-nfc-card.entity.ts` | 수정 | tuSeq nullable 변경 |
| `modules/controller/control/control.service.ts` | 수정 | `executeForNfc`/`executeForNfcWithMappings`에 3초 딜레이 추가 |

### NFC Agent (apps/nfc)

| 파일 | 변경 | 설명 |
|------|------|------|
| `src/index.ts` | 수정 | API Key 실패 시 AID 테스트 모드, 오프라인 큐 재시도 |
| `src/reader.ts` | 수정 | AID 테스트 모드 추가, 리더기 재연결 로직 |
| `src/api-client.ts` | 수정 | healthCheck() 메서드 추가 |
| `src/buzzer.ts` | 수정 | APDU 전송 구현 |

### FE (apps/console) — 변경 없음

관리자 콘솔의 NFC 카드 관리 페이지에서 INACTIVE 카드를 ACTIVE로 승인하는 기능은 이미 구현됨.

---

## 5. 시나리오별 상세 흐름

### 5.1 시나리오 A: 등록된 카드 태깅 (기존 — 변경 없음)

```
카드 태깅 → Agent POST /nfc/tag
→ BE: cardIdentifier로 tb_nfc_card 조회
→ 카드 존재 + ACTIVE + 건물 권한 OK
→ 마지막 로그 확인: ENTER → 이번은 EXIT (또는 반대)
→ 장비 제어 실행 (POWER_ON 또는 POWER_OFF)
→ 로그 저장 (ENTER 또는 EXIT)
→ Agent: 버저 OK
```

### 5.2 시나리오 B: 미등록 카드 태깅 → 컨트롤러 저장 (신규)

```
카드 태깅 → Agent POST /nfc/tag
→ BE: cardIdentifier로 tb_nfc_card 조회
→ 카드 미존재 (UNKNOWN)
→ BE: 해당 공간의 컨트롤러 디바이스 IP 조회
→ BE: sendNfcSequence(ip, 9090)
  → TCP 연결 → TX: NFC 페이지 전환
  → 컨트롤러 화면: "저장하시겠습니까? [Save] [No]"
  → 사용자가 [Save] 클릭
  → RX: "Nfc save" (4E66632073617665)
  → TX: MAIN 페이지 전환 (자동)
  → 소켓 종료
→ BE: tb_nfc_card INSERT (INACTIVE)
→ BE: tb_nfc_log INSERT (REGISTER_SAVE)
→ Agent: 버저 OK
→ 관리자: 콘솔에서 INACTIVE 카드 확인 → ACTIVE 승인 + 사용자 매핑
```

### 5.3 시나리오 C: 미등록 카드 태깅 → 컨트롤러 취소 (신규)

```
카드 태깅 → Agent POST /nfc/tag
→ 카드 미존재 → sendNfcSequence
→ 사용자가 [No] 클릭
→ RX: "Nfc no" (4E6663206E6F)
→ TX: MAIN 페이지 전환 (자동)
→ 소켓 종료
→ BE: tb_nfc_log INSERT (REGISTER_NO)
→ Agent: 버저 DENIED
```

### 5.4 시나리오 D: 미등록 카드 태깅 → 30초 타임아웃 (신규)

```
카드 태깅 → Agent POST /nfc/tag
→ 카드 미존재 → sendNfcSequence
→ 30초 무응답
→ TX: MAIN 페이지 전환 (타임아웃)
→ 소켓 종료
→ BE: tb_nfc_log INSERT (REGISTER_TIMEOUT)
→ Agent: 버저 DENIED
```

### 5.5 시나리오 E: Agent 시작 — API Key 인증 실패 (신규)

```
Agent 시작 → config.json 로드 → healthCheck() 호출
→ 401 또는 연결 실패
→ AID 테스트 모드 전환
→ 카드 태깅 시: AID 스캔 결과만 WS 브로드캐스트 (BE 전송 안 함)
→ 콘솔 출력: "AID 테스트 모드 — API Key를 확인하세요"
→ 30초마다 healthCheck 재시도 → 성공 시 정상 모드 전환
```

### 5.6 시나리오 F: 등록된 카드 → 매핑 명령어 3초 간격 순차 실행 (변경)

현재 `executeForNfc()`는 매핑된 장비들을 딜레이 없이 연속 실행. 컨트롤러 하드웨어가 동시 명령을 처리하지 못하므로 **3초 간격 순차 전송**으로 변경.

```
카드 태깅 → Agent POST /nfc/tag
→ BE: cardIdentifier 조회 → 카드 존재 + ACTIVE
→ 입실/퇴실 토글 → ENTER (POWER_ON)
→ 매핑된 장비 순차 실행 (device_order 순서):
  → [0초]  전자교탁 ON   → TCP 전송 → 응답 대기 → 로그 저장
  → [3초]  스크린 Down   → TCP 전송 → 응답 대기 → 로그 저장
  → [6초]  프로젝터 ON   → TCP 전송 → 응답 대기 → 로그 저장
→ 전체 결과 반환
→ Agent: 버저 OK
```

**변경 위치**: `control.service.ts` — `executeForNfc()`, `executeForNfcWithMappings()`

```typescript
// 현재: 딜레이 없이 순차 실행
for (const device of devices) {
  await this.sendCommand(protocol, ip, port, command.commandCode);
}

// 변경: 3초 간격 순차 실행
const COMMAND_DELAY_MS = 3000;
for (let i = 0; i < devices.length; i++) {
  if (i > 0) {
    await new Promise((r) => setTimeout(r, COMMAND_DELAY_MS));
  }
  await this.sendCommand(protocol, ip, port, command.commandCode);
}
```

**주의**: 장비 3개 → 최소 6초 소요 (3초 × 2 딜레이). NFC Agent HTTP 타임아웃 고려 필요.


---

## 6. 상세 할 일 목록

### Phase 0: DB 스키마 변경 (구현 전 필수)

- [x] **0-1** `tb_nfc_card.tu_seq` NOT NULL → NULL 허용으로 변경
  ```sql
  ALTER TABLE tb_nfc_card MODIFY tu_seq INT(11) NULL;
  ```
- [x] **0-2** `tb_nfc_log.log_type` ENUM에 신규 값 추가
  ```sql
  ALTER TABLE tb_nfc_log MODIFY log_type ENUM('ENTER','EXIT','DENIED','UNKNOWN','REGISTER_SAVE','REGISTER_NO','REGISTER_TIMEOUT') NOT NULL;
  ```
- [x] **0-3** `tb_nfc_card.entity.ts`에서 `tuSeq` 컬럼을 `nullable: true`로 변경
- [x] **0-4** `tb_nfc_log.entity.ts`에서 `logType` enum 배열에 `REGISTER_SAVE`, `REGISTER_NO`, `REGISTER_TIMEOUT` 추가

### Phase 1: BE — 카드 미존재 시 컨트롤러 연동 + 자동 등록

- [x] **1-1** `nfc.module.ts`에 `SocketModule` import 추가
- [x] **1-2** `nfc-tag.service.ts`에 `SocketService` 주입 (DI)
  - 순환 의존성 발생 시 `forwardRef()` 사용
- [x] **1-3** `nfc-tag.service.ts`에 `SpaceDeviceRepository` 주입 (컨트롤러 IP 조회용)
- [x] **1-4** `nfc-tag.service.ts` — `processTag()` UNKNOWN 분기 확장:
  - [x] 1-4a: 해당 리더기의 `spaceSeq`로 `tb_space_device`에서 ACTIVE 디바이스 IP/Port 조회
  - [x] 1-4b: 디바이스 없으면 기존 동작 유지 (UNKNOWN 로그만 저장)
  - [x] 1-4c: 디바이스 있으면 `socketService.sendNfcSequence(ip, port)` 호출
  - [x] 1-4d: 결과 `'save'` → `tb_nfc_card` INSERT (tuSeq: null, cardStatus: INACTIVE)
  - [x] 1-4e: 결과 `'save'` → `tb_nfc_log` INSERT (logType: REGISTER_SAVE)
  - [x] 1-4f: 결과 `'no'` → `tb_nfc_log` INSERT (logType: REGISTER_NO)
  - [x] 1-4g: 결과 `'timeout'` → `tb_nfc_log` INSERT (logType: REGISTER_TIMEOUT)
  - [x] 1-4h: 응답 반환 — result 필드에 `'REGISTER_SAVE'` / `'REGISTER_NO'` / `'REGISTER_TIMEOUT'` 포함
- [x] **1-5** `@ku/types`에 `NfcTagResponse` 타입 업데이트 (신규 result 값 추가)
- [x] **1-6** BE tsc 타입 체크 통과 확인

### Phase 2: BE — 장비 제어 3초 딜레이 순차 실행

- [x] **2-1** `control.service.ts` — `executeForNfc()` 수정:
  - [x] 2-1a: `COMMAND_DELAY_MS = 3000` 상수 추가
  - [x] 2-1b: `for` 루프에서 두 번째 장비부터 `await delay(3000)` 추가
  - [x] 2-1c: `device_order` 순서대로 실행되는지 확인 (ORDER BY 추가)
- [x] **2-2** `control.service.ts` — `executeForNfcWithMappings()` 동일하게 수정:
  - [x] 2-2a: 3초 딜레이 추가
  - [x] 2-2b: 매핑된 명령어 순서대로 실행
- [x] **2-3** BE tsc 타입 체크 통과 확인

### Phase 3: NFC Agent — 24시간 안정 구동

- [x] **3-1** `api-client.ts` — `healthCheck()` 메서드 추가:
  - [x] 3-1a: `GET /nfc/readers` 또는 간단한 인증 확인 API 호출
  - [x] 3-1b: 성공 시 true, 401/네트워크 에러 시 false 반환
- [x] **3-2** `api-client.ts` — HTTP 타임아웃 10초 → 35초로 변경 (`sendTag` 전용)
- [x] **3-3** `reader.ts` — 리더기 자동 재연결:
  - [x] 3-3a: `reader.on('error')` / `reader.on('end')` 이벤트 핸들링
  - [x] 3-3b: 5초 간격으로 리더기 재탐색 (`NFC.createInstance()` 재시도)
  - [x] 3-3c: 재연결 성공 시 정상 모드 복귀 + WS 브로드캐스트
- [x] **3-4** `reader.ts` — AID 테스트 모드 추가:
  - [x] 3-4a: `startAidTestMode()` 메서드 — 태깅 시 AID 스캔만 수행, BE 전송 안 함
  - [x] 3-4b: 결과를 WS 서버로 브로드캐스트 (프론트엔드 확인용)
- [x] **3-5** `index.ts` — 시작 로직 변경:
  - [x] 3-5a: `healthCheck()` 호출 → 성공 시 `startTagMode()`, 실패 시 `startAidTestMode()`
  - [x] 3-5b: 30초 간격 `healthCheck` 재시도 → 성공 시 AID 테스트 → 정상 모드 전환
  - [x] 3-5c: 오프라인 큐 30초 간격 재시도 (`queue.peek()` → `sendTag()` → `queue.dequeue()`)
- [x] **3-6** `buzzer.ts` — APDU 전송 구현:
  - [x] 3-6a: `reader` 인스턴스를 생성자에서 받도록 변경
  - [x] 3-6b: `success()` → `FF 00 52 05 00` (짧은 버저)
  - [x] 3-6c: `denied()` → `FF 00 52 1E 00` (긴 버저)
  - [x] 3-6d: `partial()` → `FF 00 52 0A 00` (중간 버저)
  - [x] 3-6e: APDU transmit 에러 시 로그만 출력 (크래시 방지)
- [x] **3-7** NFC Agent tsc 타입 체크 통과 확인

### Phase 4: 통합 테스트

- [x] **4-1** 시나리오 A 테스트: 등록된 카드 태깅 → 입실/퇴실 토글 + 3초 딜레이 장비 제어
- [x] **4-2** 시나리오 B 테스트: 미등록 카드 태깅 → 컨트롤러 NFC 전환 → Save → 카드 자동 등록
- [x] **4-3** 시나리오 C 테스트: 미등록 카드 → No → 로그만 저장
- [x] **4-4** 시나리오 D 테스트: 미등록 카드 → 30초 타임아웃 → MAIN 전환 + 로그
- [x] **4-5** 시나리오 E 테스트: Agent API Key 오류 → AID 테스트 모드 전환 → 정상 복귀
- [x] **4-6** 시나리오 F 테스트: 등록 카드 → 장비 3개 → 3초 간격 순차 실행 확인
- [x] **4-7** 리더기 USB 분리/재연결 → Agent 자동 재연결 확인
- [x] **4-8** BE 서버 다운/복구 → 오프라인 큐 재시도 확인

---

## 7. 주의사항

1. **CRITICAL RULES**: 새 테이블 생성 없음 — 기존 `tb_nfc_card`, `tb_nfc_log` 사용
2. **DB 스키마 변경 필요 (구현 전 실행)**:
   - `tb_nfc_card.tu_seq`: 현재 `NOT NULL` → **`NULL` 허용으로 변경** (사용자 없이 태그 정보만 등록)
   - `tb_nfc_log.log_type`: 현재 `ENUM('ENTER','EXIT','DENIED','UNKNOWN')` → **`REGISTER_SAVE`, `REGISTER_NO`, `REGISTER_TIMEOUT` 추가**
   ```sql
   ALTER TABLE tb_nfc_card MODIFY tu_seq INT(11) NULL;
   ALTER TABLE tb_nfc_log MODIFY log_type ENUM('ENTER','EXIT','DENIED','UNKNOWN','REGISTER_SAVE','REGISTER_NO','REGISTER_TIMEOUT') NOT NULL;
   ```
3. **NfcTagService → SocketService**: 순환 의존성 주의 — `forwardRef()` 필요할 수 있음
4. **sendNfcSequence 타임아웃**: 30초 대기 동안 NFC Agent HTTP 요청도 대기 → Agent의 HTTP 타임아웃(현재 10초)을 **35초로 증가** 필요
5. **INACTIVE 카드 승인**: 관리자가 콘솔에서 수동 승인 (기존 카드 관리 UI로 처리 가능)
6. **컨트롤러 디바이스 없는 공간**: sendNfcSequence 스킵 → UNKNOWN 로그만 저장 (기존 동작 유지)
7. **동시 태깅**: 같은 공간에서 연속 미등록 태깅 시 sendNfcSequence가 동시 실행될 수 있음 → 공간별 mutex 또는 무시 처리 필요
