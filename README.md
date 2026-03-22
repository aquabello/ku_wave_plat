# Ku-Wave-Plat

건국대학교 AI 컨트롤러 시스템 (Next.js + NestJS)

## 📋 프로젝트 개요

Ku-Wave-Plat은 건국대학교 AI 컨트롤러 시스템입니다.

### 주요 기능

- ✅ **수업화면공유**: 실시간 화면 공유
- ✅ **AI 실시간 음성 제어**: AI 실시간 음성 인식 및 제어
- ✅ **NFC 태깅시스템**: NFC 태깅 시스템
- ✅ **원격 제어관리**: 콘트롤러 시스템 연동 및 제어 솔루션
- ✅ **디스플레이스 시스템**: 디스플레이 제어 솔루션

## 🏗️ 아키텍처

### Monorepo 구조

```
ku-wave-plat/
├── apps/
│   ├── api/          # NestJS 백엔드 (Port 8000)
│   └── console/      # Next.js 관리자 (Port 3000)
├── packages/
│   ├── types/        # @ku/types (공유 타입)
│   ├── ui/           # @ku/ui (shadcn/ui)
│   └── config/       # @ku/config (ESLint/TS)
└── .env              # 환경 변수 (개발 DB 연결 정보)
```

### 기술 스택

#### 백엔드 (apps/api)

- **Framework**: NestJS 10.3+
- **Language**: TypeScript 5.3+ (strict mode)
- **Database**: MariaDB 11.2
- **ORM**: TypeORM 0.3.19+
- **Auth**: Passport + JWT
- **Validation**: class-validator
- **Docs**: Swagger/OpenAPI 3.0

#### 프론트엔드 (apps/console)

- **Framework**: Next.js 16.0+ (App Router)
- **Language**: TypeScript 5.3+ (strict mode)
- **UI**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4+
- **Table**: TanStack Table 8+
- **Charts**: Recharts 2+
- **Forms**: React Hook Form + Zod
- **State**: Zustand 5+
- **Data**: TanStack Query 5+

#### 공유 (packages/)

- **Monorepo**: pnpm workspaces 10.21+
- **Build**: Turborepo 2.7+

## 🚀 시작하기

### 사전 요구사항

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MariaDB 개발 DB 접속 정보

### 설치

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm@10.21.0

# 프로젝트 의존성 설치
pnpm install
```

### 환경 설정

```bash
# 환경 변수 파일 생성
cp .env.example .env

# .env 파일을 편집하여 개발 DB 연결 정보 설정
vi .env
```

**.env 파일 필수 설정:**
```bash
DB_HOST=개발DB호스트주소
DB_PORT=3306
DB_USERNAME=ku_user
DB_PASSWORD=실제비밀번호
DB_DATABASE=ku_wave_plat
```

### 데이터베이스 준비

```bash
# 개발 DB에 스키마 생성 (처음 한 번만)
CREATE DATABASE ku_wave_plat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev
```

개발 서버가 시작되면:

- **Console**: http://localhost:3000
  - Dashboard: http://localhost:3000/dashboard
  - Login: http://localhost:3000/login
- **API**: http://localhost:8000
  - Swagger 문서: http://localhost:8000/api/v1/docs
  - Health Check: http://localhost:8000/api/v1/health

## 📦 프로젝트 명령어

### 개발

```bash
pnpm dev              # 개발 서버 시작
```

### 빌드

```bash
pnpm build            # 전체 프로젝트 빌드
pnpm build --filter=@ku/api     # API만 빌드
pnpm build --filter=@ku/console # Console만 빌드
```

### 테스트

```bash
pnpm test             # 전체 테스트
pnpm test:unit        # 단위 테스트
pnpm test:integration # 통합 테스트
pnpm test:e2e         # E2E 테스트
pnpm test:coverage    # 테스트 커버리지
```

### 코드 품질

```bash
pnpm lint             # ESLint 검사
pnpm format           # Prettier 포맷팅
pnpm typecheck        # TypeScript 타입 체크
```

### 정리

```bash
pnpm clean            # 빌드 파일 및 node_modules 삭제
```

## 📁 프로젝트 구조

### apps/api (NestJS)

```
apps/api/
├── src/
│   ├── modules/                 # 도메인 모듈
│   │   ├── auth/                # 인증/인가
│   │   ├── users/               # 사용자 관리
│   │   ├── dashboard/           # 대시보드 통계
│   │   ├── nfc/                 # NFC 태깅
│   │   ├── remote-control/      # 원격 제어관리
│   │   ├── display/             # 디스플레이스 시스템
│   │   ├── screen-share/        # 수업화면공유
│   │   ├── voice-control/       # AI 실시간 음성 제어
│   │   └── settings/            # 시스템 설정
│   ├── common/                  # 공통 (decorators, filters, guards, pipes)
│   ├── config/                  # 환경 설정
│   ├── database/                # TypeORM 마이그레이션/시드
│   ├── main.ts
│   └── app.module.ts
└── package.json
```

### apps/console (Next.js)

```
apps/console/
├── src/
│   ├── app/
│   │   ├── (auth)/             # 인증 레이아웃
│   │   │   └── login/
│   │   ├── (dashboard)/        # 대시보드 레이아웃
│   │   │   ├── dashboard/      # 홈
│   │   │   ├── users/          # 사용자 관리
│   │   │   ├── nfc/            # NFC 태깅
│   │   │   ├── remote-control/ # 원격 제어관리
│   │   │   ├── display/        # 디스플레이스 시스템
│   │   │   ├── screen-share/   # 수업화면공유
│   │   │   ├── voice-control/  # AI 실시간 음성 제어
│   │   │   └── settings/       # 설정
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, UserMenu
│   │   ├── data-display/       # DataTable, StatCard, Chart
│   │   ├── forms/              # SearchFilter, DateRangePicker
│   │   └── ui/                 # shadcn/ui 컴포넌트
│   ├── hooks/
│   ├── lib/
│   └── stores/
└── package.json
```

### packages/

```
packages/
├── types/          # @ku/types - 공유 타입 정의
├── ui/             # @ku/ui - 공유 UI 컴포넌트
└── config/         # @ku/config - 공유 ESLint/TS 설정
```

## 🔐 보안

### 인증/권한

- **JWT 인증**: Access Token (15분) + Refresh Token (7일)
- **RBAC**: admin, manager, viewer 역할
- **비밀번호**: bcrypt 해싱 (10 rounds)

### 보안 헤더

- **Helmet**: 보안 헤더 자동 설정
- **CORS**: 화이트리스트 기반 origin 제어
- **Rate Limiting**: API 요청 제한

## 📊 API 문서

API 문서는 Swagger로 자동 생성됩니다:

- **로컬**: http://localhost:8000/api/v1/docs
- **인증**: Bearer Token 필요

### 주요 엔드포인트

```
POST   /api/v1/auth/login       # 로그인
GET    /api/v1/auth/me          # 현재 사용자
GET    /api/v1/users            # 사용자 목록
GET    /api/v1/dashboard/stats  # 대시보드 통계
GET    /api/v1/products         # 상품 목록
GET    /api/v1/orders           # 주문 목록
```

## 🧪 테스트

### 테스트 전략

- **단위 테스트**: Service 로직 (80%+ 커버리지)
- **통합 테스트**: Controller + Service + DB
- **E2E 테스트**: Playwright (주요 사용자 플로우)

### 실행

```bash
# 전체 테스트
pnpm test

