# 녹화 시스템 통합 개발 계획

> **목표**: UNTACT-LECTURE 바이너리 프로토콜 기반 녹화 시작/종료 + FTP 파일 전송 자동화
> **작성일**: 2026-03-15

---

## 1. 전체 프로세스

### 1.1 녹화 시작 프로세스

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Console FE   │     │ KU_WAVE_PLAT  │     │ UNTACT-LECTURE   │
│ (관리자)      │     │ (NestJS BE)   │     │ (녹화기 TCP:6060) │
└──────┬───────┘     └──────┬────────┘     └──────┬───────────┘
       │                     │                     │
       │ POST /recorders/:seq/control/record/start │
       │────────────────────→│                     │
       │                     │                     │
       │                     │ [1] 녹화기 상태 확인  │
       │                     │   - ONLINE 여부       │
       │                     │   - 다른 사용자 선점   │
       │                     │   - 기존 세션 확인     │
       │                     │                     │
       │                     │ [2] 프리셋 적용 (선택) │
       │                     │ TCP: Cmd=0x0100      │
       │                     │ Property=Set(0x00)   │
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ ACK/NACK             │
       │                     │                     │
       │                     │ [3] 녹화 시작 명령    │
       │                     │ TCP: Cmd=0x1000      │
       │                     │ Property=Execute(0x02)│
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ ACK/NACK             │
       │                     │                     │
       │                     │ [4] ACK 시:           │
       │                     │   - 사용자 선점 등록   │
       │                     │   - 세션 생성 (RECORDING)│
       │                     │   - 로그 저장          │
       │                     │                     │
       │←────────────────────│                     │
       │ Response             │                     │
```

### 1.2 녹화 종료 프로세스 (FTP와 독립)

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Console FE   │     │ KU_WAVE_PLAT  │     │ UNTACT-LECTURE   │
│ (관리자)      │     │ (NestJS BE)   │     │ (녹화기 TCP:6060) │
└──────┬───────┘     └──────┬────────┘     └──────┬───────────┘
       │                     │                     │
       │ POST /recorders/:seq/control/record/stop  │
       │────────────────────→│                     │
       │                     │                     │
       │                     │ [1] 녹화 종료 명령    │
       │                     │ TCP: Cmd=0x1002      │
       │                     │ Property=Execute(0x02)│
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ ACK/NACK             │
       │                     │                     │
       │                     │ [2] ACK 시:           │
       │                     │   - 세션 종료 (COMPLETED) │
       │                     │   - 녹화 시간 계산     │
       │                     │   - 사용자 선점 해제   │
       │                     │   - tb_recording_file │
       │                     │     INSERT            │
       │                     │     (ftpStatus: PENDING)│
       │                     │                     │
       │←────────────────────│                     │
       │ Response (즉시)      │                     │
```

> **핵심 설계**: 녹화 종료 프로세스는 세션 상태를 COMPLETED로 업데이트하고 녹화 파일 레코드를 `PENDING` 상태로 생성하는 것까지만 담당. FTP 업로드는 별도 프로세스가 `ftpStatus` 상태값을 기준으로 독립적으로 실행.

### 1.3 FTP 업로드 프로세스 (녹화 종료와 독립)

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────┐
│ KU_WAVE_PLAT  │     │ UNTACT-LECTURE   │     │ FTP Server   │
│ (NestJS BE)   │     │ (녹화기 FTP)      │     │ (대상 서버)   │
│ [FTP Job]     │     │                  │     │              │
└──────┬────────┘     └──────┬───────────┘     └──────┬───────┘
       │                     │                        │
       │ [1] tb_recording_file                        │
       │     ftpStatus = 'PENDING' 또는 'RETRY'       │
       │     인 파일 조회 (폴링 / 이벤트)               │
       │                     │                        │
       │ [2] ftpStatus → UPLOADING                    │
       │                     │                        │
       │ [3] 녹화기 FTP 접속  │                        │
       │     파일 다운로드     │                        │
       │←────────────────────│                        │
       │                     │                        │
       │ [4] 대상 FTP 서버 업로드                       │
       │────────────────────────────────────────────→│
       │                     │                        │
       │     ┌───────────────┴───────────┐            │
       │     │                           │            │
       │  [성공]                       [실패]          │
       │     │                           │            │
       │  ftpStatus → COMPLETED       ftpStatus → FAILED│
       │  ftpUploadedPath 기록        ftpErrorMessage 기록│
       │  ftpUploadedAt 기록          ftpRetryCount++  │
       │     │                           │            │
       │     │                    ┌──────┴──────┐     │
       │     │                    │             │     │
       │     │              [3회 미만]      [3회 이상]  │
       │     │                    │             │     │
       │     │             ftpStatus → RETRY  더 이상   │
       │     │             (다음 폴링에서      재시도 안함│
       │     │              자동 재시도)        관리자   │
       │     │                    │          수동 확인  │
       │     └────────────────────┘             │     │
```

> **핵심 설계**: FTP 업로드 프로세스는 `tb_recording_file.ftp_status` 상태값만 보고 동작.
> - `PENDING`: 녹화 종료 시 생성된 신규 파일 → 최초 업로드 시도
> - `RETRY`: 실패 후 재시도 대기 → 자동 재시도 (3회 미만)
> - `UPLOADING`: 현재 업로드 진행 중
> - `COMPLETED`: 업로드 완료
> - `FAILED`: 최종 실패 (3회 초과 또는 관리자 확인 필요)

### 1.4 FTP 전송 실패 → 재시도 프로세스

```
┌──────────────┐     ┌───────────────┐
│ Console FE   │     │ KU_WAVE_PLAT  │
│ (관리자)      │     │ (NestJS BE)   │
└──────┬───────┘     └──────┬────────┘
       │                     │
       │  [자동 재시도]        │
       │                     │ FTP Job이 주기적으로 폴링
       │                     │ ftpStatus = 'PENDING' 또는 'RETRY'
       │                     │ AND ftpRetryCount < 3
       │                     │ → 자동으로 업로드 재시도
       │                     │
       │  [수동 재시도]        │
       │ POST /recordings/files/:seq/retry
       │────────────────────→│
       │                     │ ftpRetryCount < 3 확인
       │                     │ ftpStatus → RETRY
       │                     │ (다음 폴링에서 자동 처리)
       │←────────────────────│
       │                     │
       │  [상태 모니터링]      │
       │ GET /recordings/files?ftpStatus=FAILED
       │────────────────────→│
       │                     │ 실패 파일 목록 반환
       │                     │ (ftpErrorMessage, retryCount 포함)
       │←────────────────────│
```

### 1.5 녹화 상태 폴링 프로세스

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Console FE   │     │ KU_WAVE_PLAT  │     │ UNTACT-LECTURE   │
│ (실시간 모니터)│     │ (NestJS BE)   │     │ (녹화기 TCP:6060) │
└──────┬───────┘     └──────┬────────┘     └──────┬───────────┘
       │                     │                     │
       │ GET /recorders/:seq/control/status        │
       │────────────────────→│                     │
       │                     │                     │
       │                     │ TCP: Cmd=0x0000     │
       │                     │ Property=Get(0x01)  │
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ Data: 0x00=녹화중    │
       │                     │       0x01=일시정지   │
       │                     │       0x02=녹화중지   │
       │                     │                     │
       │                     │ TCP: Cmd=0x0001     │
       │                     │ Property=Get(0x01)  │
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ Data: 녹화시간 (초, Int64)│
       │                     │                     │
       │                     │ TCP: Cmd=0x0002     │
       │                     │ Property=Get(0x01)  │
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │ Data: 스토리지 용량   │
       │                     │   총 용량 (8B Int64)  │
       │                     │   가용 용량 (8B Int64) │
       │                     │                     │
       │←────────────────────│                     │
       │ { isRecording, elapsedSec, storage }      │
```

> **UI/UX 표현**: 콘솔 프론트엔드에서 5초 간격 폴링으로 실시간 녹화 상태를 시각적으로 표시.
> - 녹화 중: 빨간색 REC 인디케이터 + 경과 시간 카운터 (HH:MM:SS)
> - 일시정지: 노란색 PAUSE 인디케이터 + 시간 정지
> - 스토리지: 프로그레스 바 (사용률 %), 90% 이상 시 경고 표시
> - 오프라인: 회색 OFFLINE 배지 (TCP 통신 불가)

