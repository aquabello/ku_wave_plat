# Player API 명세서

## 개요
Digital Signage Player 관리 시스템 API 명세서

- **Base URL**: `http://localhost:8000/api/v1`
- **인증**: Bearer Token (JWT) - 모든 API에서 필수 (로그인 제외)
- **응답 형식**: JSON
- **문자 인코딩**: UTF-8

---

## 목차
1. [플레이어 관리 API](#플레이어-관리-api)
2. [플레이어 승인 API](#플레이어-승인-api)
3. [플레이어 Health Check API](#플레이어-health-check-api)
4. [플레이리스트 관리 API](#플레이리스트-관리-api)
5. [콘텐츠 관리 API](#콘텐츠-관리-api)
6. [플레이어 그룹 관리 API](#플레이어-그룹-관리-api)
7. [플레이어-플레이리스트 할당 API](#플레이어-플레이리스트-할당-api)
8. [그룹-플레이리스트 할당 API](#그룹-플레이리스트-할당-api)
9. [재생 로그 API](#재생-로그-api)
10. [공통 응답 형식](#공통-응답-형식)

---

## 플레이어 관리 API

### 1. 플레이어 목록 조회
**GET** `/players`

#### 요청
**Query Parameters:**
```typescript
{
  page?: number;           // 페이지 번호 (기본값: 1)
  limit?: number;          // 페이지 크기 (기본값: 20)
  building_seq?: number;   // 건물 필터
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';  // 상태 필터
  approval?: 'PENDING' | 'APPROVED' | 'REJECTED';           // 승인 상태 필터
  search?: string;         // 검색어 (플레이어명, 코드)
  sort?: string;           // 정렬 (예: 'player_order', '-reg_date')
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        player_seq: number;
        player_name: string;
        player_code: string;
        player_did: string | null;
        player_mac: string | null;
        player_ip: string;
        player_port: number;
        player_status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
        player_approval: 'PENDING' | 'APPROVED' | 'REJECTED';
        last_heartbeat_at: string | null;  // ISO 8601
        building: {
          building_seq: number;
          building_name: string;
          building_code: string;
        };
        space: {
          space_seq: number;
          space_name: string;
        } | null;
        playlist: {
          playlist_seq: number;
          playlist_name: string;
        } | null;
        reg_date: string;  // ISO 8601
        upd_date: string;  // ISO 8601
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

### 2. 플레이어 상세 조회
**GET** `/players/:player_seq`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    player_seq: number;
    player_name: string;
    player_code: string;
    player_did: string | null;
    player_mac: string | null;
    building_seq: number;
    space_seq: number | null;
    playlist_seq: number | null;
    player_ip: string;
    player_port: number;
    player_api_key: string;
    player_approval: 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by: number | null;
    approved_at: string | null;
    reject_reason: string | null;
    player_status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
    last_heartbeat_at: string | null;
    last_content_played: string | null;
    player_version: string | null;
    player_resolution: string | null;
    player_orientation: 'LANDSCAPE' | 'PORTRAIT';
    default_volume: number;  // 기본 볼륨 (0-100)
    player_description: string | null;
    player_order: number;
    player_isdel: 'Y' | 'N';
    reg_date: string;
    upd_date: string;
    building: {
      building_seq: number;
      building_name: string;
      building_code: string;
      building_location: string | null;
    };
    space: {
      space_seq: number;
      space_name: string;
    } | null;
    playlist: {
      playlist_seq: number;
      playlist_name: string;
      playlist_code: string;
    } | null;
    approver: {
      tu_seq: number;
      tu_name: string;
      tu_email: string;
    } | null;
  }
}
```

---

### 3. 플레이어 등록
**POST** `/players`

#### 요청
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  player_name: string;              // 필수, 최대 100자
  player_code: string;              // 필수, 최대 50자, UNIQUE
  player_did?: string;              // 선택, 최대 100자, UNIQUE
  player_mac?: string;              // 선택, 형식: AA:BB:CC:DD:EE:FF
  building_seq: number;             // 필수, 건물 시퀀스
  space_seq?: number;               // 선택, 공간 시퀀스
  player_ip: string;                // 필수, IPv4/IPv6
  player_port?: number;             // 선택, 기본값 9090
  player_resolution?: string;       // 선택, 예: "1920x1080"
  player_orientation?: 'LANDSCAPE' | 'PORTRAIT';  // 선택, 기본값 LANDSCAPE
  default_volume?: number;          // 선택, 기본 볼륨 (0-100, 기본값 50)
  player_description?: string;      // 선택
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "플레이어가 등록되었습니다. 관리자 승인 대기 중입니다.",
  data: {
    player_seq: number;
    player_code: string;
    player_api_key: string;  // 자동 생성된 API Key (플레이어 인증용)
    player_approval: 'PENDING';
    reg_date: string;
  }
}
```

#### 에러 응답
**400 Bad Request** - 유효성 검증 실패
```typescript
{
  success: false,
  message: "유효성 검증 실패",
  errors: [
    {
      field: "player_code",
      message: "이미 사용 중인 플레이어 코드입니다."
    }
  ]
}
```

**404 Not Found** - 건물/공간 없음
```typescript
{
  success: false,
  message: "존재하지 않는 건물입니다."
}
```

---

### 4. 플레이어 수정
**PUT** `/players/:player_seq`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  player_name?: string;
  player_did?: string;
  player_mac?: string;
  building_seq?: number;
  space_seq?: number;
  playlist_seq?: number;
  player_ip?: string;
  player_port?: number;
  player_resolution?: string;
  player_orientation?: 'LANDSCAPE' | 'PORTRAIT';
  default_volume?: number;
  player_description?: string;
  player_order?: number;
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어 정보가 수정되었습니다.",
  data: {
    player_seq: number;
    upd_date: string;
  }
}
```

---

### 5. 플레이어 삭제 (소프트 삭제)
**DELETE** `/players/:player_seq`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어가 삭제되었습니다."
}
```

---

## 플레이어 승인 API

### 6. 플레이어 승인
**POST** `/players/:player_seq/approve`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  // Body 없음 (승인만 수행)
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어가 승인되었습니다.",
  data: {
    player_seq: number;
    player_approval: 'APPROVED';
    approved_by: number;
    approved_at: string;
  }
}
```

---

### 7. 플레이어 반려
**POST** `/players/:player_seq/reject`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  reject_reason: string;  // 필수, 반려 사유
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어가 반려되었습니다.",
  data: {
    player_seq: number;
    player_approval: 'REJECTED';
    approved_by: number;
    approved_at: string;
    reject_reason: string;
  }
}
```

---

## 플레이어 Health Check API

### 8. Health Check 전송 (플레이어 → 서버)
**POST** `/players/heartbeat`

#### 요청
**Headers:**
```
Authorization: Bearer {player_api_key}  ⚠️ 플레이어 API Key 사용
Content-Type: application/json
```

**Body:**
```typescript
{
  player_seq: number;           // 필수
  player_version?: string;      // 선택
  cpu_usage?: number;           // 선택, CPU 사용률 (%)
  memory_usage?: number;        // 선택, 메모리 사용률 (%)
  disk_usage?: number;          // 선택, 디스크 사용률 (%)
  current_playlist?: number;    // 선택, 현재 재생 중인 플레이리스트
  current_content?: string;     // 선택, 현재 재생 중인 콘텐츠
  error_message?: string;       // 선택, 에러 메시지
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "Heartbeat received",
  data: {
    player_seq: number;
    player_status: 'ONLINE';
    last_heartbeat_at: string;
    should_update_playlist: boolean;  // 플레이리스트 변경 여부
    new_playlist_seq?: number;        // 새 플레이리스트 시퀀스
  }
}
```

#### 에러 응답
**401 Unauthorized** - API Key 인증 실패
```typescript
{
  success: false,
  message: "유효하지 않은 API Key입니다."
}
```

---

### 9. Health Check 로그 조회
**GET** `/players/:player_seq/heartbeat-logs`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Query Parameters:**
```typescript
{
  page?: number;      // 페이지 번호
  limit?: number;     // 페이지 크기
  from?: string;      // 시작 일시 (ISO 8601)
  to?: string;        // 종료 일시 (ISO 8601)
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        heartbeat_seq: number;
        player_seq: number;
        heartbeat_at: string;
        player_ip: string | null;
        player_version: string | null;
        cpu_usage: number | null;
        memory_usage: number | null;
        disk_usage: number | null;
        current_playlist: number | null;
        current_content: string | null;
        error_message: string | null;
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

## 플레이리스트 관리 API

### 10. 플레이리스트 목록 조회
**GET** `/playlists`

#### 요청
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
  search?: string;
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        playlist_seq: number;
        playlist_name: string;
        playlist_code: string;
        playlist_type: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
        playlist_priority: number;  // 우선순위 (0-99)
        playlist_duration: number | null;
        playlist_loop: 'Y' | 'N';
        playlist_random: 'Y' | 'N';  // 랜덤 재생 여부
        playlist_screen_layout: '1x1' | '1x2' | '1x3' | '1x4' | '2x2' | '2x4' | '1x8';  // 화면 분할 레이아웃
        playlist_status: 'ACTIVE' | 'INACTIVE';  // 사용 상태
        playlist_description: string | null;
        content_count: number;  // 포함된 콘텐츠 수
        player_count: number;   // 사용 중인 플레이어 수
        reg_date: string;
        upd_date: string;
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

### 11. 플레이리스트 상세 조회
**GET** `/playlists/:playlist_seq`

#### 요청
**Path Parameters:**
- `playlist_seq` (number, required): 플레이리스트 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    playlist_seq: number;
    playlist_name: string;
    playlist_code: string;
    playlist_type: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
    playlist_priority: number;
    playlist_duration: number | null;
    playlist_loop: 'Y' | 'N';
    playlist_random: 'Y' | 'N';
    playlist_screen_layout: '1x1' | '1x2' | '1x3' | '1x4' | '2x2' | '2x4' | '1x8';
    playlist_status: 'ACTIVE' | 'INACTIVE';
    playlist_description: string | null;
    playlist_order: number;
    playlist_isdel: 'Y' | 'N';
    reg_date: string;
    upd_date: string;
    contents: [
      {
        plc_seq: number;
        content_seq: number;
        content_name: string;
        content_code: string;
        content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
        content_file_path: string | null;
        content_url: string | null;
        content_duration: number | null;
        play_order: number;
        play_duration: number | null;
        transition_effect: string | null;
        transition_duration: number;  // 전환 시간 (밀리초)
        zone_number: number;  // 영역 번호 (1~8)
        zone_width: number;  // 영역 너비 (%)
        zone_height: number;  // 영역 높이 (%)
        zone_x_position: number;  // X 좌표 (%)
        zone_y_position: number;  // Y 좌표 (%)
      }
    ]
  }
}
```

---

### 12. 플레이리스트 등록
**POST** `/playlists`

#### 요청
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  playlist_name: string;                // 필수, 최대 100자
  playlist_code: string;                // 필수, 최대 50자, UNIQUE
  playlist_type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';  // 선택, 기본값 NORMAL
  playlist_priority?: number;           // 선택, 우선순위 (0-99, 기본값 0)
  playlist_loop?: 'Y' | 'N';           // 선택, 기본값 'Y'
  playlist_random?: 'Y' | 'N';         // 선택, 랜덤 재생 (기본값 'N')
  playlist_screen_layout?: '1x1' | '1x2' | '1x3' | '1x4' | '2x2' | '2x4' | '1x8';  // 선택, 화면 레이아웃 (기본값 '1x1')
  playlist_status?: 'ACTIVE' | 'INACTIVE';  // 선택, 사용 상태 (기본값 'ACTIVE')
  playlist_description?: string;        // 선택
  contents?: [                          // 선택, 콘텐츠 매핑
    {
      content_seq: number;
      play_order: number;
      play_duration?: number;
      transition_effect?: string;
      transition_duration?: number;  // 전환 시간 (밀리초, 기본값 0)
      zone_number?: number;  // 영역 번호 (1~8, 기본값 1)
      zone_width?: number;  // 영역 너비 (%, 기본값 100)
      zone_height?: number;  // 영역 높이 (%, 기본값 100)
      zone_x_position?: number;  // X 좌표 (%, 기본값 0)
      zone_y_position?: number;  // Y 좌표 (%, 기본값 0)
    }
  ]
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "플레이리스트가 등록되었습니다.",
  data: {
    playlist_seq: number;
    playlist_code: string;
    reg_date: string;
  }
}
```

---

### 13. 플레이리스트 수정
**PUT** `/playlists/:playlist_seq`

#### 요청
**Path Parameters:**
- `playlist_seq` (number, required): 플레이리스트 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  playlist_name?: string;
  playlist_type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
  playlist_priority?: number;
  playlist_loop?: 'Y' | 'N';
  playlist_random?: 'Y' | 'N';
  playlist_screen_layout?: '1x1' | '1x2' | '1x3' | '1x4' | '2x2' | '2x4' | '1x8';
  playlist_status?: 'ACTIVE' | 'INACTIVE';
  playlist_description?: string;
  playlist_order?: number;
  contents?: [                // 전체 교체 (기존 매핑 삭제 후 재생성)
    {
      content_seq: number;
      play_order: number;
      play_duration?: number;
      transition_effect?: string;
      transition_duration?: number;
      zone_number?: number;
      zone_width?: number;
      zone_height?: number;
      zone_x_position?: number;
      zone_y_position?: number;
    }
  ]
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이리스트가 수정되었습니다.",
  data: {
    playlist_seq: number;
    upd_date: string;
  }
}
```

---

### 14. 플레이리스트 삭제
**DELETE** `/playlists/:playlist_seq`

#### 요청
**Path Parameters:**
- `playlist_seq` (number, required): 플레이리스트 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이리스트가 삭제되었습니다."
}
```

---

## 콘텐츠 관리 API

### 15. 콘텐츠 목록 조회
**GET** `/contents`

#### 요청
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
  search?: string;
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        content_seq: number;
        content_name: string;
        content_code: string;
        content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
        content_file_path: string | null;
        content_url: string | null;
        content_duration: number | null;
        content_width: number | null;
        content_height: number | null;
        content_size: number | null;
        content_mime_type: string | null;
        content_thumbnail: string | null;
        content_description: string | null;
        usage_count: number;  // 사용 중인 플레이리스트 수
        reg_date: string;
        upd_date: string;
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

### 16. 콘텐츠 상세 조회
**GET** `/contents/:content_seq`

#### 요청
**Path Parameters:**
- `content_seq` (number, required): 콘텐츠 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    content_seq: number;
    content_name: string;
    content_code: string;
    content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
    content_file_path: string | null;
    content_url: string | null;
    content_duration: number | null;
    content_width: number | null;
    content_height: number | null;
    content_size: number | null;
    content_mime_type: string | null;
    content_thumbnail: string | null;
    content_description: string | null;
    content_order: number;
    content_isdel: 'Y' | 'N';
    reg_date: string;
    upd_date: string;
  }
}
```

---

### 17. 콘텐츠 등록 (파일 업로드)
**POST** `/contents`

#### 요청
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Body (FormData):**
```typescript
{
  content_name: string;           // 필수, 최대 100자
  content_code: string;           // 필수, 최대 50자, UNIQUE
  content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';  // 필수
  file?: File;                    // 선택, 업로드 파일 (VIDEO/IMAGE/HTML)
  content_url?: string;           // 선택, 외부 URL (STREAM)
  content_duration?: number;      // 선택, 재생 시간 (초)
  content_description?: string;   // 선택
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "콘텐츠가 등록되었습니다.",
  data: {
    content_seq: number;
    content_code: string;
    content_file_path: string | null;
    content_thumbnail: string | null;
    reg_date: string;
  }
}
```

---

### 18. 콘텐츠 수정
**PUT** `/contents/:content_seq`

#### 요청
**Path Parameters:**
- `content_seq` (number, required): 콘텐츠 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Body (FormData):**
```typescript
{
  content_name?: string;
  content_type?: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
  file?: File;                    // 파일 교체
  content_url?: string;
  content_duration?: number;
  content_orientation?: 'LANDSCAPE' | 'PORTRAIT' | 'BOTH';
  content_category?: string;
  content_tags?: string;
  content_status?: 'ACTIVE' | 'INACTIVE';
  valid_from?: string;
  valid_to?: string;
  content_description?: string;
  content_order?: number;
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "콘텐츠가 수정되었습니다.",
  data: {
    content_seq: number;
    upd_date: string;
  }
}
```

---

### 19. 콘텐츠 삭제
**DELETE** `/contents/:content_seq`

#### 요청
**Path Parameters:**
- `content_seq` (number, required): 콘텐츠 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "콘텐츠가 삭제되었습니다."
}
```

---

## 플레이어 그룹 관리 API

### 20. 플레이어 그룹 목록 조회
**GET** `/player-groups`

#### 요청
**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  building_seq?: number;  // 건물 필터
  search?: string;  // 검색어 (그룹명, 코드)
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        group_seq: number;
        group_name: string;
        group_code: string;
        building_seq: number | null;
        building_name: string | null;
        group_description: string | null;
        member_count: number;  // 그룹에 속한 플레이어 수
        playlist_count: number;  // 할당된 플레이리스트 수
        reg_date: string;
        upd_date: string;
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

### 21. 플레이어 그룹 상세 조회
**GET** `/player-groups/:group_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    group_seq: number;
    group_name: string;
    group_code: string;
    building_seq: number | null;
    group_description: string | null;
    group_order: number;
    reg_date: string;
    upd_date: string;
    members: [  // 그룹 멤버 플레이어 목록
      {
        pgm_seq: number;
        player_seq: number;
        player_name: string;
        player_code: string;
        player_status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
        reg_date: string;
      }
    ],
    playlists: [  // 그룹에 할당된 플레이리스트 목록
      {
        gp_seq: number;
        playlist_seq: number;
        playlist_name: string;
        gp_priority: number;
        schedule_start_time: string | null;
        schedule_end_time: string | null;
        schedule_days: string | null;
        gp_status: 'ACTIVE' | 'INACTIVE';
      }
    ]
  }
}
```

---

### 22. 플레이어 그룹 등록
**POST** `/player-groups`

#### 요청
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  group_name: string;  // 필수, 최대 100자
  group_code: string;  // 필수, 최대 50자, UNIQUE
  building_seq?: number;  // 선택, 건물 시퀀스
  group_description?: string;  // 선택
  member_player_seqs?: number[];  // 선택, 초기 멤버 플레이어 시퀀스 배열
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "플레이어 그룹이 등록되었습니다.",
  data: {
    group_seq: number;
    group_code: string;
    member_count: number;
    reg_date: string;
  }
}
```

---

### 23. 플레이어 그룹 수정
**PUT** `/player-groups/:group_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  group_name?: string;
  building_seq?: number;
  group_description?: string;
  group_order?: number;
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어 그룹이 수정되었습니다.",
  data: {
    group_seq: number;
    upd_date: string;
  }
}
```

---

### 24. 플레이어 그룹 삭제
**DELETE** `/player-groups/:group_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이어 그룹이 삭제되었습니다."
}
```

---

### 25. 그룹 멤버 추가
**POST** `/player-groups/:group_seq/members`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  player_seqs: number[];  // 필수, 추가할 플레이어 시퀀스 배열
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "그룹 멤버가 추가되었습니다.",
  data: {
    added_count: number;
    member_count: number;  // 총 멤버 수
  }
}
```

