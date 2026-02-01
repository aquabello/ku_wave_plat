# System Settings API

시스템 설정 관리를 위한 RESTful API 엔드포인트입니다.

## 엔티티 구조

### SystemSettings

| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|----------|
| id | UUID | 설정 ID | Primary Key |
| apiInterval | number | API 통신주기 (분) | 5-60, 5분 단위 |
| executionInterval | number | 실행주기 (분) | 1-60 |
| blackoutStartTime | string | 블랙 시간 시작 | HH:mm, 07:00부터 |
| blackoutEndTime | string | 블랙 시간 종료 | HH:mm, 12:00까지 |
| defaultImagePath | string | 기본 이미지 경로 | nullable |
| createdAt | Date | 생성일시 | - |
| updatedAt | Date | 수정일시 | - |

## API 엔드포인트

### 1. 시스템 설정 조회

시스템 설정을 조회합니다. 설정이 없을 경우 기본값으로 생성됩니다.

**Endpoint:** `GET /api/v1/settings/system`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "apiInterval": 10,
  "executionInterval": 5,
  "blackoutStartTime": "07:00",
  "blackoutEndTime": "12:00",
  "defaultImagePath": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 시스템 설정 수정

시스템 설정을 수정합니다.

**Endpoint:** `PUT /api/v1/settings/system`

**Request Body:**
```json
{
  "apiInterval": 15,
  "executionInterval": 10,
  "blackoutStartTime": "08:00",
  "blackoutEndTime": "11:00",
  "defaultImagePath": "uploads/system/default-image.jpg"
}
```

**Validation Rules:**
- `apiInterval`: 5-60 범위, 5분 단위 (5, 10, 15, ..., 60)
- `executionInterval`: 1-60 범위
- `blackoutStartTime`: HH:mm 형식, 07:00 이상
- `blackoutEndTime`: HH:mm 형식, 12:00 이하
- 시작 시간 < 종료 시간

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "apiInterval": 15,
  "executionInterval": 10,
  "blackoutStartTime": "08:00",
  "blackoutEndTime": "11:00",
  "defaultImagePath": "uploads/system/default-image.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - 유효성 검증 실패
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "API 통신주기는 5분 단위여야 합니다",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/settings/system"
  }
}

// 400 Bad Request - 시간 범위 오류
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "블랙 시간 시작은 종료 시간보다 이전이어야 합니다",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/settings/system"
  }
}
```

### 3. 이미지 업로드

DID 플레이어 기본 이미지를 업로드합니다.

**Endpoint:** `POST /api/v1/settings/system/upload-image`

**Content-Type:** `multipart/form-data`

**Request:**
```bash
curl -X POST http://localhost:8000/api/v1/settings/system/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**File Constraints:**
- 최대 파일 크기: 5MB
- 허용 형식: JPEG, PNG
- 권장 해상도: 1920x1080

**Response:**
```json
{
  "path": "uploads/system/1704067200000-default-image.jpg",
  "filename": "1704067200000-default-image.jpg",
  "size": 1048576,
  "mimeType": "image/jpeg"
}
```

**Error Responses:**

```json
// 400 Bad Request - 파일 크기 초과
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/settings/system/upload-image"
  }
}

// 400 Bad Request - 지원하지 않는 파일 형식
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "지원하지 않는 파일 형식입니다. JPEG 또는 PNG 파일만 업로드 가능합니다",
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/settings/system/upload-image"
  }
}
```

## 사용 예시

### cURL 예시

```bash
# 1. 설정 조회
curl -X GET http://localhost:8000/api/v1/settings/system \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 설정 수정
curl -X PUT http://localhost:8000/api/v1/settings/system \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiInterval": 15,
    "executionInterval": 10,
    "blackoutStartTime": "08:00",
    "blackoutEndTime": "11:00",
    "defaultImagePath": null
  }'

# 3. 이미지 업로드
curl -X POST http://localhost:8000/api/v1/settings/system/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@./image.jpg"
```

### JavaScript/TypeScript 예시

```typescript
// 1. 설정 조회
const getSettings = async () => {
  const response = await fetch('http://localhost:8000/api/v1/settings/system', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return await response.json();
};

// 2. 설정 수정
const updateSettings = async (settings: UpdateSystemSettingsDto) => {
  const response = await fetch('http://localhost:8000/api/v1/settings/system', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  return await response.json();
};

// 3. 이미지 업로드
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/v1/settings/system/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return await response.json();
};
```

## 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
pnpm --filter @ku/api migration:run

# 마이그레이션 롤백
pnpm --filter @ku/api migration:revert
```

## 테스트

```bash
# 유닛 테스트 실행
pnpm --filter @ku/api test settings

# 테스트 커버리지 확인
pnpm --filter @ku/api test:cov
```

## 보안 고려사항

1. **인증**: 모든 엔드포인트는 JWT 인증이 필요합니다 (`@ApiBearerAuth()`)
2. **권한**: RBAC 기반 접근 제어 (추후 RolesGuard 적용 권장)
3. **파일 업로드 보안**:
   - 파일 크기 제한 (5MB)
   - 파일 타입 검증 (JPEG, PNG만 허용)
   - 파일명 sanitization 적용
4. **입력 검증**: 모든 입력값에 대한 엄격한 유효성 검증

## 성능 최적화

1. **싱글톤 설정**: 시스템 설정은 단일 레코드로 관리
2. **기본값 자동 생성**: 설정이 없을 경우 기본값으로 자동 생성
3. **파일 저장**: 로컬 파일 시스템 사용 (추후 S3 등으로 확장 가능)

## 추후 개선사항

- [ ] 설정 변경 이력 추적 (Audit Log)
- [ ] 이미지 최적화 (리사이징, 압축)
- [ ] 클라우드 스토리지 연동 (AWS S3, Azure Blob)
- [ ] 설정 캐싱 (Redis)
- [ ] WebSocket을 통한 실시간 설정 변경 알림