### 1.6 FTP 설정 등록 및 연결 테스트 프로세스

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ Console FE   │     │ KU_WAVE_PLAT  │     │ FTP Server   │
│ (관리자)      │     │ (NestJS BE)   │     │ (대상 서버)   │
└──────┬───────┘     └──────┬────────┘     └──────┬───────┘
       │                     │                     │
       │ [1] FTP 설정 등록    │                     │
       │ POST /ftp-configs   │                     │
       │ {                   │                     │
       │   ftpName,          │                     │
       │   ftpHost,          │                     │
       │   ftpPort,          │                     │
       │   ftpUsername,       │                     │
       │   ftpPassword,      │                     │
       │   ftpPath,          │                     │
       │   ftpProtocol,      │                     │
       │   ftpPassiveMode,   │                     │
       │   isDefault,        │                     │
       │   recorderSeq       │                     │
       │ }                   │                     │
       │────────────────────→│                     │
       │                     │ tb_ftp_config INSERT │
       │                     │ (isDefault='Y'이면   │
       │                     │  기존 기본 설정 해제) │
       │←────────────────────│                     │
       │ { ftpConfigSeq }    │                     │
       │                     │                     │
       │ [2] 연결 테스트      │                     │
       │ POST /ftp-configs/:seq/test               │
       │────────────────────→│                     │
       │                     │                     │
       │                     │ ┌─ ftpProtocol ─┐   │
       │                     │ │               │   │
       │                     │ FTP/FTPS     SFTP   │
       │                     │ │               │   │
       │                     │ basic-ftp    ssh2   │
       │                     │ 클라이언트   클라이언트│
       │                     │ │               │   │
       │                     │ └───────┬───────┘   │
       │                     │         │           │
       │                     │   [a] 접속 시도      │
       │                     │────────────────────→│
       │                     │                     │
       │                     │   [b] 인증           │
       │                     │   (username/password)│
       │                     │────────────────────→│
       │                     │                     │
       │                     │   [c] 경로 확인      │
       │                     │   list(ftpPath)     │
       │                     │────────────────────→│
       │                     │←────────────────────│
       │                     │                     │
       │                     │ ┌────────┴────────┐ │
       │                     │ │                 │ │
       │                     │ SUCCESS          FAIL│
       │                     │ │                 │ │
       │                     │ "연결 성공 —     "연결 실패:│
       │                     │  경로 확인 완료"  에러 메시지"│
       │                     │ │                 │ │
       │←────────────────────┴─┘                 └─┘
       │ { result, message, serverInfo, testedAt } │
       │                     │                     │
       │ [3] 설정 수정 (필요 시)                     │
       │ PUT /ftp-configs/:seq                     │
       │────────────────────→│                     │
       │                     │ tb_ftp_config UPDATE │
       │←────────────────────│                     │
       │                     │                     │
       │ [4] 녹화기별 FTP 매핑 확인                  │
       │   recorderSeq가 지정된 경우:               │
       │   해당 녹화기 전용 FTP 설정                 │
       │   recorderSeq가 NULL인 경우:               │
       │   글로벌 기본 설정 (isDefault='Y')          │
```

> **FTP 설정 우선순위**:
> 1. 녹화기 전용 설정 (`recorderSeq`가 매핑된 FTP 설정)
> 2. 글로벌 기본 설정 (`isDefault='Y'`, `recorderSeq=NULL`)
> 3. 설정 없음 → FTP 전송 스킵, 경고 로그

---

## 2. UNTACT-LECTURE 바이너리 프로토콜 정의

### 2.1 통신 기본

| 항목 | 값 |
|------|-----|
| 전송 방식 | TCP/IP |
| 포트 | **6060** (녹화기가 Server) |
| 시리얼 대안 | 115200bps, 8N1, no flow control |

### 2.2 Command Message 포맷 (BE → 녹화기)

| 필드 | 크기 | 설명 |
|------|------|------|
| Length | 4 Byte | 전체 데이터 길이 (Length 자신 포함) |
| Fixed Value | 2 Byte | `0xCD 0xA9` (고정) |
| Message ID | 2 Byte | `0x0000~0xFFFF` (요청-응답 매칭) |
| Cmd | 2 Byte | Command Type (아래 표 참조) |
| Cmd Property | 1 Byte | `0x00`=Set, `0x01`=Get, `0x02`=Execute |
| Data N | N Byte | 부가 데이터 (없을 수 있음) |
| Check Sum | 1 Byte | Length~DataN 합산 후 2의 보수 |

### 2.3 Response Message 포맷 (녹화기 → BE)

| 필드 | 크기 | 설명 |
|------|------|------|
| Length | 4 Byte | 전체 데이터 길이 |
| Fixed Value | 2 Byte | `0xCD 0xA9` |
| Message ID | 2 Byte | 요청과 동일 ID |
| Cmd | 2 Byte | 요청받은 Command Type |
| Cmd Property | 1 Byte | `0x00`=Set, `0x01`=Get, `0x02`=Execute |
| Cmd Status | 1 Byte | `0x00`=ACK, `0x01`=NACK |
| Data N | N Byte | 응답 데이터 |
| Check Sum | 1 Byte | 체크섬 |

### 2.4 사용할 Command Type

| Cmd | 이름 | Property | Data (응답) | 용도 |
|-----|------|----------|-------------|------|
| `0x0000` | 녹화 상태 | Get Only | `0x00`=녹화중, `0x01`=일시정지, `0x02`=중지 | 상태 폴링 |
| `0x0001` | 녹화 시간 | Get Only | 8 Byte Signed Int64 (초) | 경과 시간 |
| `0x0002` | 녹화 스토리지 | Get Only | 16 Byte (총 용량 8B + 가용 8B, Int64) | 저장 공간 |
| `0x0100` | 프리셋 선택 | Get/Set | 1 Byte (0-255: 프리셋 번호) | 녹화 전 프리셋 |
| `0x1000` | **녹화 시작** | Execute | ACK/NACK | 핵심 |
| `0x1001` | 녹화 일시정지 | Execute | ACK/NACK | 선택 |
| `0x1002` | **녹화 중지** | Execute | ACK/NACK | 핵심 |
| `0xF000` | 시스템 종료 | Execute | ACK/NACK | 관리 |
| `0xF001` | 시스템 재시작 | Execute | ACK/NACK | 관리 |

### 2.5 Checksum 계산 예시

```typescript
// Length ~ DataN 까지 모든 바이트를 더한 후 2의 보수
function calculateChecksum(data: Buffer): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = (sum + data[i]) & 0xFF;
  }
  return (~sum + 1) & 0xFF; // 2의 보수
}
```

### 2.6 패킷 빌드 예시 (녹화 시작)

```typescript
// 녹화 시작: Cmd=0x1000, Property=Execute(0x02), Data 없음
// Length = 4(Length) + 2(Fixed) + 2(MsgID) + 2(Cmd) + 1(Property) + 1(Checksum) = 12
const packet = Buffer.alloc(12);
packet.writeUInt32BE(12, 0);         // Length
packet.writeUInt8(0xCD, 4);          // Fixed[0]
packet.writeUInt8(0xA9, 5);          // Fixed[1]
packet.writeUInt16BE(msgId, 6);      // Message ID
packet.writeUInt16BE(0x1000, 8);     // Cmd: 녹화 시작
packet.writeUInt8(0x02, 10);         // Property: Execute
packet[11] = calculateChecksum(packet.subarray(0, 11)); // Checksum
```

---

## 3. 현재 구현 상태

| 기능 | 상태 | 위치 | 비고 |
|------|------|------|------|
| 녹화기 CRUD (등록/조회/수정/삭제) | **완료** | `recorders.service.ts` | |
| 녹화기 제어 API (HTTP 방식) | **완료** | `recorder-control.service.ts` | HTTP REST로 통신 |
| 녹화 세션 관리 (시작/종료/이력) | **완료** | `recorder-control.service.ts`, `recordings.service.ts` | |
| PTZ 제어 | **완료** | `recorder-control.service.ts` | HTTP REST |
| 프리셋 관리 (CRUD + 적용) | **완료** | `recorder-control.service.ts` | |
| FTP 설정 CRUD | **완료** | `ftp.service.ts` | POST/PUT/DELETE/GET |
| FTP 연결 테스트 | **완료** | `ftp.service.ts` (testConnection) | FTP/SFTP/FTPS 지원 |
| 녹화 파일 이력 조회 | **완료** | `recordings.service.ts` | |
| FTP 업로드 재시도 (상태만 변경) | **완료** | `recordings.service.ts` (retryUpload) | 상태값만 RETRY로 변경, 실제 전송 미구현 |
| 녹화기 헬스체크 | **완료** | `recorder-health.service.ts` | |
| **UNTACT-LECTURE 바이너리 프로토콜 통신** | **미구현** | — | 핵심 개발 대상 |
| **녹화 시작/종료 TCP 바이너리 명령** | **미구현** | — | Cmd 0x1000/0x1002 |
| **녹화 상태/시간/스토리지 실시간 조회** | **미구현** | — | Cmd 0x0000/0x0001/0x0002 |
| **프리셋 TCP 바이너리 적용** | **미구현** | — | Cmd 0x0100 |
| **녹화 종료 시 파일 레코드 PENDING 생성** | **미구현** | — | 녹화 종료 → tb_recording_file INSERT |
| **FTP 업로드 Job (상태 기반 폴링)** | **미구현** | — | PENDING/RETRY 상태 파일 자동 처리 |
| **FTP 실제 파일 전송 (녹화기→서버→FTP)** | **미구현** | — | 다운로드 + 업로드 |
| **FTP 전송 실패 자동 재시도** | **미구현** | — | FAILED → RETRY (3회 미만) |
| **FTP 업로드 재시도 실제 로직** | **미구현** | — | 현재 상태만 변경 |

---

## 4. 개발 범위

> **메뉴 구조 (GNB > LNB)**:
> 본 개발의 모든 프로세스는 아래 메뉴 구조에 매핑되어 적용됨.
>
> ```
> GNB: 녹화기관리 (recorder, 🎥 Video)
> └── LNB:
>     ├── 녹화기 목록       /recorder/list      (📷 Camera)     — 녹화기 CRUD, 프리셋 관리
>     ├── 녹화기 제어       /recorder/control   (🎯 Crosshair)  — 녹화 시작/종료, PTZ, 실시간 상태 [Phase 1,2]
>     ├── 녹화 이력        /recorder/history   (🕐 History)    — 세션 이력 조회
>     ├── 녹화 파일        /recorder/files     (🎬 FileVideo)  — 파일 목록, FTP 상태, 미리보기, 다운로드, 재시도 [Phase 3]
>     └── FTP 설정         /recorder/ftp       (📤 Upload)     — FTP 설정 CRUD, 연결 테스트, 녹화기 매핑 [Phase 3]
> ```

### 4.1 [핵심] UNTACT-LECTURE 바이너리 프로토콜 서비스

**신규 파일**: `apps/api/src/modules/recorders/services/recorder-protocol.service.ts`

UNTACT-LECTURE 녹화기와 TCP 6060 포트로 바이너리 프로토콜 통신을 담당하는 서비스.

```typescript
// recorder-protocol.service.ts
@Injectable()
export class RecorderProtocolService {
  // 패킷 빌드/파싱 유틸
  private buildPacket(cmd: number, property: number, data?: Buffer): Buffer;
  private parseResponse(buffer: Buffer): { cmd: number; status: number; data: Buffer };
  private calculateChecksum(data: Buffer): number;

