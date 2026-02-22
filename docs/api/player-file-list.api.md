# Player File List API

플레이어 디바이스가 자신의 재생 콘텐츠 목록을 조회하는 API.
PHP 레거시 `reqWatcherFileList`와 동일한 응답 포맷을 유지합니다.

## Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/players/file-list` | Player API Key | 플레이어 파일 목록 조회 |

## Authentication

JWT가 아닌 **Player API Key** 인증을 사용합니다.
```
Authorization: Bearer {player_api_key}
```

플레이어 등록 시 발급받은 `player_api_key`를 사용합니다.
플레이어가 승인(APPROVED) 상태여야 접근 가능합니다.

## Request

### Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {player_api_key} | Yes |
| Content-Type | application/json | Yes |

### Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| watcher_ver | string | No | Watcher 소프트웨어 버전 |
| player_ver | string | No | Player 소프트웨어 버전 |

```json
{
  "watcher_ver": "1.0.0",
  "player_ver": "1.0.0"
}
```

## Response (레거시 호환 포맷)

### 성공 (200)
```json
{
  "result": "SUCCESS",
  "msg": "정상처리 되었습니다.",
  "channel": {
    "name": "본관 1층 플레이리스트",
    "screen_type": "1x1",
    "screen_size": "1920x1080",
    "play_type": "N",
    "notice": "http://localhost:8000/uploads/system/notice.jpg",
    "intro": "http://localhost:8000/uploads/system/intro.mp4"
  },
  "contents": [
    {
      "content": "건국대 홍보 영상",
      "start_date": "2026-01-01 00:00:00",
      "end_date": "2026-12-31 23:59:59",
      "type": "MOV",
      "play_min": "1",
      "play_sec": "30",
      "screen_type": "FULL",
      "fileList": [
        {
          "file_path": "http://localhost:8000/uploads/contents/promo.mp4",
          "file_name": "promo.mp4",
          "file_size": "15728640"
        }
      ]
    }
  ],
  "setting": {
    "screen_start": "06:00",
    "screen_end": "22:00",
    "api_time": "5",
    "player_time": "1",
    "player_ver": "1.0.0",
    "player_link": "http://localhost:8000/resources/link/player.exe",
    "watcher_ver": "1.0.0",
    "watcher_link": "http://localhost:8000/resources/link/watcher.exe",
    "default_image": "http://localhost:8000/uploads/system/default.jpg",
    "watcher_name": "본관 1층 로비 디스플레이"
  }
}
```

### 실패 - 플레이리스트 미할당
```json
{
  "result": "FAIL",
  "msg": "플레이리스트가 할당되지 않았습니다."
}
```

### 실패 - 인증 실패 (401)
```json
{
  "statusCode": 401,
  "message": "유효하지 않은 API Key입니다.",
  "error": "Unauthorized"
}
```

## 레거시 매핑

| PHP 필드 | NestJS 소스 | 비고 |
|----------|------------|------|
| channel.name | TbPlayList.playlistName | |
| channel.screen_type | TbPlayList.playlistScreenLayout | |
| channel.screen_size | TbPlayer.playerResolution | |
| channel.play_type | TbPlayList.playlistRandom | Y/N |
| contents[].content | TbContent.contentName | |
| contents[].type | TbContent.contentType | VIDEO→MOV, IMAGE→IMG |
| contents[].play_min | playDuration / 60 | |
| contents[].play_sec | playDuration % 60 | |
| contents[].fileList[] | TbContent.contentFilePath | 단일 파일 |
| setting.* | TbSetting.* | 환경설정 |
| setting.watcher_name | TbPlayer.playerName | |

## 변경 이력

| 버전 | 일자 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-22 | 초기 작성 |
