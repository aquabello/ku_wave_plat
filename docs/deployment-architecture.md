# KU-WAVE-PLAT 배포 아키텍처 설계서

> **Version**: 1.0
> **Date**: 2026-02-10
> **Status**: Draft
> **Author**: Architecture Team

---

## 1. 개요

### 1.1 목적
KU-WAVE-PLAT 모노레포의 3개 서비스를 단일 Ubuntu 서버에 Kamal 2.x 기반으로 배포하기 위한 아키텍처 설계서.

### 1.2 서비스 목록

| 서비스 | 패키지명 | 역할 | 런타임 |
|--------|----------|------|--------|
| **API** | `@ku/api` | NestJS 백엔드 REST API | Node.js 20+ |
| **Console** | `@ku/console` | Next.js 16 관리자 대시보드 | Node.js 20+ |
| **NFC Agent** | `@ku/nfc` | ACR122U NFC 리더 에이전트 | Node.js 20+ (USB HW 의존) |

### 1.3 NFC 서비스 특이사항

`@ku/nfc`는 USB NFC 리더(`nfc-pcsc`)에 의존하는 **에지 에이전트**다.
서버에 물리 NFC 리더가 연결되어 있지 않으면 컨테이너로 배포하더라도 동작하지 않는다.

| 배포 시나리오 | 설명 |
|-------------|------|
| **시나리오 A** | 서버에 USB NFC 리더 연결 → Docker `--device` 옵션으로 컨테이너에 디바이스 마운트 |
| **시나리오 B** | NFC 리더는 별도 엣지 디바이스(교실 PC/라즈베리파이)에서 실행 → 서버에는 API+Console만 배포 |

> 본 설계서는 **시나리오 B를 기본**으로 하되, 시나리오 A도 부록에 포함한다.

---

## 2. 인프라 아키텍처

### 2.1 서버 사양 (권장)

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| Docker | 24.0+ | 27.0+ |

### 2.2 네트워크 구성 (단일 서버)

```
                        ┌─────────────────────────────────────────────┐
    Internet            │              Ubuntu Server                  │
        │               │                                             │
        ▼               │  ┌──────────────────────┐                   │
   ┌─────────┐          │  │     Nginx (Host)      │                  │
   │ Client  │─────────────▶  :80 → redirect :443  │                  │
   │ Browser │          │  │  :443 (SSL terminate)  │                  │
   └─────────┘          │  └──────────┬───────────┘                   │
                        │             │                               │
                        │             ▼                               │
                        │  ┌──────────────────────┐                   │
                        │  │   kamal-proxy (:81)   │                  │
                        │  │   (컨테이너 라우팅)     │                  │
                        │  └──┬───────────────┬───┘                   │
                        │     │               │                       │
                        │     ▼               ▼                       │
                        │  ┌────────┐   ┌──────────┐                  │
                        │  │  API   │   │ Console  │                  │
                        │  │ :3000i │   │  :3001i  │                  │
                        │  │(NestJS)│   │(Next.js) │                  │
                        │  └───┬────┘   └──────────┘                  │
                        │      │                                      │
                        │      ▼                                      │
                        │  ┌────────────┐    ┌──────────────┐         │
                        │  │  MariaDB   │    │ uploads/     │         │
                        │  │   :3306    │    │ (volume)     │         │
                        │  └────────────┘    └──────────────┘         │
                        └─────────────────────────────────────────────┘

  * :3000i, :3001i = 내부 컨테이너 포트 (외부 미노출)
```

### 2.3 왜 Nginx + kamal-proxy 이중 구조인가?

| 역할 | Nginx (앞단) | kamal-proxy (뒷단) |
|------|-------------|-------------------|
| SSL 인증서 관리 | Let's Encrypt + certbot 자동 갱신 | - |
| 제로 다운타임 배포 | - | 블루-그린 컨테이너 스위칭 |
| Rate Limiting | `limit_req_zone` | - |
| IP 화이트리스트 | `allow/deny` | - |
| Gzip 압축 | `gzip on` | - |
| 정적 파일 캐싱 | `proxy_cache` | - |
| 요청 크기 제한 | `client_max_body_size` | - |
| 보안 헤더 | HSTS, X-Frame-Options 등 | - |
| 컨테이너 라우팅 | - | 경로 기반 서비스 분배 |
| 헬스 체크 | - | 컨테이너 상태 모니터링 |
| 자동 롤백 | - | 헬스 체크 실패 시 이전 버전 유지 |