  // TCP 연결 + 명령 전송 + 응답 수신
  async sendCommand(ip: string, port: number, cmd: number, property: number, data?: Buffer): Promise<ProtocolResponse>;

  // 고수준 API
  async startRecording(ip: string, port: number): Promise<boolean>;     // 0x1000
  async stopRecording(ip: string, port: number): Promise<boolean>;      // 0x1002
  async pauseRecording(ip: string, port: number): Promise<boolean>;     // 0x1001
  async getRecordingStatus(ip: string, port: number): Promise<RecordingStatusResult>;  // 0x0000
  async getRecordingTime(ip: string, port: number): Promise<number>;    // 0x0001, 초 단위
  async getStorageInfo(ip: string, port: number): Promise<StorageInfo>; // 0x0002
  async setPreset(ip: string, port: number, presetNumber: number): Promise<boolean>;  // 0x0100
  async getPreset(ip: string, port: number): Promise<number>;          // 0x0100
}
```

**응답 타입:**

```typescript
interface ProtocolResponse {
  success: boolean;      // ACK=true, NACK=false
  cmd: number;
  messageId: number;
  data: Buffer;
}

interface RecordingStatusResult {
  status: 'RECORDING' | 'PAUSED' | 'STOPPED';
  rawValue: number;
}

interface StorageInfo {
  totalBytes: bigint;
  availableBytes: bigint;
  usedPercent: number;
}
```

### 4.2 [핵심] recorder-control.service.ts 프로토콜 통합

현재 HTTP REST 방식 → UNTACT-LECTURE 바이너리 프로토콜로 전환.

```typescript
// recorder-control.service.ts 수정
async startRecording(recorderSeq: number, dto: RecordingStartDto, tuSeq?: number) {
  const recorder = await this.getOnlineRecorder(recorderSeq);

  // ... 기존 validation 유지 ...

  const port = recorder.recorderPort ?? 6060;

  // 프리셋 적용 (TCP 바이너리) — NACK 시 녹화 시작 중단
  if (dto.recPresetSeq) {
    const preset = await this.presetRepo.findOne({ ... });
    const presetAck = await this.protocolService.setPreset(
      recorder.recorderIp, port, preset.presetNumber,
    );
    if (!presetAck) {
      throw new UnprocessableEntityException('프리셋 적용이 거부되었습니다 (NACK)');
    }
  }

  // 녹화 시작 (TCP 바이너리)
  const ack = await this.protocolService.startRecording(recorder.recorderIp, port);
  if (!ack) {
    throw new UnprocessableEntityException('녹화기가 녹화 시작 명령을 거부했습니다 (NACK)');
  }

  // ACK 후 DB 저장 — 실패 시 녹화 중지 롤백
  try {
    // ... 세션 생성, 사용자 선점, 로그 저장 (기존 로직) ...
  } catch (dbError) {
    // DB 실패 → 녹화기에 중지 명령 전송 (녹화기만 녹화 중인 불일치 방지)
    this.logger.error(`DB 저장 실패, 녹화 중지 롤백: ${dbError.message}`);
    await this.protocolService.stopRecording(recorder.recorderIp, port).catch(() => {});
    throw dbError;
  }
}
```

### 4.3 [핵심] 녹화 종료 → 파일 레코드 생성 (FTP와 분리)

녹화 종료 시 세션 상태만 업데이트하고, 녹화 파일 레코드를 `PENDING` 상태로 생성.
FTP 업로드는 트리거하지 않음 — 별도 FTP Job이 상태값으로 처리.

```typescript
// recorder-control.service.ts — stopRecording() 수정
async stopRecording(recorderSeq: number, tuSeq?: number) {
  const recorder = await this.getRecorder(recorderSeq);

  const session = await this.sessionRepo.findOne({
    where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
  });
  if (!session) {
    throw new NotFoundException('진행 중인 녹화 세션이 없습니다.');
  }

  // [1] 녹화 종료 (TCP 바이너리)
  const ack = await this.protocolService.stopRecording(
    recorder.recorderIp,
    recorder.recorderPort ?? 6060,
  );

  if (!ack) {
    throw new UnprocessableEntityException('녹화기가 녹화 종료 명령을 거부했습니다 (NACK)');
  }

  // [2] 세션 종료
  const endedAt = new Date();
  const durationSec = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
  session.sessionStatus = SessionStatus.COMPLETED;
  session.endedAt = endedAt;
  session.durationSec = durationSec;
  await this.sessionRepo.save(session);

  // [3] 사용자 선점 해제
  await this.recorderRepo.update(recorderSeq, { currentUserSeq: null });

  // [4] 녹화 파일 레코드 생성 (PENDING 상태 — FTP Job이 나중에 처리)
  const ftpConfig = await this.ftpService.getConfigForRecorder(recorderSeq);
  const timestamp = endedAt.toISOString().replace(/[-:T]/g, '').slice(0, 14); // 20260315143022
  const safeTitle = (session.sessionTitle ?? 'recording').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  const recordingFile = this.recordingFileRepo.create({
    recSessionSeq: session.recSessionSeq,
    fileName: `${safeTitle}_${timestamp}.mp4`,          // 중복 방지: 타임스탬프 포함
    filePath: `/recordings/${recorder.recorderIp}/${timestamp}/`, // 녹화기 내 파일 경로 (녹화기 FTP 기본 저장 경로)
    fileFormat: 'mp4',
    ftpStatus: FtpStatus.PENDING,
    ftpConfigSeq: ftpConfig?.ftpConfigSeq ?? null,
  });
  await this.recordingFileRepo.save(recordingFile);

  // [5] 로그 저장
  await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '녹화 종료 완료');

  return {
    recSessionSeq: session.recSessionSeq,
    sessionStatus: session.sessionStatus,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSec,
    message: `녹화가 종료되었습니다 (${Math.floor(durationSec / 60)}분)`,
  };
  // NOTE: FTP 업로드는 여기서 트리거하지 않음.
  // FTP Job이 ftpStatus='PENDING'인 파일을 감지하여 독립적으로 처리.
}
```

### 4.4 [핵심] FTP 업로드 Job (상태 기반 독립 프로세스) + UI/UX 표현

`tb_recording_file.ftp_status` 상태값을 기준으로 독립적으로 동작하는 FTP 업로드 프로세스.
녹화 종료와 완전히 분리되어, 상태값만으로 업로드 실행/재시도를 관리.

**실제 FTP 업로드 흐름:**
1. FTP Job이 `PENDING`/`RETRY` 파일 감지
2. 녹화기 FTP 서버에 접속하여 녹화 파일을 서버 로컬(`/tmp/recordings/`)로 다운로드
3. 대상 FTP 서버에 접속하여 실제 파일 업로드 (basic-ftp 또는 ssh2-sftp-client)
4. 업로드 완료 시 `ftpStatus → COMPLETED`, `ftpUploadedPath`, `ftpUploadedAt` 기록
5. 임시 파일 삭제

**FE UI/UX — 녹화 파일 페이지 (`/recorder/files`)에서 실시간 FTP 상태 표시:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 녹화기관리 > 녹화 파일                                    [FTP상태 필터 ▼]│
├──────┬──────────────────┬────────┬──────────┬────────────┬─────────────┤
│ No   │ 파일명            │ 크기   │ 녹화시간  │ FTP 상태    │ 액션        │
├──────┼──────────────────┼────────┼──────────┼────────────┼─────────────┤
│ 1    │ 강의_03-15.mp4   │ 1.2 GB │ 45분     │ ⏳ 대기     │ 👁 ⬇       │
│      │                  │        │          │ (PENDING)  │             │
├──────┼──────────────────┼────────┼──────────┼────────────┼─────────────┤
│ 2    │ 강의_03-14.mp4   │ 890 MB │ 30분     │ 🔄 업로드중  │ 👁 ⬇       │
│      │                  │        │          │ (UPLOADING)│             │
├──────┼──────────────────┼────────┼──────────┼────────────┼─────────────┤
│ 3    │ 강의_03-13.mp4   │ 2.1 GB │ 1시간    │ ✅ 완료     │ 👁 ⬇       │
│      │                  │        │          │ (COMPLETED)│             │
├──────┼──────────────────┼────────┼──────────┼────────────┼─────────────┤
│ 4    │ 강의_03-12.mp4   │ 1.5 GB │ 50분     │ ❌ 실패     │ 👁 ⬇ 🔁    │
│      │                  │        │          │ 2/3회 시도  │ [재시도]     │
│      │                  │        │          │ Connection │             │
│      │                  │        │          │ refused    │             │
└──────┴──────────────────┴────────┴──────────┴────────────┴─────────────┘
```

