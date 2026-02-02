# HTTP Client Module

NestJS 백엔드에서 외부 API 호출을 위한 공통 HTTP 클라이언트 모듈입니다. [ofetch](https://github.com/unjs/ofetch) 기반으로 구축되었습니다.

## 특징

- **TypeScript 제네릭 지원**: 응답 타입 추론 자동화
- **자동 재시도**: 실패 시 exponential backoff를 통한 자동 재시도
- **인터셉터 지원**: Request/Response 인터셉터로 로깅 및 에러 처리
- **타임아웃 설정**: 요청별 타임아웃 설정 가능
- **NestJS DI 통합**: Injectable 서비스로 의존성 주입 가능
- **환경변수 통합**: ConfigService를 통한 설정 관리
- **Global 모듈**: 한 번 import하면 모든 모듈에서 사용 가능

## 설치

이미 설치되어 있습니다. `ofetch` 패키지는 `apps/api/package.json`에 포함되어 있습니다.

## 설정

### 환경변수

`.env` 파일에 다음 설정을 추가할 수 있습니다:

```env
# HTTP Client 기본 설정 (선택사항)
HTTP_CLIENT_BASE_URL=https://api.example.com
HTTP_CLIENT_TIMEOUT=30000
HTTP_CLIENT_RETRY=3
HTTP_CLIENT_RETRY_DELAY=1000
```

| 환경변수 | 설명 | 기본값 |
|---------|------|--------|
| `HTTP_CLIENT_BASE_URL` | 외부 API 기본 URL (선택) | undefined |
| `HTTP_CLIENT_TIMEOUT` | 요청 타임아웃 (ms) | 30000 |
| `HTTP_CLIENT_RETRY` | 재시도 횟수 | 3 |
| `HTTP_CLIENT_RETRY_DELAY` | 재시도 간격 (ms) | 1000 |

### 모듈 설정

`HttpClientModule`은 **Global 모듈**로 이미 `app.module.ts`에 등록되어 있습니다.

```typescript
// app.module.ts
@Module({
  imports: [
    // ...
    HttpClientModule, // 이미 등록됨
    // ...
  ],
})
export class AppModule {}
```

## 사용법

### 기본 사용

Feature 모듈에서 `HttpClientService`를 주입하여 사용합니다:

```typescript
import { Injectable } from '@nestjs/common';
import { HttpClientService } from '@/common/http';

@Injectable()
export class YourService {
  constructor(private readonly httpClient: HttpClientService) {}

  async fetchData(): Promise<any> {
    return this.httpClient.get('/endpoint');
  }
}
```

### HTTP 메서드

#### GET 요청

```typescript
// 기본 GET
const data = await this.httpClient.get<UserResponse>('/users');

// Query 파라미터 포함
const data = await this.httpClient.get<UserResponse[]>('/users', {
  query: { page: '1', limit: '10' }
});

// 커스텀 헤더 포함
const data = await this.httpClient.get<UserResponse>('/users/1', {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### POST 요청

```typescript
// JSON 데이터 전송
const user = await this.httpClient.post<UserResponse>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// 커스텀 헤더와 함께
const user = await this.httpClient.post<UserResponse>('/users', userData, {
  headers: { 'X-API-Key': 'your-key' }
});
```

#### PUT/PATCH 요청

```typescript
// PUT (전체 업데이트)
const updated = await this.httpClient.put<UserResponse>(`/users/${id}`, userData);

// PATCH (부분 업데이트)
const updated = await this.httpClient.patch<UserResponse>(`/users/${id}`, {
  name: 'New Name'
});
```

#### DELETE 요청

```typescript
await this.httpClient.delete(`/users/${id}`);
```

### 고급 사용법

#### 커스텀 타임아웃

```typescript
const data = await this.httpClient.get('/slow-endpoint', {
  timeout: 5000 // 5초 타임아웃
});
```

#### 재시도 설정 오버라이드

```typescript
const data = await this.httpClient.post('/critical-endpoint', body, {
  retry: 5,           // 5번 재시도
  retryDelay: 2000    // 2초 간격
});
```

#### 병렬 요청

```typescript
const [users, posts] = await Promise.all([
  this.httpClient.get<User[]>('/users'),
  this.httpClient.get<Post[]>('/posts')
]);
```

#### 커스텀 클라이언트 생성

특정 외부 서비스용으로 별도 클라이언트를 만들 수 있습니다:

```typescript
@Injectable()
export class ExternalApiService {
  private client: typeof ofetch;

  constructor(private readonly httpClient: HttpClientService) {
    this.client = this.httpClient.createCustomClient({
      baseURL: 'https://api.external-service.com',
      timeout: 10000,
      headers: {
        'X-API-Key': process.env.EXTERNAL_API_KEY
      }
    });
  }

  async getData(): Promise<any> {
    return this.client('/data');
  }
}
```

#### 에러 핸들링

```typescript
try {
  const data = await this.httpClient.get<UserResponse>(`/users/${id}`);
  return data;
} catch (error) {
  // 에러는 자동으로 로깅됨
  // FetchError의 경우 status, statusText, data 포함
  if (error.response?.status === 404) {
    return null; // 사용자 없음
  }
  throw error; // 다른 에러는 재발생
}
```

#### FormData 전송 (파일 업로드)

```typescript
async uploadFile(file: Buffer, filename: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', new Blob([file]), filename);

  return this.httpClient.post<{ url: string }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

## 로깅

`HttpClientService`는 자동으로 요청/응답을 로깅합니다:

- **DEBUG 레벨**: 정상 요청/응답
- **ERROR 레벨**: 에러 발생 시 (요청 에러, 응답 에러)

로그 예시:
```
[HttpClientService] HTTP Request: GET /users
[HttpClientService] HTTP Response: 200 OK
[HttpClientService] HTTP Response Error: /users/999 - 404 Not Found
```

## 인터셉터

`HttpClientService`는 4가지 인터셉터를 지원합니다:

1. **onRequest**: 요청 전 실행
2. **onResponse**: 응답 성공 시 실행
3. **onRequestError**: 요청 에러 시 실행
4. **onResponseError**: 응답 에러 시 실행

기본적으로 모든 인터셉터에서 로깅을 수행하며, 커스텀 클라이언트 생성 시 추가 로직을 주입할 수 있습니다.

## 예제 코드

전체 예제는 `http-client.example.ts` 파일을 참고하세요.

## 참고사항

- `HttpClientModule`은 Global 모듈이므로 feature 모듈에서 별도로 import할 필요 없습니다.
- TypeScript 제네릭을 활용하여 응답 타입을 명시하면 타입 안전성이 보장됩니다.
- 기본 설정은 `.env` 파일에서 관리하고, 요청별로 오버라이드 가능합니다.
- 에러는 자동으로 로깅되므로 catch 블록에서는 비즈니스 로직 처리에만 집중하세요.

## API 레퍼런스

### HttpClientService

#### 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `request<T>` | `request<T>(url: string, options?: FetchOptions): Promise<T>` | 범용 HTTP 요청 |
| `get<T>` | `get<T>(url: string, options?: FetchOptions): Promise<T>` | GET 요청 |
| `post<T>` | `post<T>(url: string, body?: unknown, options?: FetchOptions): Promise<T>` | POST 요청 |
| `put<T>` | `put<T>(url: string, body?: unknown, options?: FetchOptions): Promise<T>` | PUT 요청 |
| `patch<T>` | `patch<T>(url: string, body?: unknown, options?: FetchOptions): Promise<T>` | PATCH 요청 |
| `delete<T>` | `delete<T>(url: string, options?: FetchOptions): Promise<T>` | DELETE 요청 |
| `createCustomClient` | `createCustomClient(options: FetchOptions): typeof ofetch` | 커스텀 클라이언트 생성 |

### FetchOptions

주요 옵션 (자세한 내용은 [ofetch 문서](https://github.com/unjs/ofetch) 참조):

```typescript
interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  baseURL?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  onRequest?: (ctx) => void;
  onResponse?: (ctx) => void;
  onRequestError?: (ctx) => void;
  onResponseError?: (ctx) => void;
  // ... 더 많은 옵션
}
```

## 문제 해결

### 타임아웃 에러

요청이 타임아웃되는 경우:
1. `.env`에서 `HTTP_CLIENT_TIMEOUT` 값 증가
2. 또는 요청 시 `timeout` 옵션 오버라이드

### 재시도 실패

재시도가 모두 실패하는 경우:
1. 외부 API 상태 확인
2. 네트워크 연결 확인
3. `HTTP_CLIENT_RETRY` 값 조정

### TypeScript 타입 에러

응답 타입이 맞지 않는 경우:
1. 제네릭 타입을 명시적으로 지정
2. API 응답 스키마 확인
3. 인터페이스 정의 업데이트