---

### 26. 그룹 멤버 삭제
**DELETE** `/player-groups/:group_seq/members/:player_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "그룹 멤버가 삭제되었습니다."
}
```

---

## 플레이어-플레이리스트 할당 API

### 27. 플레이어 플레이리스트 할당 목록 조회
**GET** `/players/:player_seq/playlists`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: [
    {
      pp_seq: number;
      playlist_seq: number;
      playlist_name: string;
      playlist_type: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
      pp_priority: number;
      schedule_start_time: string | null;  // HH:mm:ss
      schedule_end_time: string | null;
      schedule_days: string | null;  // "1,2,3,4,5"
      pp_status: 'ACTIVE' | 'INACTIVE';
      reg_date: string;
    }
  ]
}
```

---

### 28. 플레이어에 플레이리스트 할당
**POST** `/players/:player_seq/playlists`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  playlist_seq: number;  // 필수
  pp_priority?: number;  // 선택, 우선순위 (기본값 0)
  schedule_start_time?: string;  // 선택, 시작 시간 (HH:mm:ss)
  schedule_end_time?: string;  // 선택, 종료 시간 (HH:mm:ss)
  schedule_days?: string;  // 선택, 요일 (1,2,3,4,5)
  pp_status?: 'ACTIVE' | 'INACTIVE';  // 선택, 기본값 'ACTIVE'
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "플레이리스트가 할당되었습니다.",
  data: {
    pp_seq: number;
    reg_date: string;
  }
}
```