**FTP 상태별 UI 표현:**

| ftpStatus | 배지 | 색상 | 아이콘 | 추가 정보 | 액션 |
|-----------|------|------|--------|----------|------|
| `PENDING` | `⏳ 대기` | 회색 (muted) | Clock | — | — |
| `UPLOADING` | `🔄 업로드중` | 파란색 | Loader2 (스피너) | — | — |
| `COMPLETED` | `✅ 완료` | 초록색 | CheckCircle | 업로드 시각 표시 | — |
| `RETRY` | `🔁 재시도 대기` | 노란색 | RefreshCw | `(N/3회)` | — |
| `FAILED` | `❌ 실패` | 빨간색 | XCircle | 에러 메시지 + `(N/3회)` | 🔁 재시도 버튼 |

**FE 폴링**: 파일 목록 페이지에서 `PENDING` 또는 `UPLOADING` 상태 파일이 있으면 **10초 간격 자동 리페치**로 상태 갱신.
`COMPLETED`/`FAILED`만 남으면 폴링 중단.

**재시도 버튼 동작:**
- `FAILED` 상태 + `ftpRetryCount < 3`인 파일에만 재시도 버튼 노출
- 클릭 시 `POST /recordings/files/:seq/retry-upload` 호출
- `ftpStatus → RETRY`로 변경 → FTP Job이 다음 폴링에서 자동 처리
- `ftpRetryCount >= 3`이면 버튼 비활성화 + "최대 재시도 초과" 툴팁

**신규 파일**: `apps/api/src/modules/ftp/ftp-upload-job.service.ts`

```typescript
@Injectable()
export class FtpUploadJobService implements OnModuleInit {
  private readonly logger = new Logger(FtpUploadJobService.name);
  private readonly POLL_INTERVAL_MS = 30000; // 30초 간격 폴링
  private readonly MAX_RETRY_COUNT = 3;
  private isProcessing = false;

  constructor(
    @InjectRepository(TbRecordingFile)
    private readonly fileRepo: Repository<TbRecordingFile>,
    private readonly ftpService: FtpService,
  ) {}

  async onModuleInit() {
    // 서버 재시작 시 UPLOADING 상태로 stuck된 파일 복구
    const stuckCount = await this.fileRepo.update(
      { ftpStatus: FtpStatus.UPLOADING },
      { ftpStatus: FtpStatus.RETRY },
    );
    if (stuckCount.affected > 0) {
      this.logger.warn(`Recovered ${stuckCount.affected} stuck UPLOADING files → RETRY`);
    }

    // 주기적으로 PENDING/RETRY 상태 파일 처리
    setInterval(() => this.processQueue(), this.POLL_INTERVAL_MS);
    this.logger.log('FTP Upload Job started (30초 간격 폴링)');
  }

  /**
   * PENDING 또는 RETRY 상태인 파일을 조회하여 순차적으로 FTP 업로드 실행
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return; // 중복 실행 방지
    this.isProcessing = true;

    try {
      const pendingFiles = await this.fileRepo.find({
        where: [
          { ftpStatus: FtpStatus.PENDING, fileIsdel: 'N' },
          { ftpStatus: FtpStatus.RETRY, fileIsdel: 'N' },
        ],
        order: { regDate: 'ASC' },
      });

      for (const file of pendingFiles) {
        if (file.ftpRetryCount >= this.MAX_RETRY_COUNT) {
          // 최대 재시도 초과 → FAILED 고정
          await this.fileRepo.update(file.recFileSeq, {
            ftpStatus: FtpStatus.FAILED,
            ftpErrorMessage: '최대 재시도 횟수 초과 (3회)',
          });
          continue;
        }

        await this.processFile(file);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 개별 파일 FTP 업로드 처리
   */
  private async processFile(file: TbRecordingFile): Promise<void> {
    // [0] ftpConfigSeq가 null이면 FTP 설정 없음 → FAILED 처리
    if (!file.ftpConfigSeq) {
      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: FtpStatus.FAILED,
        ftpErrorMessage: 'FTP 설정이 매핑되지 않았습니다. 녹화기 FTP 설정을 확인하세요.',
      });
      this.logger.warn(`No FTP config for file ${file.recFileSeq} — skipped`);
      return;
    }

    // [1] 상태 → UPLOADING
    await this.fileRepo.update(file.recFileSeq, {
      ftpStatus: FtpStatus.UPLOADING,
    });

    try {
      // [2] FTP 설정 조회
      const ftpConfig = await this.ftpService.findOne(file.ftpConfigSeq);

      // [3] 녹화기에서 파일 다운로드 + 대상 FTP로 업로드
      const uploadedPath = await this.ftpService.downloadAndUpload(
        ftpConfig,
        file.filePath,
        file.fileName,
      );

      // [4] 성공 → COMPLETED
      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: FtpStatus.COMPLETED,
        ftpUploadedPath: uploadedPath,
        ftpUploadedAt: new Date(),
        ftpErrorMessage: null,
      });

      this.logger.log(`FTP upload completed: ${file.fileName}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const newRetryCount = file.ftpRetryCount + 1;

      // [5] 실패 → 3회 미만이면 RETRY, 이상이면 FAILED
      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: newRetryCount < this.MAX_RETRY_COUNT
          ? FtpStatus.RETRY
          : FtpStatus.FAILED,
        ftpRetryCount: newRetryCount,
        ftpErrorMessage: err?.message ?? '알 수 없는 오류',
      });

      this.logger.warn(
        `FTP upload failed (${newRetryCount}/${this.MAX_RETRY_COUNT}): ${file.fileName} — ${err?.message}`,
      );
    }
  }
}
```

**FTP 상태 전이 다이어그램:**

```
                    녹화 종료
                       │
                       ▼
                   ┌────────┐
                   │PENDING │ ← 최초 생성
                   └───┬────┘
                       │ FTP Job 폴링
                       ▼
                  ┌──────────┐
                  │UPLOADING │ ← 업로드 진행 중
                  └────┬─────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
         ┌──────────┐    ┌──────────┐
         │COMPLETED │    │  FAILED  │
         │ (최종)    │    │          │
         └──────────┘    └────┬─────┘
                              │ retryCount < 3?
                     ┌────────┴────────┐
                     │ YES             │ NO
                     ▼                 ▼
                ┌─────────┐      ┌──────────┐
                │  RETRY  │      │  FAILED  │
                │         │      │ (최종)    │
                └────┬────┘      └──────────┘
                     │ FTP Job 폴링        ↑
                     │                     │ 관리자 수동
                     └──→ UPLOADING ───────┘
```

### 4.5 [핵심] FTP 실제 전송 로직


**수정 파일**: `apps/api/src/modules/ftp/ftp.service.ts`

```typescript
// ftp.service.ts에 추가

/**
 * 녹화기 전용 또는 글로벌 기본 FTP 설정 조회
 * 우선순위: 녹화기 전용 > 글로벌 기본(isDefault='Y')
 */
