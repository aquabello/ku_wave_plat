# 개발 가이드

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 개발 가이드

---

## 1. 사전 요구사항

| 항목 | 최소 버전 | 확인 명령 |
|------|----------|----------|
| Node.js | >= 20.0.0 | `node --version` |
| pnpm | 10.21.0+ | `pnpm --version` |
| MariaDB | 11.2 | `mariadb --version` |
| Git | 최신 | `git --version` |

### pnpm 설치

```bash
# corepack으로 설치 (권장)
corepack enable
corepack prepare pnpm@10 --activate

# 또는 npm으로 설치
npm install -g pnpm@10
```

---

## 2. 프로젝트 설정

### 2.1 클론 및 의존성 설치

```bash
git clone <repository-url> ku_wave_plat
cd ku_wave_plat
pnpm install
```

### 2.2 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에서 다음 항목을 편집한다:

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `DB_HOST` | Y | DB 호스트 | `127.0.0.1` |
| `DB_PORT` | Y | DB 포트 | `3306` |
| `DB_USERNAME` | Y | DB 사용자 | `sqlgw` |
| `DB_PASSWORD` | Y | DB 비밀번호 | `your_password` |
| `DB_DATABASE` | Y | DB 이름 | `ku_wave_plat` |
| `JWT_SECRET` | Y | JWT 시크릿 (32자+) | `random_string_32chars` |
| `JWT_REFRESH_SECRET` | Y | Refresh JWT 시크릿 | `random_string_32chars` |
| `API_PORT` | Y | API 포트 | `8000` |
| `CONSOLE_PORT` | Y | Console 포트 | `3000` |
| `NEXT_PUBLIC_API_URL` | Y | API URL | `http://localhost:8000/api/v1` |
| `ALLOWED_ORIGINS` | Y | CORS 허용 오리진 | `http://localhost:3000` |

### 2.3 데이터베이스 설정

```sql
-- MariaDB에 접속하여 DB 생성
CREATE DATABASE ku_wave_plat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 스키마 적용
mysql -u <user> -p ku_wave_plat < docs/init_database.sql
```

### 2.4 시드 데이터

```bash
pnpm --filter @ku/api seed:run
```

---

## 3. 개발 서버 실행

### 전체 실행

```bash
pnpm dev
```

이 명령은 Turborepo를 통해 다음 서비스를 동시에 시작한다:

| 서비스 | URL |
|--------|-----|
| Console (Next.js) | `http://localhost:3000` |
| API (NestJS) | `http://localhost:8000` |
| Swagger | `http://localhost:8000/api/v1/docs` |

### 개별 실행

```bash
# API만 실행
pnpm --filter @ku/api start:dev

# Console만 실행
pnpm --filter @ku/console dev

# NFC Agent (ACR122U 리더 필요)
pnpm --filter @ku/nfc start:dev
```

---

## 4. 빌드

### 전체 빌드

```bash
pnpm build
```

### 개별 빌드

```bash
# 공유 패키지 먼저 빌드 (의존성 순서)
pnpm --filter @ku/types build
pnpm --filter @ku/contracts build

# 앱 빌드
pnpm build --filter=@ku/api
pnpm build --filter=@ku/console
pnpm build --filter=@ku/nfc
```

---

## 5. 테스트

### 전체 테스트

```bash
pnpm test
```

### 유형별 테스트

```bash
pnpm test:unit          # 단위 테스트
pnpm test:integration   # 통합 테스트
pnpm test:e2e           # E2E 테스트
pnpm test:coverage      # 커버리지 리포트
```

### 앱별 테스트

```bash
# API 테스트
pnpm --filter @ku/api test
pnpm --filter @ku/api test:watch    # 감시 모드

# Console E2E
pnpm --filter @ku/console test:e2e
```

### 테스트 전략

| 유형 | 대상 | 목표 커버리지 |
|------|------|-------------|
| 단위 테스트 | Service 레이어 비즈니스 로직 | 80%+ |
| 통합 테스트 | Controller + Service + DB | 핵심 흐름 |
| E2E 테스트 | 사용자 시나리오 (Playwright) | 주요 플로우 |