---

### 29. 플레이어 플레이리스트 할당 수정
**PUT** `/players/:player_seq/playlists/:pp_seq`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스
- `pp_seq` (number, required): 할당 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  pp_priority?: number;
  schedule_start_time?: string;
  schedule_end_time?: string;
  schedule_days?: string;
  pp_status?: 'ACTIVE' | 'INACTIVE';
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이리스트 할당이 수정되었습니다.",
  data: {
    pp_seq: number;
    upd_date: string;
  }
}
```

---

### 30. 플레이어 플레이리스트 할당 해제
**DELETE** `/players/:player_seq/playlists/:pp_seq`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스
- `pp_seq` (number, required): 할당 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "플레이리스트 할당이 해제되었습니다."
}
```

---

## 그룹-플레이리스트 할당 API

### 31. 그룹 플레이리스트 할당
**POST** `/player-groups/:group_seq/playlists`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  playlist_seq: number;  // 필수
  gp_priority?: number;  // 선택, 우선순위 (기본값 0)
  schedule_start_time?: string;  // 선택, 시작 시간 (HH:mm:ss)
  schedule_end_time?: string;  // 선택, 종료 시간 (HH:mm:ss)
  schedule_days?: string;  // 선택, 요일 (1,2,3,4,5)
  gp_status?: 'ACTIVE' | 'INACTIVE';  // 선택, 기본값 'ACTIVE'
}
```

#### 응답 (201 Created)
```typescript
{
  success: true,
  message: "그룹에 플레이리스트가 할당되었습니다.",
  data: {
    gp_seq: number;
    affected_players: number;  // 영향받은 플레이어 수
    reg_date: string;
  }
}
```

---

### 32. 그룹 플레이리스트 할당 수정
**PUT** `/player-groups/:group_seq/playlists/:gp_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스
- `gp_seq` (number, required): 그룹-플레이리스트 할당 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Body:**
```typescript
{
  gp_priority?: number;
  schedule_start_time?: string;
  schedule_end_time?: string;
  schedule_days?: string;
  gp_status?: 'ACTIVE' | 'INACTIVE';
}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "그룹 플레이리스트 할당이 수정되었습니다.",
  data: {
    gp_seq: number;
    upd_date: string;
  }
}
```