> **결론**: Nginx는 **보안/성능 게이트웨이**, kamal-proxy는 **배포/라우팅 엔진**. 역할이 다르므로 이중 구조가 적합.

---

## 3. 라우팅 설계

### 3.1 도메인/경로 매핑

| URL 패턴 | 라우팅 대상 | 설명 |
|---------|-----------|------|
| `https://admin.ku-wave.kr/` | Console (Next.js) | 관리자 대시보드 |
| `https://admin.ku-wave.kr/api/v1/*` | API (NestJS) | REST API |
| `https://admin.ku-wave.kr/uploads/*` | API 정적 파일 | 업로드된 이미지/파일 |

### 3.2 Nginx 라우팅 흐름

```
요청 → Nginx (:443)
         ├─ /api/v1/*    → kamal-proxy → API 컨테이너
         ├─ /uploads/*   → kamal-proxy → API 컨테이너 (또는 직접 volume serve)
         └─ /*           → kamal-proxy → Console 컨테이너
```

---

## 4. CI/CD 파이프라인

### 4.1 Jenkins가 필요한가?

| 항목 | Kamal 단독 | Kamal + Jenkins |
|------|-----------|----------------|
| Docker 이미지 빌드 | 로컬 빌드 → 레지스트리 push | Jenkins가 빌드 |
| 테스트 실행 | 수동 / git hook | Jenkins가 자동 실행 |
| 린트 체크 | 수동 / git hook | Jenkins가 자동 실행 |
| 배포 트리거 | `kamal deploy` 수동 | Jenkins → `kamal deploy` 자동 |
| 빌드 이력 관리 | 없음 | Jenkins 대시보드 |
| 멀티 브랜치 | 수동 destination 전환 | 자동 브랜치별 파이프라인 |
| 알림 | 없음 | Slack/이메일 연동 |

### 4.2 권장안: Kamal + 경량 CI

대학 프로젝트 규모에서 Jenkins는 **과잉**이다. Jenkins 자체가 서버 자원을 상당히 소비하고 관리 부담도 크다.

**권장: GitHub Actions (또는 Gitea Actions)**

```
┌─────────────┐     ┌────────────────────┐     ┌──────────────┐
│  Developer   │     │   GitHub Actions    │     │ Ubuntu Server│
│             │     │                    │     │              │
│  git push   ├────▶│  1. pnpm install   │     │              │
│  to main    │     │  2. pnpm lint      │     │              │
│             │     │  3. pnpm typecheck  │     │              │
└─────────────┘     │  4. pnpm test      │     │              │
                    │  5. Docker build    │     │              │
                    │  6. Push to GHCR    │     │              │
                    │  7. kamal deploy ───┼────▶│  배포 완료    │
                    └────────────────────┘     └──────────────┘
```

**Jenkins가 필요한 경우:**
- GitHub/Gitea를 사용하지 않고 자체 Git 서버를 운영하는 경우
- 복잡한 빌드 파이프라인이 필요한 경우 (현재는 아님)
- 학교 인프라에 이미 Jenkins가 있는 경우

### 4.3 파이프라인 단계

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Commit  │──▶│  Lint &  │──▶│  Test    │──▶│  Build   │──▶│  Deploy  │
│  Push    │   │ Typecheck│   │  (Unit)  │   │ (Docker) │   │ (Kamal)  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │               │              │               │
     │         실패 시 중단      실패 시 중단    이미지 push      제로 다운타임
     │                                         (GHCR/Harbor)    블루-그린
```

---

## 5. Docker 전략

### 5.1 이미지 구성

모노레포이므로 **서비스별 Dockerfile**을 만든다.

| Dockerfile | 빌드 컨텍스트 | 베이스 이미지 | 예상 크기 |
|-----------|-------------|-------------|----------|
| `apps/api/Dockerfile` | 모노레포 루트 | `node:20-alpine` | ~200MB |
| `apps/console/Dockerfile` | 모노레포 루트 | `node:20-alpine` | ~300MB |

### 5.2 빌드 최적화 전략

```
# 멀티스테이지 빌드 (공통 패턴)