async getConfigForRecorder(recorderSeq: number): Promise<TbFtpConfig | null> {
  // 1. 녹화기 전용 설정
  const dedicated = await this.ftpConfigRepo.findOne({
    where: { recorderSeq, ftpIsdel: 'N' },
  });
  if (dedicated) return dedicated;

  // 2. 글로벌 기본 설정
  const defaultConfig = await this.ftpConfigRepo.findOne({
    where: { isDefault: 'Y', ftpIsdel: 'N' },
  });
  return defaultConfig ?? null;
}

/**
 * 녹화기 FTP에서 파일 다운로드 → 대상 FTP 서버로 업로드
 * @returns 업로드된 FTP 경로
 */
async downloadAndUpload(
  config: TbFtpConfig,
  recorderFilePath: string,
  fileName: string,
): Promise<string> {
  // [1] 녹화기 FTP에서 서버 로컬 임시 디렉토리로 다운로드
  const localTmpPath = `/tmp/recordings/${Date.now()}_${fileName}`;
  await this.downloadFile(config, recorderFilePath, localTmpPath);

  try {
    // [2] 서버 로컬에서 대상 FTP로 업로드
    const uploadPath = `${config.ftpPath ?? '/'}/${fileName}`;
    await this.uploadFile(config, localTmpPath, uploadPath);
    return uploadPath;
  } finally {
    // [3] 임시 파일 정리
    await this.cleanupTmpFile(localTmpPath);
  }
}

/**
 * FTP/SFTP에서 파일 다운로드
 */
private async downloadFile(
  config: TbFtpConfig,
  remotePath: string,
  localPath: string,
): Promise<void> {
  if (config.ftpProtocol === 'SFTP') {
    // ssh2-sftp-client 사용
  } else {
    // basic-ftp 사용
  }
}

/**
 * FTP/SFTP로 파일 업로드
 */
private async uploadFile(
  config: TbFtpConfig,
  localPath: string,
  remotePath: string,
): Promise<void> {
  if (config.ftpProtocol === 'SFTP') {
    // ssh2-sftp-client 사용
  } else {
    // basic-ftp 사용
  }
}
```

### 4.6 [선택] 실시간 상태 조회 강화

콘솔 프론트엔드에서 녹화기 상태를 실시간으로 모니터링하기 위한 BE 상태 조회 강화.

```typescript
// recorder-control.service.ts — getStatus() 수정
async getStatus(recorderSeq: number) {
  const recorder = await this.getRecorder(recorderSeq);

  // 기존 세션 정보
  const session = await this.sessionRepo.findOne({
    where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
  });

  // 녹화기 실시간 상태 (TCP 바이너리 프로토콜)
  // ⚠ 순차 실행 필수: 임베디드 녹화기가 동시 TCP 연결을 지원하지 않을 수 있음
  // 대안: 하나의 TCP 연결에서 3개 명령을 연속 전송하는 getFullStatus() 사용
  let liveStatus = null;
  if (recorder.recorderStatus !== RecorderStatus.OFFLINE) {
    try {
      const port = recorder.recorderPort ?? 6060;
      const recStatus = await this.protocolService.getRecordingStatus(recorder.recorderIp, port);
      const recTime = await this.protocolService.getRecordingTime(recorder.recorderIp, port);
      const storageInfo = await this.protocolService.getStorageInfo(recorder.recorderIp, port);
      liveStatus = {
        recordingStatus: recStatus.status,    // 'RECORDING' | 'PAUSED' | 'STOPPED'
        elapsedSec: recTime,                  // 경과 시간 (초)
        elapsedFormatted: this.formatDuration(recTime), // "01:23:45"
        storage: {
          totalBytes: storageInfo.totalBytes,
          availableBytes: storageInfo.availableBytes,
          usedPercent: storageInfo.usedPercent,
          isWarning: storageInfo.usedPercent >= 90,  // 90% 이상 경고
        },
      };
    } catch {
      // 녹화기 통신 불가 — liveStatus = null (UI에서 OFFLINE 표시)
    }
  }

  // FTP 업로드 진행 상태 (최근 파일 기준)
  const recentFiles = session ? await this.recordingFileRepo.find({
    where: { recSessionSeq: session.recSessionSeq, fileIsdel: 'N' },
    order: { regDate: 'DESC' },
    take: 5,
  }) : [];

  return {
    recorderSeq: recorder.recorderSeq,
    recorderName: recorder.recorderName,
    recorderStatus: recorder.recorderStatus,
    isRecording: !!session,
    currentSession: session ? {
      recSessionSeq: session.recSessionSeq,
      sessionTitle: session.sessionTitle,
      startedAt: session.startedAt,
    } : null,
    currentUser: recorder.currentUser
      ? { tuSeq: recorder.currentUser.seq, tuName: recorder.currentUser.name }
      : null,
    lastHealthCheck: recorder.lastHealthCheck,
    liveStatus,
    recentFiles: recentFiles.map((f) => ({
      recFileSeq: f.recFileSeq,
      fileName: f.fileName,
      ftpStatus: f.ftpStatus,
      ftpRetryCount: f.ftpRetryCount,
    })),
  };
}

// UI/UX 표현을 위한 시간 포맷
private formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
```

> **FE UI/UX 가이드 (참고):**
>
> | 상태 | 표시 | 색상 |
> |------|------|------|
> | RECORDING | `🔴 REC 01:23:45` | 빨간색, 점멸 애니메이션 |
> | PAUSED | `⏸ PAUSE 01:23:45` | 노란색, 시간 정지 |
> | STOPPED | `⏹ READY` | 초록색 |
> | OFFLINE | `OFFLINE` | 회색 |
> | 스토리지 90%+ | `⚠ 스토리지 경고 (92%)` | 주황색 경고 배너 |
> | FTP PENDING | `📤 업로드 대기` | 회색 |
> | FTP UPLOADING | `📤 업로드 중...` | 파란색, 스피너 |
> | FTP COMPLETED | `✅ 업로드 완료` | 초록색 |
> | FTP FAILED | `❌ 업로드 실패 (2/3회)` | 빨간색, 재시도 버튼 |

---

## 5. 파일 변경 목록

### BE (apps/api)

| 파일 | 변경 | 설명 |
|------|------|------|
| `modules/recorders/services/recorder-protocol.service.ts` | **신규** | UNTACT-LECTURE 바이너리 프로토콜 통신 서비스 |
| `modules/recorders/interfaces/protocol.interface.ts` | **신규** | 프로토콜 응답 타입, 상수 정의 |
| `modules/ftp/ftp-upload-job.service.ts` | **신규** | FTP 업로드 Job (상태 기반 폴링, 자동 재시도) |
| `modules/recorders/recorder-control.service.ts` | 수정 | HTTP → TCP 바이너리 전환, 녹화 종료 시 파일 PENDING 생성 |
| `modules/recorders/recorders.module.ts` | 수정 | RecorderProtocolService, FtpModule import 추가 |
| `modules/ftp/ftp.service.ts` | 수정 | getConfigForRecorder, downloadAndUpload, downloadFile, uploadFile 추가 |
| `modules/ftp/ftp.module.ts` | 수정 | FtpUploadJobService providers 추가 |
| `modules/recordings/recordings.service.ts` | 수정 | retryUpload에서 ftpStatus → RETRY로 변경 (Job이 처리) |

### 변경 없음

| 항목 | 이유 |
|------|------|
| Entity 파일들 | 기존 `tb_recorder`, `tb_recording_session`, `tb_recording_file`, `tb_ftp_config` 그대로 사용 |
| Enum 파일들 | 기존 `SessionStatus`, `FtpStatus`(PENDING/UPLOADING/COMPLETED/FAILED/RETRY), `RecorderLogType` 그대로 사용 |
| Controller 파일들 | API 인터페이스 변경 없음 (내부 구현만 변경) |
| DB 스키마 | 테이블 생성/변경 없음 |

---

## 6. 시나리오별 상세 흐름

### 6.1 시나리오 A: 녹화 시작 (프리셋 포함)

```
관리자가 콘솔에서 녹화 시작 버튼 클릭
→ POST /recorders/1/control/record/start { recPresetSeq: 3, sessionTitle: "3월 15일 강의" }
→ BE: 녹화기 ONLINE 확인 + 선점 확인
→ BE: TCP 6060 연결 → 프리셋 적용 (Cmd=0x0100, Set, Data=0x03) → ACK
→ BE: TCP 6060 연결 → 녹화 시작 (Cmd=0x1000, Execute) → ACK
→ BE: tb_recording_session INSERT (RECORDING)
→ BE: tb_recorder UPDATE (currentUserSeq)
→ BE: tb_recorder_log INSERT (REC_START, SUCCESS)
→ Response: { recSessionSeq, sessionStatus: "RECORDING", startedAt, message: "녹화가 시작되었습니다" }
```

### 6.2 시나리오 B: 녹화 종료 (FTP와 독립)

```
관리자가 콘솔에서 녹화 종료 버튼 클릭
→ POST /recorders/1/control/record/stop
→ BE: TCP 6060 연결 → 녹화 종료 (Cmd=0x1002, Execute) → ACK
→ BE: tb_recording_session UPDATE (COMPLETED, endedAt, durationSec)
→ BE: tb_recorder UPDATE (currentUserSeq: null)
→ BE: tb_recording_file INSERT (ftpStatus: PENDING, ftpConfigSeq: 매핑된 설정)
→ BE: tb_recorder_log INSERT (REC_STOP, SUCCESS)
→ Response: { recSessionSeq, sessionStatus: "COMPLETED", durationSec, message: "녹화가 종료되었습니다 (45분)" }
→ NOTE: 여기서 FTP 업로드를 트리거하지 않음. 파일은 PENDING 상태로 남음.
```

### 6.3 시나리오 C: FTP Job이 PENDING 파일 자동 업로드

```
[30초 후] FTP Upload Job 폴링 실행
→ BE: tb_recording_file WHERE ftpStatus IN ('PENDING', 'RETRY') 조회
→ 파일 발견: recFileSeq=42, ftpStatus=PENDING
→ BE: ftpStatus → UPLOADING
→ BE: FTP 설정 조회 (ftpConfigSeq → tb_ftp_config)
→ BE: 녹화기 FTP 접속 → 파일 다운로드 → /tmp/recordings/에 저장
→ BE: 대상 FTP 서버 접속 → 파일 업로드
→ 성공 시:
  → BE: ftpStatus → COMPLETED, ftpUploadedPath, ftpUploadedAt 기록