---

### 33. 그룹 플레이리스트 할당 해제
**DELETE** `/player-groups/:group_seq/playlists/:gp_seq`

#### 요청
**Path Parameters:**
- `group_seq` (number, required): 그룹 시퀀스
- `gp_seq` (number, required): 그룹-플레이리스트 할당 시퀀스

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  message: "그룹 플레이리스트 할당이 해제되었습니다."
}
```

---

## 재생 로그 API

### 34. 재생 로그 조회 (플레이어별)
**GET** `/players/:player_seq/play-logs`

#### 요청
**Path Parameters:**
- `player_seq` (number, required): 플레이어 시퀀스

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  from?: string;  // 시작 일시 (ISO 8601)
  to?: string;  // 종료 일시 (ISO 8601)
  status?: 'COMPLETED' | 'SKIPPED' | 'ERROR';  // 재생 상태 필터
  playlist_seq?: number;  // 플레이리스트 필터
  content_seq?: number;  // 콘텐츠 필터
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    items: [
      {
        log_seq: number;
        player_seq: number;
        playlist_seq: number | null;
        playlist_name: string | null;
        content_seq: number;
        content_name: string;
        zone_number: number;
        play_started_at: string;
        play_ended_at: string | null;
        play_duration: number | null;  // 실제 재생 시간 (초)
        play_status: 'COMPLETED' | 'SKIPPED' | 'ERROR';
        error_message: string | null;
      }
    ],
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}
```