Stage 1: deps     → pnpm install (캐시 레이어)
Stage 2: builder  → pnpm build --filter=@ku/api
Stage 3: runner   → 빌드 산출물만 복사 (node_modules pruned)
```

**모노레포 Docker 빌드 핵심:**
- 빌드 컨텍스트는 **모노레포 루트** (packages/types 의존성 해결)
- `pnpm deploy --filter=@ku/api --prod` 로 프로덕션 의존성만 추출
- `.dockerignore`로 불필요 파일 제외

### 5.3 컨테이너 레지스트리

| 옵션 | 비용 | 비고 |
|------|------|------|
| **GitHub Container Registry (GHCR)** | 무료 (공개) | GitHub Actions 연동 최적 |
| **Docker Hub** | 무료 (1 private) | 가장 범용적 |
| **자체 Harbor** | 무료 (셀프호스팅) | 서버 자원 추가 필요 |
| **서버 로컬 빌드** | 무료 | 레지스트리 불필요, 빌드 시간 증가 |

> **권장**: GHCR (GitHub Actions 사용 시) 또는 서버 로컬 빌드 (레지스트리 없이 단순하게)

---

## 6. Kamal 설정 설계

### 6.1 디렉토리 구조

```
ku_wave_plat/
├── deploy.yml                  # Kamal 메인 설정
├── deploy.staging.yml          # 스테이징 오버라이드 (IP 변경 시)
├── deploy.production.yml       # 운영 오버라이드 (IP 변경 시)
├── .kamal/
│   └── secrets                 # 환경변수 (git 미추적)
├── apps/
│   ├── api/
│   │   └── Dockerfile
│   └── console/
│       └── Dockerfile
└── nginx/
    ├── nginx.conf              # Nginx 메인 설정
    └── conf.d/
        └── ku-wave.conf        # 사이트 설정
```

### 6.2 deploy.yml 설계 (핵심)

```yaml
# deploy.yml
service: ku-wave-plat
image: ku-wave-plat

servers:
  api:
    hosts:
      - 서버_IP
    cmd: node dist/main.js
    options:
      publish:
        - "3000:3000"       # 내부 포트
      memory: 512m
      cpus: 1
    healthcheck:
      path: /api/v1/health
      port: 3000
      interval: 10
      max_attempts: 30

  console:
    hosts:
      - 서버_IP
    cmd: node server.js
    options:
      publish:
        - "3001:3000"       # Next.js 기본 3000 → 호스트 3001
      memory: 512m
      cpus: 1
    healthcheck:
      path: /
      port: 3001
      interval: 10
      max_attempts: 30

# 컨테이너 레지스트리
registry:
  server: ghcr.io
  username: github-username
  password:
    - KAMAL_REGISTRY_PASSWORD

# 환경변수
env:
  clear:
    NODE_ENV: production
  secret:
    - DB_HOST
    - DB_PORT
    - DB_USERNAME
    - DB_PASSWORD
    - DB_DATABASE
    - JWT_SECRET
    - JWT_REFRESH_SECRET

# Nginx를 Kamal accessory로 관리
accessories:
  nginx:
    image: nginx:1.27-alpine
    host: 서버_IP
    port: "80:80"
    publish:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - nginx-logs:/var/log/nginx
    options:
      restart: unless-stopped

  db:
    image: mariadb:11.2
    host: 서버_IP
    port: "127.0.0.1:3306:3306"    # localhost만 바인딩 (보안)
    env:
      clear:
        MARIADB_CHARACTER_SET_SERVER: utf8mb4
        MARIADB_COLLATE_SERVER: utf8mb4_unicode_ci
      secret:
        - MARIADB_ROOT_PASSWORD
        - MARIADB_DATABASE
    volumes:
      - mariadb-data:/var/lib/mysql
    options:
      restart: unless-stopped
      memory: 1g
```

### 6.3 IP 변경 배포 (Destination)

```yaml
# deploy.staging.yml
servers:
  api:
    hosts:
      - 192.168.1.200        # 스테이징 서버 IP
  console:
    hosts:
      - 192.168.1.200

accessories:
  nginx:
    host: 192.168.1.200
  db:
    host: 192.168.1.200
```

```bash
# 기본 서버 배포
kamal deploy

# 스테이징 (다른 IP) 배포
kamal deploy -d staging