---

## 6. 코드 품질

### ESLint

```bash
pnpm lint
```

### Prettier

```bash
pnpm format
```

### TypeScript 타입 체크

```bash
pnpm typecheck
```

### 사전 커밋 훅 (Husky + lint-staged)

커밋 시 자동으로 실행된다:
1. ESLint — 수정된 파일 검사
2. Prettier — 코드 포맷팅
3. TypeScript — 타입 체크

---

## 7. 워크스페이스 명령어

### 특정 워크스페이스에서 명령 실행

```bash
pnpm --filter @ku/api <command>
pnpm --filter @ku/console <command>
pnpm --filter @ku/nfc <command>
pnpm --filter @ku/types <command>
pnpm --filter @ku/contracts <command>
```

### 캐시 정리

```bash
# Turbo 캐시 정리
rm -rf .turbo

# 빌드 산출물 정리
pnpm clean

# node_modules 정리 후 재설치
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

## 8. DB 마이그레이션

```bash
# 마이그레이션 생성
pnpm --filter @ku/api migration:generate src/database/migrations/MigrationName

# 마이그레이션 실행
pnpm --filter @ku/api migration:run

# 마이그레이션 롤백
pnpm --filter @ku/api migration:revert
```

**주의**: `synchronize`는 항상 `false`이다. 스키마 변경은 반드시 마이그레이션으로만 수행한다.

---

## 9. 새 기능 추가 워크플로우

### 9.1 백엔드 (apps/api)

```bash
# 1. 모듈 스캐폴딩
cd apps/api
nest generate module modules/feature-name
nest generate controller modules/feature-name
nest generate service modules/feature-name

# 2. 엔티티, DTO, 가드 작성
# 3. feature.module.ts에 import/export 추가
# 4. 필요 시 app.module.ts 업데이트
```

### 9.2 프론트엔드 (apps/console)

```
1. app/(dashboard)/feature-name/page.tsx 생성
2. components/feature-name/ 에 컴포넌트 작성
3. lib/api/feature-name.ts 에 API 클라이언트 함수 추가
4. hooks/use-feature-name.ts 에 TanStack Query 훅 작성
```

### 9.3 공유 타입

```
1. packages/types/src/feature-name.ts 에 타입 추가
2. packages/types/src/index.ts 에서 export
3. 앱에서 import { TypeName } from '@ku/types'
```

---

## 10. 커밋 컨벤션

Conventional Commits를 따른다:

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 도구 변경
```

---

## 11. 코딩 규칙

### TypeScript

- **strict 모드**: 항상 활성화
- **any 금지**: 명시적 인터페이스 정의 필수
- **함수**: 파라미터 및 반환 타입 명시

### 백엔드

- **DTO**: class-validator 데코레이터로 검증 (클라이언트 입력 신뢰 금지)
- **비밀번호**: bcrypt 10 라운드 이상
- **쿼리**: TypeORM 파라미터화 쿼리 (SQL Injection 방지)
- **페이지네이션**: 모든 목록 엔드포인트에 필수

### 프론트엔드

- **API 호출 전**: `docs/api/*.api.md` 스펙 파일 확인 필수
- **타입**: `@ku/types`에서 import (로컬 중복 정의 금지)
- **폼**: React Hook Form + Zod (자식 컴포넌트 패턴)
- **페이지 저장**: API 단일 호출 (multipart로 원자적 처리)

---

## 12. 트러블슈팅

| 증상 | 해결 |
|------|------|
| DB 연결 실패 | `.env`의 DB 접속 정보 확인, `mysql -h DB_HOST -u DB_USERNAME -p` 테스트 |
| pnpm install 실패 | `pnpm --version` 확인 (10.21+), `pnpm store prune` 후 재시도 |
| TypeScript 에러 | `pnpm install` 실행, `pnpm typecheck`로 확인 |
| Turbo 캐시 이슈 | `rm -rf .turbo && pnpm clean && pnpm build` |
| 포트 충돌 | `lsof -i :8000` 또는 `lsof -i :3000`으로 확인 후 프로세스 종료 |