---

### 35. 재생 통계 조회 (콘텐츠별)
**GET** `/contents/:content_seq/play-stats`

#### 요청
**Path Parameters:**
- `content_seq` (number, required): 콘텐츠 시퀀스

**Query Parameters:**
```typescript
{
  from?: string;  // 시작 일시 (ISO 8601)
  to?: string;  // 종료 일시 (ISO 8601)
}
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

#### 응답 (200 OK)
```typescript
{
  success: true,
  data: {
    content_seq: number;
    content_name: string;
    total_play_count: number;
    completed_count: number;
    skipped_count: number;
    error_count: number;
    total_play_time: number;  // 총 재생 시간 (초)
    average_play_time: number;  // 평균 재생 시간 (초)
    unique_players: number;  // 재생한 플레이어 수
    play_by_date: [  // 일별 재생 통계
      {
        date: string;  // YYYY-MM-DD
        play_count: number;
        completed_count: number;
      }
    ]
  }
}
```

---

## 공통 응답 형식

### 성공 응답
```typescript
{
  success: true,
  message?: string,
  data?: any
}
```

### 에러 응답

#### 400 Bad Request - 유효성 검증 실패
```typescript
{
  success: false,
  message: "유효성 검증 실패",
  errors: [
    {
      field: string,
      message: string
    }
  ]
}
```

#### 401 Unauthorized - 인증 실패
```typescript
{
  success: false,
  message: "인증이 필요합니다." | "유효하지 않은 토큰입니다."
}
```

#### 403 Forbidden - 권한 없음
```typescript
{
  success: false,
  message: "권한이 없습니다."
}
```

#### 404 Not Found - 리소스 없음
```typescript
{
  success: false,
  message: "리소스를 찾을 수 없습니다."
}
```

#### 500 Internal Server Error - 서버 오류
```typescript
{
  success: false,
  message: "서버 오류가 발생했습니다.",
  error?: string  // 개발 환경에서만 노출
}
```

---

## 인증 헤더 예시

### 관리자 인증 (Bearer Token)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 플레이어 인증 (API Key)
```http
Authorization: Bearer player_a1b2c3d4e5f6...
```

---

## 페이지네이션 공통 형식

모든 목록 조회 API는 다음 형식의 페이지네이션을 사용합니다:

```typescript
{
  items: Array<T>,
  pagination: {
    total: number,        // 전체 항목 수
    page: number,         // 현재 페이지 (1부터 시작)
    limit: number,        // 페이지 크기
    totalPages: number    // 전체 페이지 수
  }
}
```

---

## 날짜/시간 형식

모든 날짜/시간은 **ISO 8601 형식**을 사용합니다:
```
2026-02-14T06:30:00.000Z
```

---

## 파일 업로드 제한

- **최대 파일 크기**: 100MB
- **허용 MIME 타입**:
  - VIDEO: `video/mp4`, `video/avi`, `video/mov`
  - IMAGE: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - HTML: `text/html`

---

## 변경 이력

| 버전 | 일자 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-14 | 초기 작성 |

---

## 문의

API 관련 문의사항은 개발팀에게 연락 바랍니다.