# 개별 패키지 테스트
pnpm --filter @ku/api test
pnpm --filter @ku/console test:e2e

# Watch 모드
pnpm --filter @ku/api test:watch

# 커버리지
pnpm test:coverage
```

## 🚢 배포

### 프로덕션 빌드

```bash
# 전체 빌드
pnpm build

# 환경 변수 확인
cp .env.example .env.production
vi .env.production
```

### Docker 프로덕션 배포

```bash
# 프로덕션 컨테이너 시작
docker compose -f docker-compose.prod.yml up -d

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f
```

## 🤝 기여

### 개발 워크플로우

1. 새 브랜치 생성: `git checkout -b feature/new-feature`
2. 변경 사항 커밋: `git commit -m "feat: add new feature"`
3. 테스트 실행: `pnpm test`
4. 타입 체크: `pnpm typecheck`
5. Lint 검사: `pnpm lint`
6. Pull Request 생성

### 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 사용:

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 프로세스 또는 도구 변경
```

## 📝 라이센스

Private

## 📞 지원

문제가 발생하면 이슈를 생성해주세요: [Issues](https://github.com/your-org/ku-ai-ctl/issues)

---

**Made with ❤️ by KU Wave Plat**


ku_wave_plat (운영 서버)

curl -O https://raw.githubusercontent.com/aquabello/ku_wave_plat/main/scripts/install/setup.sh
chmod +x setup.sh
sudo ./setup.sh

ku_ai_pc (강의실)

curl -O https://raw.githubusercontent.com/aquabello/ku_ai_pc/main/scripts/install/setup.sh
chmod +x setup.sh
sudo ./setup.sh


# ku_wave_plat 운영 서버

## 1. 소스 배포
git clone https://github.com/aquabello/ku_wave_plat.git /opt/ku_wave_plat
cd /opt/ku_wave_plat

## 2. 순서대로 실행
sudo ./scripts/install/01-base-setup.sh          # Node.js 24 + PM2 + pcscd
sudo ./scripts/install/02-mariadb-setup.sh       # MariaDB + sqlgw 계정
sudo apt install -y vim
sudo vim /opt/ku_wave_plat/.env                   # DB 비밀번호, JWT, 서버 IP 수정
sudo ./scripts/install/03-app-build.sh            # pnpm build + PM2 시작
sudo ./scripts/install/04-nginx-setup.sh          # Nginx 리버스 프록시
sudo ./scripts/install/05-backup-cron.sh          # DB 백업 cron

# ku_ai_pc 강의실

## 1. 소스 배포
git clone https://github.com/today25/ku_ai_pc.git /opt/ku_ai_pc
cd /opt/ku_ai_pc

## 2. 순서대로 실행
sudo ./scripts/install/01-base-setup.sh           # Python + 시스템 패키지
sudo -u ku ./scripts/install/02-app-install.sh    # venv + 의존성
sudo apt install -y vim
sudo vim /opt/ku_ai_pc/.env                       # 호실별 설정
sudo ./scripts/install/03-service-setup.sh        # systemd + 헬스모니터



⏺ # 1. npm으로 설치
npm install -g @anthropic-ai/claude-code

# 2. 실행 + 로그인
claude