→ 실패 시:
  → BE: ftpStatus → RETRY, ftpRetryCount=1, ftpErrorMessage 기록
  → [다음 30초 폴링에서 자동 재시도]
```

### 6.4 시나리오 D: FTP 전송 실패 → 자동 재시도 → 최종 실패

```
[1차 시도] FTP Job 폴링 → PENDING → UPLOADING → 실패
→ ftpStatus: RETRY, ftpRetryCount: 1

[2차 시도, 30초 후] FTP Job 폴링 → RETRY → UPLOADING → 실패
→ ftpStatus: RETRY, ftpRetryCount: 2

[3차 시도, 30초 후] FTP Job 폴링 → RETRY → UPLOADING → 실패
→ ftpStatus: FAILED, ftpRetryCount: 3, ftpErrorMessage: "Connection refused"
→ 더 이상 자동 재시도 안 함

→ 관리자가 콘솔에서 실패 파일 확인
  GET /recordings/files?ftpStatus=FAILED
→ 관리자가 FTP 설정 수정 후 수동 재시도
  POST /recordings/files/42/retry
→ BE: ftpStatus → RETRY (ftpRetryCount는 초기화하지 않음)
→ [다음 폴링에서 재시도 — 단, retryCount ≥ 3이면 FAILED 유지]
```

### 6.5 시나리오 E: 녹화기 NACK 응답

```
녹화 시작 명령 전송
→ BE: TCP 6060 → 녹화 시작 (Cmd=0x1000, Execute) → NACK
→ BE: tb_recorder_log INSERT (REC_START, FAIL)
→ Response: 422 "녹화기가 녹화 시작 명령을 거부했습니다 (NACK)"
```

### 6.6 시나리오 F: 녹화기 연결 불가

```
녹화 시작 명령 전송
→ BE: TCP 6060 연결 시도 → ETIMEDOUT / ECONNREFUSED
→ BE: tb_recorder_log INSERT (REC_START, TIMEOUT)
→ Response: 504 "녹화기 응답 시간 초과"
```

### 6.7 시나리오 G: FTP 설정 등록 및 연결 테스트

```
[1단계: FTP 설정 등록]
관리자가 콘솔에서 시스템 설정 > FTP 관리 진입
→ POST /ftp-configs
  {
    ftpName: "건물A 녹화 서버",
    ftpHost: "192.168.1.100",
    ftpPort: 21,
    ftpUsername: "recorder",
    ftpPassword: "p@ssw0rd",
    ftpPath: "/recordings/buildingA",
    ftpProtocol: "FTP",        // FTP | SFTP | FTPS
    ftpPassiveMode: "Y",
    isDefault: "N",
    recorderSeq: 1             // 녹화기 전용 (null이면 글로벌)
  }
→ BE: isDefault='Y'이면 기존 기본 설정 해제 (UPDATE isDefault='N')
→ BE: tb_ftp_config INSERT
→ Response: { ftpConfigSeq: 5, ftpName, ftpHost, ftpPort, ftpProtocol, regDate }

[2단계: 연결 테스트]
→ POST /ftp-configs/5/test
→ BE: ftpProtocol 확인
  → FTP/FTPS: basic-ftp 클라이언트로 접속
    - host, port, user, password로 access()
    - FTPS면 secure: true + rejectUnauthorized: false
    - passiveMode 설정
    - list(ftpPath)로 경로 존재 확인
  → SFTP: ssh2-sftp-client로 접속
    - host, port, username, password로 connect()
    - list(ftpPath)로 경로 존재 확인
→ 성공 시:
  Response: {
    result: "SUCCESS",
    message: "FTP 연결 성공 — 경로 '/recordings/buildingA' 확인 완료",
    serverInfo: "FileZilla Server 1.8.0",
    testedAt: "2026-03-15T10:30:00Z"
  }
→ 실패 시:
  Response: {
    result: "FAIL",
    message: "FTP 연결 실패: ECONNREFUSED — 호스트 또는 포트를 확인하세요",
    testedAt: "2026-03-15T10:30:00Z"
  }

[3단계: 설정 수정 (실패 시)]
→ PUT /ftp-configs/5 { ftpPort: 2121 }
→ POST /ftp-configs/5/test (재테스트)
→ Response: { result: "SUCCESS", ... }

[4단계: 녹화기별 FTP 매핑 확인]
→ GET /ftp-configs
→ Response: {
    items: [
      { ftpConfigSeq: 5, ftpName: "건물A 녹화 서버", recorderSeq: 1, recorderName: "녹화기1", isDefault: "N" },
      { ftpConfigSeq: 1, ftpName: "기본 FTP", recorderSeq: null, recorderName: null, isDefault: "Y" },
    ]
  }
```

> **FTP 설정 우선순위 (getConfigForRecorder 로직):**
> 1. `recorderSeq`가 매핑된 전용 설정 → 최우선 사용
> 2. `isDefault='Y'` 글로벌 기본 설정 → 전용 설정 없을 때 사용
> 3. 설정 없음 → 녹화 파일의 `ftpConfigSeq=NULL`, FTP Job이 스킵, 관리자에게 경고 로그

### 6.8 시나리오 H: 실시간 녹화 상태 모니터링

```
관리자가 콘솔에서 녹화기 상태 페이지 진입
→ GET /recorders/1/control/status (5초 간격 자동 폴링)
→ BE: TCP 6060 → 녹화 상태 조회 (Cmd=0x0000) → 0x00 (녹화중)
→ BE: TCP 6060 → 녹화 시간 조회 (Cmd=0x0001) → 2700초
→ BE: TCP 6060 → 스토리지 조회 (Cmd=0x0002) → 총 500GB / 가용 120GB
→ Response: {
    recorderName: "건물A-301호",
    recorderStatus: "ONLINE",
    isRecording: true,
    currentSession: { recSessionSeq: 10, sessionTitle: "3월 15일 강의", startedAt: "..." },
    liveStatus: {
      recordingStatus: "RECORDING",
      elapsedSec: 2700,
      elapsedFormatted: "00:45:00",
      storage: {
        totalBytes: 536870912000,
        availableBytes: 128849018880,
        usedPercent: 76,
        isWarning: false
      }
    },
    recentFiles: [
      { recFileSeq: 42, fileName: "강의_2026-03-15", ftpStatus: "COMPLETED", ftpRetryCount: 0 },
      { recFileSeq: 41, fileName: "강의_2026-03-14", ftpStatus: "FAILED", ftpRetryCount: 3 },
    ]
  }

→ FE에서 표시:
  ┌─────────────────────────────────────────┐
  │ 🔴 REC  00:45:00     건물A-301호        │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 스토리지 76%          │
  │                                         │
  │ 최근 파일:                               │
  │ ✅ 강의_2026-03-15.mp4  업로드 완료      │
  │ ❌ 강의_2026-03-14.mp4  업로드 실패 [재시도]│
  └─────────────────────────────────────────┘
```
### 6.9 시나리오 I: 녹화 파일 미리보기 및 다운로드

```
[미리보기]
관리자가 콘솔에서 녹화기관리 > 녹화 파일 페이지 진입
→ GET /recordings/files (파일 목록 조회, ftpStatus별 필터 가능)
→ 파일 행에서 👁 미리보기 아이콘 클릭
→ GET /recordings/files/42/preview
→ BE: tb_recording_file 조회 + 권한 확인 (녹화 진행자만 접근)
→ Response: {
    recFileSeq: 42,
    fileName: "강의_2026-03-15.mp4",
    fileFormat: "mp4",
    fileDurationSec: 2700,
    fileSize: "1073741824",
    fileSizeFormatted: "1.0 GB",
    previewPath: "/recordings/buildingA/강의_2026-03-15.mp4"
  }
