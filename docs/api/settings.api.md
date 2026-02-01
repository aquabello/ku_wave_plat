# Settings API Contract

> FE Agent 참조용 API 스펙 문서
> Base URL: `http://localhost:8000/api/v1`
> Swagger: `http://localhost:8000/api/v1/docs`
> DB 테이블: `tb_setting` (기존 운영 테이블)

## 시스템 설정 (System Settings)

단일 레코드 테이블 (`tb_setting`). 기존 DID 시스템과 공유하는 테이블.

### 엔드포인트 목록

| Method | Path | 설명 |
|--------|------|------|
| GET | `/settings/system` | 시스템 설정 조회 |
| PUT | `/settings/system` | 시스템 설정 수정 (설정 + 이미지 원자적 저장) |

---

### GET /settings/system

시스템 설정 조회.

**Response 200**
```json
{
  "seq": 1,
  "apiTime": "05",
  "playerTime": "01",
  "screenStart": "08:00",
  "screenEnd": "20:00",
  "playerVer": "1.0.0",
  "playerLink": "KUDIDPlayer.exe",
  "watcherVer": "1.0.0",
  "watcherLink": "konkuk_did_watcher.exe",
  "noticeLink": "campus_map.jpg",
  "introLink": "intro.png",
  "defaultImage": "1.png",
  "regDate": "2026-02-01T09:51:35.000Z"
}
```

**Response 404**: 설정 데이터 없음

---

### PUT /settings/system

시스템 설정을 원자적으로 수정합니다. 설정값과 이미지 파일을 하나의 요청으로 처리합니다.
**모든 항목이 성공해야 저장되고, 하나라도 실패하면 전체 롤백됩니다.**

#### Content-Type

- `application/json` — 설정값만 수정 (이미지 없이)
- `multipart/form-data` — 설정값 + 이미지 파일 함께 수정

#### 필드 정의

| 필드 | 타입 | 필수 | DB 컬럼 | 설명 |
|------|------|------|---------|------|
| `apiTime` | string | Y | ts_api_time | API 실행 시간 (분) |
| `playerTime` | string | Y | ts_player_time | 플레이어 실행 주기 (분) |
| `screenStart` | string | Y | ts_screen_start | 스크린 세이버 시작 (HH:mm) |
| `screenEnd` | string | Y | ts_screen_end | 스크린 세이버 종료 (HH:mm) |
| `playerVer` | string | N | ts_player_ver | 플레이어 버전 |
| `playerLink` | string | N | ts_player_link | 플레이어 다운로드 링크 |
| `watcherVer` | string | N | ts_watcher_ver | 와처 버전 |
| `watcherLink` | string | N | ts_watcher_link | 와처 다운로드 링크 |
| `noticeLink` | string | N | ts_notice_link | 공지사항 링크 |
| `introLink` | string | N | ts_intro_link | 인트로 링크 |
| `defaultImage` | string | N | ts_default_image | DID 기본 이미지 경로 |
| `file` | File | N | — | DID 기본 이미지 파일 (JPEG/PNG, 최대 5MB) |

**유효성 검증**:
- `screenStart`, `screenEnd`: HH:mm 형식 필수

**Response 200**: GET과 동일한 형식

**Response 400**:
```json
{
  "statusCode": 400,
  "message": ["스크린 세이버 시작은 HH:mm 형식이어야 합니다"],
  "error": "Bad Request"
}
```

---

## FE 구현 가이드

### 화면 구성 (환경설정 > 시스템설정)

```
┌─────────────────────────────────────────────┐
│ 시스템 설정                                    │
├─────────────────────────────────────────────┤
│                                             │
│  API 실행 시간    [  05  ] 분                │
│  플레이어 주기    [  01  ] 분                │
│                                             │
│  스크린 세이버    [08:00] ~ [20:00]          │
│                                             │
│  플레이어 버전    [ 1.0.0 ]                  │
│  플레이어 링크    [ KUDIDPlayer.exe ]         │
│                                             │
│  와처 버전       [ 1.0.0 ]                   │
│  와처 링크       [ konkuk_did_watcher.exe ]   │
│                                             │
│  공지사항 링크    [ campus_map.jpg ]           │
│  인트로 링크     [ intro.png ]                │
│                                             │
│  기본 이미지     [이미지 미리보기]              │
│                  [업로드] [삭제]               │
│                  JPEG/PNG, 최대 5MB           │
│                                             │
│                         [저장] [초기화]        │
└─────────────────────────────────────────────┘
```

### 저장 버튼 동작

```typescript
// 이미지 파일 포함 시: multipart/form-data
const formData = new FormData();
formData.append('apiTime', values.apiTime);
formData.append('playerTime', values.playerTime);
formData.append('screenStart', values.screenStart);
formData.append('screenEnd', values.screenEnd);
// optional fields
if (values.playerVer) formData.append('playerVer', values.playerVer);
if (values.playerLink) formData.append('playerLink', values.playerLink);
if (values.watcherVer) formData.append('watcherVer', values.watcherVer);
if (values.watcherLink) formData.append('watcherLink', values.watcherLink);
if (values.noticeLink) formData.append('noticeLink', values.noticeLink);
if (values.introLink) formData.append('introLink', values.introLink);
if (file) formData.append('file', file);

await fetch('/api/v1/settings/system', { method: 'PUT', body: formData });

// 이미지 없이: JSON
await fetch('/api/v1/settings/system', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(values),
});
```