# 운영 (또 다른 IP) 배포
kamal deploy -d production
```

---

## 7. Nginx 설정 설계

### 7.1 메인 설정

```nginx
# nginx/conf.d/ku-wave.conf

upstream kamal_api {
    server 127.0.0.1:3000;      # API 컨테이너
}

upstream kamal_console {
    server 127.0.0.1:3001;      # Console 컨테이너
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name admin.ku-wave.kr;
    return 301 https://$host$request_uri;
}

# HTTPS 메인
server {
    listen 443 ssl http2;
    server_name admin.ku-wave.kr;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/admin.ku-wave.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.ku-wave.kr/privkey.pem;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 요청 크기 제한 (파일 업로드용)
    client_max_body_size 50M;

    # Gzip 압축
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

    # API 라우팅
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://kamal_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 업로드 파일 (캐싱)
    location /uploads/ {
        proxy_pass http://kamal_api;
        proxy_cache_valid 200 1h;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Console (Next.js)
    location / {
        proxy_pass http://kamal_console;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket (Next.js HMR - 운영에서는 불필요하나 안전하게 포함)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 7.2 SSL 인증서 자동 갱신

```bash
# certbot으로 Let's Encrypt 인증서 발급
certbot certonly --nginx -d admin.ku-wave.kr

# cron으로 자동 갱신 (2개월마다)
0 3 1 */2 * certbot renew --quiet && nginx -s reload
```

---

## 8. 배포 플로우

### 8.1 최초 배포

```
1. 서버 준비
   ├── Ubuntu 설치
   ├── Docker 설치
   ├── SSH 키 등록
   └── 방화벽 설정 (22, 80, 443만 개방)

2. Kamal 초기화
   ├── kamal setup               # Docker, kamal-proxy 설치
   ├── kamal accessory boot db   # MariaDB 시작
   ├── DB 스키마 생성 (init_database.sql)
   └── kamal accessory boot nginx # Nginx 시작

3. SSL 인증서
   └── certbot 실행

4. 앱 배포
   └── kamal deploy              # API + Console 빌드 & 배포
```

### 8.2 일반 배포 (코드 변경 시)

```
Developer: git push → CI 실행 → kamal deploy

내부 동작:
  1. Docker 이미지 빌드 (api, console)
  2. 레지스트리에 push
  3. 서버에서 새 이미지 pull
  4. 새 컨테이너 시작
  5. 헬스 체크 통과 확인
  6. kamal-proxy가 트래픽을 새 컨테이너로 전환
  7. 이전 컨테이너 종료
  → 제로 다운타임 완료
```

### 8.3 IP 변경 배포 (서버 이전)

```
1. 새 서버 준비
   └── deploy.newserver.yml 작성 (새 IP)

2. 새 서버에 배포
   └── kamal deploy -d newserver

3. DB 마이그레이션
   └── 기존 DB dump → 새 서버 DB에 import

4. DNS 변경
   └── admin.ku-wave.kr → 새 서버 IP

5. 기존 서버 정리
   └── kamal app remove (기존 서버)
```

---

## 9. 롤백 전략

| 상황 | 명령어 | 동작 |
|------|--------|------|
| 배포 중 헬스체크 실패 | 자동 | kamal-proxy가 이전 컨테이너 유지 |
| 배포 후 문제 발견 | `kamal rollback VERSION` | 이전 이미지로 즉시 롤백 |
| 특정 서비스만 롤백 | `kamal app boot --version=VERSION` | 해당 서비스만 이전 버전 |

---

## 10. 시크릿 관리

### 10.1 .kamal/secrets

```bash
# .kamal/secrets (git에 절대 포함하지 않음)
KAMAL_REGISTRY_PASSWORD=ghp_xxxxxxxxxxxx
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=ku_user
DB_PASSWORD=strong_password_here
DB_DATABASE=ku_wave_plat
JWT_SECRET=jwt_secret_here
JWT_REFRESH_SECRET=jwt_refresh_secret_here
MARIADB_ROOT_PASSWORD=root_password_here
MARIADB_DATABASE=ku_wave_plat
```

### 10.2 시크릿 배포

```bash
# 서버에 환경변수 전달
kamal env push

# 시크릿 변경 후 재배포
kamal env push && kamal deploy
```

---

## 11. 모니터링

### 11.1 기본 모니터링 (Kamal 내장)

```bash
# 서비스 상태 확인
kamal details

# 로그 확인
kamal app logs -f              # 전체
kamal app logs -f -r api       # API만

# 컨테이너 상태
kamal app containers
```

### 11.2 권장 모니터링 스택 (향후)

| 도구 | 역할 | 우선순위 |
|------|------|---------|
| **Kamal 내장 명령어** | 기본 상태 확인 | 즉시 |
| **Nginx access/error log** | 요청 추적, 에러 탐지 | 즉시 |
| **Docker health check** | 컨테이너 상태 | 즉시 |
| Uptime Kuma (self-hosted) | 서비스 가용성 모니터링 | 단기 |
| Loki + Grafana | 로그 수집 및 시각화 | 중기 |

---

## 12. 보안 체크리스트

| 항목 | 설정 |
|------|------|
| SSH | 키 인증만 허용, 비밀번호 로그인 비활성화 |
| 방화벽 (ufw) | 22, 80, 443만 개방 |
| MariaDB 포트 | `127.0.0.1:3306` (localhost만 바인딩) |
| Docker 소켓 | root 권한 관리 |
| 환경변수 | `.kamal/secrets` 파일, git 미추적 |
| SSL | Let's Encrypt, 자동 갱신 |
| Nginx 보안 헤더 | HSTS, X-Frame-Options, CSP 등 |
| Rate Limiting | API 30req/s, burst 50 |
| 파일 업로드 | 50MB 제한 |

---

## 13. 비용 분석

### 단일 서버 기준

| 항목 | 월 비용 (추정) |
|------|--------------|
| VPS 4vCPU/8GB (Vultr, Hetzner 등) | $20~40 |
| 도메인 | $1~2 |
| SSL (Let's Encrypt) | 무료 |
| Docker Registry (GHCR) | 무료 |
| 모니터링 (Uptime Kuma) | 무료 (self-hosted) |
| **합계** | **$21~42/월** |

vs. AWS 매니지드 (ECS + RDS + ALB): **$150~300/월**

---

## 14. 향후 확장 경로

```
Phase 1 (현재)          Phase 2               Phase 3
─────────────          ─────────             ─────────
단일 서버               서버 2대              K8s 전환
Kamal + Nginx          Kamal 멀티호스트       EKS/GKE
MariaDB 동일 서버       DB 서버 분리          RDS/CloudSQL
로컬 파일 업로드        S3 오브젝트 스토리지   CDN + S3
GitHub Actions         GitHub Actions        ArgoCD
```

---

## 부록 A: NFC Agent 서버 배포 (시나리오 A)

서버에 USB NFC 리더가 연결된 경우:

```yaml
# deploy.yml에 추가
servers:
  nfc:
    hosts:
      - 서버_IP
    cmd: node dist/index.js
    options:
      # USB 디바이스 패스스루
      device:
        - "/dev/bus/usb:/dev/bus/usb"
      # PC/SC 데몬 소켓 마운트
      volume:
        - "/var/run/pcscd:/var/run/pcscd"
      memory: 256m
      cpus: 0.5
```

**주의사항:**
- 호스트에 `pcscd` 데몬이 실행 중이어야 함
- Docker `--privileged` 또는 `--device` 권한 필요
- NFC 리더 분리/재연결 시 컨테이너 재시작 필요

---

## 부록 B: Jenkins를 사용하는 경우

학교 인프라에 Jenkins가 이미 있다면:

```
Jenkins Pipeline:
  1. Checkout → pnpm install
  2. Lint & Typecheck
  3. Unit Test
  4. Docker Build & Push
  5. SSH → kamal deploy (또는 kamal 직접 실행)
```

```groovy
// Jenkinsfile (개요)
pipeline {
    agent any
    stages {
        stage('Install')   { steps { sh 'pnpm install' } }
        stage('Lint')      { steps { sh 'pnpm lint' } }
        stage('Typecheck') { steps { sh 'pnpm typecheck' } }
        stage('Test')      { steps { sh 'pnpm test' } }
        stage('Deploy')    { steps { sh 'kamal deploy' } }
    }
    post {
        failure { /* Slack 알림 */ }
        success { /* Slack 알림 */ }
    }
}
```

> Jenkins 사용 시 Kamal은 **배포 도구로만** 사용하고, CI는 Jenkins가 전담한다.