→ FE: 미리보기 다이얼로그 표시
  ┌─────────────────────────────────────────┐
  │ 🎬 강의_2026-03-15.mp4                  │
  ├─────────────────────────────────────────┤
  │ ┌─────────────────────────────────────┐ │
  │ │        🎥 비디오 플레이어            │ │
  │ │     (스트리밍 미리보기 영역)          │ │
  │ └─────────────────────────────────────┘ │
  │ 파일명:   강의_2026-03-15.mp4           │
  │ 녹화시간: 45분 0초                      │
  │ 파일크기: 1.0 GB                        │
  │ 저장경로: /recordings/buildingA/...     │
  └─────────────────────────────────────────┘

[다운로드]
→ 파일 행에서 ⬇ 다운로드 아이콘 클릭
→ GET /recordings/files/42/download
→ BE: 권한 확인 (녹화 진행자만 접근)
→ Response: {
    recFileSeq: 42,
    fileName: "강의_2026-03-15.mp4",
    filePath: "/recorder-storage/2026/03/15/강의.mp4",
    fileSize: "1073741824",
    fileFormat: "mp4",
    ftpUploadedPath: "/recordings/buildingA/강의_2026-03-15.mp4"
  }
→ FE: ftpUploadedPath 또는 filePath로 파일 다운로드 실행
```

> **미리보기/다운로드 접근 제어**:
> - 녹화를 진행한 사용자(`tb_recording_session.tu_seq`)만 미리보기/다운로드 가능
> - 다른 사용자 접근 시 403 Forbidden 반환
> - 관리자(admin) 역할은 모든 파일 접근 가능 (추후 확장)

> **현재 구현 상태**:
> - BE API: `getFileForPreview()`, `getFileForDownload()` 완료 (`recordings.service.ts`)
> - FE 미리보기 다이얼로그: `file-preview-dialog.tsx` 완료 (메타데이터 표시)
> - FE 다운로드 버튼: `file-download-button.tsx` 완료
> - **미구현**: 실제 비디오 스트리밍 플레이어 (현재 placeholder)

---

## 7. 상세 할 일 목록

### Phase 1: UNTACT-LECTURE 바이너리 프로토콜 서비스

- [x] **1-1** `interfaces/protocol.interface.ts` 신규 작성:
  - [x] 1-1a: `ProtocolResponse` 인터페이스 (success, cmd, messageId, data)
  - [x] 1-1b: `RecordingStatusResult` 인터페이스 (status, rawValue)
  - [x] 1-1c: `StorageInfo` 인터페이스 (totalBytes, availableBytes, usedPercent)
  - [x] 1-1d: Command Type 상수 (`RECORDING_START = 0x1000` 등)
  - [x] 1-1e: Fixed Value, Property, CmdStatus 상수
- [x] **1-2** `services/recorder-protocol.service.ts` 신규 작성:
  - [x] 1-2a: `calculateChecksum(data: Buffer): number` — 바이트 합산 → 2의 보수
  - [x] 1-2b: `buildPacket(cmd, property, data?): Buffer` — 패킷 조립 (Length + Fixed + MsgID + Cmd + Property + Data + Checksum)
  - [x] 1-2c: `parseResponse(buffer: Buffer): ProtocolResponse` — 응답 파싱 (CmdStatus 확인)
  - [x] 1-2d: `sendCommand(ip, port, cmd, property, data?): Promise<ProtocolResponse>` — TCP 연결 + 송수신 (Length 기반 버퍼 누적 파싱)
  - [x] 1-2e: `startRecording(ip, port): Promise<boolean>` — Cmd=0x1000, Execute
  - [x] 1-2f: `stopRecording(ip, port): Promise<boolean>` — Cmd=0x1002, Execute
  - [x] 1-2g: `pauseRecording(ip, port): Promise<boolean>` — Cmd=0x1001, Execute
  - [x] 1-2h: `getRecordingStatus(ip, port): Promise<RecordingStatusResult>` — Cmd=0x0000, Get
  - [x] 1-2i: `getRecordingTime(ip, port): Promise<number>` — Cmd=0x0001, Get, Int64 파싱
  - [x] 1-2j: `getStorageInfo(ip, port): Promise<StorageInfo>` — Cmd=0x0002, Get, 16B 파싱
  - [x] 1-2k: `setPreset(ip, port, presetNumber): Promise<boolean>` — Cmd=0x0100, Set
  - [x] 1-2l: `getPreset(ip, port): Promise<number>` — Cmd=0x0100, Get
  - [x] 1-2m: `getFullStatus(ip, port): Promise<{ status, time, storage }>` — 단일 TCP 연결에서 3개 명령 순차 전송 (동시 연결 불가 대비)
- [x] **1-3** `recorders.module.ts` 수정: `RecorderProtocolService` providers 추가
- [x] **1-4** BE tsc 타입 체크 통과 확인

### Phase 2: recorder-control.service.ts 프로토콜 통합

- [x] **2-1** `RecorderProtocolService` DI 주입
- [x] **2-2** `startRecording()` 수정:
  - [x] 2-2a: 프리셋 적용을 `protocolService.setPreset()` TCP 바이너리로 변경
  - [x] 2-2b: **프리셋 NACK 시 즉시 에러 throw** (녹화 시작으로 진행하지 않음)
  - [x] 2-2c: 녹화 시작을 `protocolService.startRecording()` TCP 바이너리로 변경
  - [x] 2-2d: NACK 응답 시 에러 처리 (UnprocessableEntityException)
  - [x] 2-2e: TCP 연결 실패 시 에러 처리 (GatewayTimeoutException)
  - [x] 2-2f: **ACK 후 DB 저장 실패 시 롤백** — `stopRecording()` 명령으로 녹화기 상태 복구
- [x] **2-3** `stopRecording()` 수정:
  - [x] 2-3a: 녹화 종료를 `protocolService.stopRecording()` TCP 바이너리로 변경
  - [x] 2-3b: 세션 종료 후 `tb_recording_file` INSERT (ftpStatus: PENDING, **filePath + 중복 방지 파일명 포함**)
  - [x] 2-3c: FTP 업로드를 직접 트리거하지 않음 (FTP Job이 독립 처리)
- [x] **2-4** `getStatus()` 수정:
  - [x] 2-4a: `protocolService.getFullStatus()` 순차 호출 추가
  - [x] 2-4b: `liveStatus` 필드 응답에 추가 (elapsedFormatted, storage.isWarning 포함)
  - [x] 2-4c: `recentFiles` 필드 추가 (최근 파일 FTP 상태)
- [x] **2-5** `applyPreset()` 수정: `protocolService.setPreset()` 사용
- [x] **2-6** `FtpService` DI 주입 (getConfigForRecorder 호출용)
- [x] **2-7** BE tsc 타입 체크 통과 확인

### Phase 3: FTP 업로드 Job + 실제 전송 로직

- [x] **3-1** `ftp.service.ts`에 `getConfigForRecorder()` 추가:
  - [x] 3-1a: 녹화기 전용 설정 조회 (recorderSeq 매칭)
  - [x] 3-1b: 글로벌 기본 설정 폴백 (isDefault='Y')
  - [x] 3-1c: 설정 없을 시 null 반환
- [x] **3-2** `ftp.service.ts`에 `downloadAndUpload()` 추가:
  - [x] 3-2a: `downloadFile(config, remotePath, localPath)` — FTP/SFTP 분기 다운로드
  - [x] 3-2b: `uploadFile(config, localPath, remotePath)` — FTP/SFTP 분기 업로드
  - [x] 3-2c: `cleanupTmpFile(localPath)` — finally 블록에서 임시 파일 삭제
  - [x] 3-2d: 업로드된 FTP 경로 반환
- [x] **3-3** `ftp-upload-job.service.ts` 신규 작성:
  - [x] 3-3a: `OnModuleInit`으로 30초 간격 폴링 시작
  - [x] 3-3b: **`OnModuleInit`에서 UPLOADING → RETRY 복구** (서버 재시작 시 stuck 파일 해소)
  - [x] 3-3c: `processQueue()` — PENDING/RETRY 상태 파일 조회 + 순차 처리
  - [x] 3-3d: `processFile(file)` — **ftpConfigSeq null 체크** (null이면 FAILED + 경고 로그, skip)
  - [x] 3-3e: `processFile(file)` — 개별 파일 FTP 업로드 (상태 전이 관리)
  - [x] 3-3f: 성공 → COMPLETED (ftpUploadedPath, ftpUploadedAt 기록)
  - [x] 3-3g: 실패 + retryCount < 3 → RETRY (다음 폴링에서 재시도)
  - [x] 3-3h: 실패 + retryCount >= 3 → FAILED (자동 재시도 중단)
  - [x] 3-3i: 중복 실행 방지 (isProcessing 플래그)
- [x] **3-4** `recordings.service.ts` — `retryUpload()` 수정:
  - [x] 3-4a: 기존 상태 변경 로직에서 ftpStatus → RETRY로 변경 (Job이 처리)
  - [x] 3-4b: **수동 재시도 시 ftpRetryCount = 0으로 초기화** (FTP 설정 수정 후 재시도 가능하도록)
  - [x] 3-4c: COMPLETED/UPLOADING 상태 파일은 재시도 거부
- [x] **3-5** `ftp.module.ts` 수정: `FtpUploadJobService` providers 추가
- [x] **3-6** `recorders.module.ts` 수정: `FtpModule` import 추가
- [x] **3-7** BE tsc 타입 체크 통과 확인

### Phase 4: FE UI 구현

- [x] **4-0a** `@ku/types` — `RecorderControlStatus`에 `liveStatus`, `recentFiles` 필드 추가
- [x] **4-0b** `@ku/types` — `RecorderLiveStatus`, `RecorderRecentFile` 인터페이스 추가
- [x] **4-0c** `@ku/types` — `RetryUploadResponse.ftpStatus` 타입을 `FtpUploadStatus`로 변경
- [x] **4-0d** `@radix-ui/react-progress` 설치 + `components/ui/progress.tsx` 생성
- [x] **4-1** `control-panel.tsx` — liveStatus UI 추가:
  - [x] 4-1a: 녹화 중 REC 인디케이터 + 경과 시간 (elapsedFormatted) 표시
  - [x] 4-1b: 스토리지 프로그레스 바 (usedPercent + isWarning 경고)
  - [x] 4-1c: READY 상태 표시 (녹화 중 아닐 때)
- [x] **4-2** `control-panel.tsx` — recentFiles UI 추가:
  - [x] 4-2a: 최근 녹화 파일 목록 + FTP 상태 배지
  - [x] 4-2b: UPLOADING 스피너, FAILED/RETRY 카운트 표시
- [x] **4-3** `file-table.tsx` — FTP 상태 UI 강화:
  - [x] 4-3a: UPLOADING 스피너 아이콘 추가
  - [x] 4-3b: FAILED 경고 아이콘 + 에러 메시지 툴팁
  - [x] 4-3c: FAILED/RETRY 재시도 카운트 (N/3) 배지에 표시
  - [x] 4-3d: 재시도 버튼 FAILED 상태에서만 표시, 스피너 애니메이션
- [x] **4-4** `use-recordings.ts` — PENDING/UPLOADING/RETRY 파일 존재 시 10초 자동 폴링
- [x] **4-5** `recordings.ts` — mock 반환값 타입 수정 (RETRY, retryCount=0)
- [x] **4-6** FE tsc 타입 체크 통과 확인
- [x] **4-7** BE tsc 타입 체크 통과 확인

### Phase 5: 통합 테스트 (실제 장비 연결 시)

- [ ] **5-1** 시나리오 A 테스트: 녹화 시작 (프리셋 + TCP 바이너리)
- [ ] **5-2** 시나리오 B 테스트: 녹화 종료 → 파일 PENDING 생성 (FTP 트리거 없음)
- [ ] **5-3** 시나리오 C 테스트: FTP Job이 PENDING 파일 자동 업로드
- [ ] **5-4** 시나리오 D 테스트: FTP 실패 → RETRY → 3회 후 FAILED
- [ ] **5-5** 시나리오 E 테스트: NACK 응답 처리
- [ ] **5-6** 시나리오 F 테스트: 녹화기 연결 불가 (타임아웃)
- [ ] **5-7** 시나리오 G 테스트: FTP 설정 등록 → 연결 테스트 → 설정 수정
- [ ] **5-8** 시나리오 H 테스트: 실시간 상태 폴링 (녹화 상태 + 스토리지 + FTP 상태)
- [ ] **5-9** 시나리오 I 테스트: 녹화 파일 미리보기 + 다운로드 (권한 확인 포함)

---

## 8. 주의사항

### 🔴 심각 (개발 전 반드시 적용)

1. **CRITICAL RULES**: 새 테이블 생성 없음 — 기존 `tb_recorder`, `tb_recording_session`, `tb_recording_file`, `tb_ftp_config` 사용
2. **DB 스키마 변경 없음**: 기존 엔티티/컬럼 그대로 사용
3. **녹화 파일 filePath 필수**: 녹화 종료 시 `tb_recording_file` INSERT에 `filePath` 반드시 포함. FTP Job이 이 경로로 녹화기에서 파일을 다운로드함. filePath가 null이면 FTP 다운로드 불가.
4. **TCP 동시 연결 금지**: 임베디드 녹화기가 동시 TCP 연결을 지원하지 않을 수 있음. `getStatus()`에서 3개 명령 조회 시 `Promise.all()` 사용 금지 → 순차 실행 또는 단일 연결 `getFullStatus()` 사용.
5. **FTP Job — ftpConfigSeq null 처리**: `processFile()` 진입 시 `ftpConfigSeq`가 null이면 FAILED로 마킹하고 skip. `findOne(null)` 호출 방지.

### 🟡 주의 (프로세스 안정성)

6. **녹화 종료 ↔ FTP 업로드 완전 분리**:
   - 녹화 종료: 세션 상태 → COMPLETED, 파일 레코드 → PENDING 생성까지만
   - FTP 업로드: `FtpUploadJobService`가 `ftpStatus` 상태값만 보고 독립 실행
   - 실패 시 재시도도 상태값(RETRY)으로 관리 — 녹화 프로세스와 무관
7. **UPLOADING stuck 복구**: 서버 재시작/크래시 시 `UPLOADING` 상태 파일이 영구 stuck됨. `onModuleInit()`에서 `UPLOADING → RETRY` 자동 복구 필수.
8. **ACK 후 DB 실패 롤백**: 녹화 시작 ACK 수신 후 DB 세션 저장이 실패하면 녹화기만 녹화 중인 불일치 발생. DB 실패 시 즉시 `0x1002` 녹화 중지 명령 전송.
9. **프리셋 NACK 시 녹화 중단**: `setPreset()` NACK이면 녹화 시작으로 진행하지 않고 즉시 에러 throw.
10. **FTP 수동 재시도 시 retryCount 초기화**: 관리자가 FTP 설정 수정 후 수동 재시도할 때 `ftpRetryCount = 0`으로 리셋. 그렇지 않으면 retryCount >= 3인 파일은 영원히 재시도 불가.
11. **파일명 중복 방지**: `fileName`에 타임스탬프(`YYYYMMDDHHmmss`) 포함. 같은 날 같은 제목으로 다수 녹화 시 FTP 업로드 파일 덮어쓰기 방지.

### 🟢 기존 주의사항

12. **TCP 포트**: UNTACT-LECTURE는 **6060** (녹화기가 서버), 컨트롤러는 **9090** (BE가 서버) — 혼동 주의
13. **recorder.recorderPort 기본값**: 현재 `default: 80` (HTTP). 기존 데이터에 이미 `80`이 저장되어 있으므로 `?? 6060` 폴백이 작동하지 않음. 기존 녹화기의 port를 6060으로 수정하거나, `recorderProtocol` 필드로 분기 필요.
14. **바이너리 패킷 주의**: Length 필드가 자신을 포함하므로 최소값 = 12 (Data 없을 때)
15. **Checksum**: Length~DataN 까지 전체 바이트 합산 → 2의 보수. 검증 실패 시 녹화기가 NACK
16. **TCP 버퍼 분할 수신**: TCP `data` 이벤트에서 전체 응답이 한 번에 오지 않을 수 있음. Length 필드(첫 4바이트)를 먼저 읽고 해당 길이만큼 버퍼를 누적한 후 파싱 필수.
17. **FTP 업로드 Job 폴링 간격**: 30초. FE는 10초 폴링이므로 최대 30초간 PENDING 상태 노출. 녹화 종료 직후 1회 즉시 실행 `triggerNow()` 옵션 고려.
18. **FTP 재시도 최대 3회**: 자동 재시도는 `ftpRetryCount >= 3`이면 FAILED 고정. 수동 재시도 시 retryCount 초기화.
19. **FTP 설정 우선순위**: 녹화기 전용 > 글로벌 기본(isDefault='Y') > 없음(ftpConfigSeq=NULL → FAILED)
20. **순환 의존성**: RecorderControlService → FtpService 의존 시 `forwardRef()` 필요할 수 있음
21. **Message ID 관리**: 각 TCP 연결마다 순차 증가하는 16비트 카운터 사용, 응답 매칭 확인 필수
22. **임시 파일 관리**: FTP 다운로드 시 `/tmp/recordings/`에 저장 후 업로드 완료 시 삭제. 서버 재시작 시 임시 파일 정리 필요
23. **미리보기 접근 제어 확장 필요**: 현재 `tuSeq !== userSeq`이면 403 반환. admin 역할 접근 허용 + `tuSeq`가 null인 경우(자동 녹화) 처리 추가 필요
