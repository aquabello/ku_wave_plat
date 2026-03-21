# ku_wave_plat 운영 서버 셋업 (PM2 + Nginx)

> **대상**: 운영 서버 (Ubuntu 24.04, 고정 IP)
> **작성일**: 2026-03-22
> **방식**: PM2 직접 설치, HTTP(고정 IP), MariaDB 외부 접근 허용

---

## 1. 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                운영 서버 (Ubuntu 24.04)                        │
│                고정 IP: xxx.xxx.xxx.xxx                        │
│                                                              │
│  ┌──────────┐    ┌─────────────┐    ┌───────────────────┐    │
│  │  Nginx   │───▶│  API        │───▶│  MariaDB          │    │
│  │  :80     │    │  :8000 (PM2)│    │  :3306            │    │
│  │          │    └─────────────┘    │  (0.0.0.0 바인딩)  │    │
│  │          │    ┌─────────────┐    │  외부 접근 허용     │    │
│  │          │───▶│  Console    │    └───────────────────┘    │
│  │          │    │  :3000 (PM2)│                              │
│  └──────────┘    └─────────────┘    ┌───────────────────┐    │
│                                     │  uploads/          │    │
│                                     │  (로컬 디렉토리)    │    │
│                                     └───────────────────┘    │
└──────────────────────────────────────────────────────────────┘
        ▲                    ▲                    ▲
        │ HTTP :80           │ REST API           │ MySQL :3306
        │                    │ (JWT)              │
┌───────┴──────┐    ┌───────┴──────────┐    ┌────┴──────────┐
│  관리자       │    │ ku_ai_pc          │    │ 외부 DB 툴    │
│  브라우저     │    │ ku_ai_pc         │    │ (DBeaver 등)  │
└──────────────┘    └──────────────────┘    └───────────────┘
```

---

## 2. 서버 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| 포트 개방 | 22, 80, 3306 | 22, 80, 3306 |

---

## 3. 셋업 스크립트 구조

```
ku_wave_plat/
└── scripts/
    └── server/
        ├── 01-base-setup.sh          # OS 기본 + Node.js + pnpm + PM2
        ├── 02-mariadb-setup.sh        # MariaDB 설치 + 외부 접근 설정
        ├── 03-app-build.sh            # 앱 빌드 + PM2 실행
        ├── 04-nginx-setup.sh          # Nginx 리버스 프록시
        ├── 05-backup-cron.sh          # DB 백업 cron
        ├── ecosystem.config.js        # PM2 설정 파일
        └── update.sh                  # 업데이트 배포 스크립트
```

---

## 4. 스크립트 상세

### 01-base-setup.sh — OS + Node.js + PM2

```bash
#!/bin/bash
# ku_wave_plat 운영 서버 기본 설정
# Usage: sudo ./scripts/install/01-base-setup.sh
set -euo pipefail

echo "=== [1/5] 운영 서버 기본 설정 ==="

# --- 시스템 업데이트 ---
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git build-essential ufw fail2ban htop \
    pcscd libpcsclite-dev   # NFC 리더 (ACR122U) 지원

# --- 방화벽 ---
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (Nginx)
ufw allow 3306/tcp   # MariaDB 외부 접근
ufw --force enable
echo "✅ 방화벽: 22, 80, 3306 개방"

# --- fail2ban ---
systemctl enable fail2ban
systemctl start fail2ban

# --- Node.js 24 ---
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js $(node --version) 설치 완료"
else
    echo "✅ Node.js 이미 설치됨: $(node --version)"
fi

# --- pnpm ---
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@10
    echo "✅ pnpm $(pnpm --version) 설치 완료"
else
    echo "✅ pnpm 이미 설치됨: $(pnpm --version)"
fi

# --- PM2 ---
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 $(pm2 --version) 설치 완료"
else
    echo "✅ PM2 이미 설치됨: $(pm2 --version)"
fi

# --- PM2 시스템 부팅 시 자동 시작 ---
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
echo "✅ PM2 자동 시작 등록"

# --- 프로젝트 디렉토리 ---
mkdir -p /opt/ku_wave_plat
mkdir -p /opt/ku_wave_plat/logs
echo "✅ 프로젝트 디렉토리: /opt/ku_wave_plat"

# --- 스왑 (RAM < 4GB) ---
TOTAL_MEM=$(free -m | awk '/Mem:/{print $2}')
if [ "$TOTAL_MEM" -lt 4096 ] && [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ 2GB 스왑 생성"
fi

echo ""
echo "=== 기본 설정 완료 ==="
echo "다음: sudo ./scripts/install/02-mariadb-setup.sh"
```

---

### 02-mariadb-setup.sh — MariaDB + 외부 접근

```bash
#!/bin/bash
# MariaDB 설치 + 외부 접근 설정
# Usage: sudo ./scripts/install/02-mariadb-setup.sh
set -euo pipefail

echo "=== [2/5] MariaDB 설치 + 외부 접근 설정 ==="

# --- MariaDB 설치 ---
if ! command -v mariadb &> /dev/null; then
    apt-get install -y mariadb-server mariadb-client
    systemctl enable mariadb
    systemctl start mariadb
    echo "✅ MariaDB 설치 완료"
else
    echo "✅ MariaDB 이미 설치됨"
fi

# --- 외부 접근 허용 (bind-address 변경) ---
MARIADB_CONF="/etc/mysql/mariadb.conf.d/50-server.cnf"

if grep -q "^bind-address.*=.*127.0.0.1" "$MARIADB_CONF"; then
    sed -i 's/^bind-address.*=.*127.0.0.1/bind-address = 0.0.0.0/' "$MARIADB_CONF"
    echo "✅ bind-address → 0.0.0.0 (외부 접근 허용)"
elif grep -q "^#bind-address" "$MARIADB_CONF"; then
    sed -i 's/^#bind-address.*/bind-address = 0.0.0.0/' "$MARIADB_CONF"
    echo "✅ bind-address → 0.0.0.0 (주석 해제)"
else
    echo "bind-address = 0.0.0.0" >> "$MARIADB_CONF"
    echo "✅ bind-address → 0.0.0.0 (추가)"
fi

# --- 문자셋 + 성능 설정 ---
cat > /etc/mysql/mariadb.conf.d/99-ku-wave.cnf << 'DBCONF'
[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_connections = 200
innodb_buffer_pool_size = 512M

[client]
default-character-set = utf8mb4
DBCONF
echo "✅ utf8mb4 + 성능 설정 적용"

# --- MariaDB 재시작 ---
systemctl restart mariadb

# --- DB + 서비스 계정(sqlgw) 생성 ---
echo ""
echo "📋 DB 및 서비스 계정을 생성합니다..."
read -p "DB 비밀번호 입력 (sqlgw용): " -s DB_PASSWORD
echo ""
read -p "root 비밀번호 설정: " -s ROOT_PASSWORD
echo ""

mariadb -u root << SQLEOF
-- root 비밀번호 설정
ALTER USER 'root'@'localhost' IDENTIFIED BY '${ROOT_PASSWORD}';

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS ku_wave_plat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 서비스 접근 계정 (로컬)
CREATE USER IF NOT EXISTS 'sqlgw'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ku_wave_plat.* TO 'sqlgw'@'localhost';

-- 서비스 접근 계정 (외부)
CREATE USER IF NOT EXISTS 'sqlgw'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ku_wave_plat.* TO 'sqlgw'@'%';

FLUSH PRIVILEGES;
SQLEOF

echo ""
echo "✅ DB 생성 완료: ku_wave_plat / sqlgw (로컬+외부)"

# --- init_database.sql 실행 ---
INIT_SQL="/opt/ku_wave_plat/docs/init_database.sql"
if [ -f "$INIT_SQL" ]; then
    read -p "init_database.sql 스키마를 적용하시겠습니까? (y/N): " APPLY_SCHEMA
    if [ "$APPLY_SCHEMA" = "y" ] || [ "$APPLY_SCHEMA" = "Y" ]; then
        mariadb -u root -p"${ROOT_PASSWORD}" ku_wave_plat < "$INIT_SQL"
        TABLE_COUNT=$(mariadb -u root -p"${ROOT_PASSWORD}" ku_wave_plat \
            -sN -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='ku_wave_plat';")
        echo "✅ 스키마 적용 완료 (테이블 ${TABLE_COUNT}개)"
    fi
else
    echo "⚠️  $INIT_SQL 없음. 프로젝트 배포 후 수동 실행."
fi

echo ""
echo "=== MariaDB 설정 완료 ==="
echo ""
echo "📌 외부 접속 정보:"
echo "   Host: $(hostname -I | awk '{print $1}')"
echo "   Port: 3306"
echo "   User: sqlgw"
echo "   DB:   ku_wave_plat"
echo ""
echo "다음: ./scripts/install/03-app-build.sh"
```

---

### 03-app-build.sh — 앱 빌드 + PM2 실행

```bash
#!/bin/bash
# 앱 빌드 + PM2 실행
# Usage: ./scripts/install/03-app-build.sh
set -euo pipefail

echo "=== [3/5] 앱 빌드 + PM2 실행 ==="

PROJECT_DIR="/opt/ku_wave_plat"
cd "$PROJECT_DIR"

# --- .env 확인 ---
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# ==========================================
# ku_wave_plat 운영 환경변수
# ==========================================

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=sqlgw
DB_PASSWORD=CHANGE_ME
DB_DATABASE=ku_wave_plat

# JWT
JWT_SECRET=CHANGE_ME_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=CHANGE_ME_jwt_refresh_secret_minimum_32_chars
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# API
API_PORT=8000
API_PREFIX=api/v1

# Console
CONSOLE_PORT=3000
NEXT_PUBLIC_API_URL=http://SERVER_IP/api/v1

# CORS
ALLOWED_ORIGINS=http://SERVER_IP

# Environment
NODE_ENV=production

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
ENVEOF

    echo "⚠️  .env 파일이 생성되었습니다. 반드시 편집하세요:"
    echo "    nano $PROJECT_DIR/.env"
    echo ""
    echo "변경 필수: DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, SERVER_IP"
    exit 1
fi

# --- 의존성 설치 ---
echo "📦 의존성 설치..."
pnpm install --frozen-lockfile

# --- 공유 패키지 빌드 ---
echo "📦 공유 패키지 빌드..."
pnpm --filter @ku/types build 2>/dev/null || true
pnpm --filter @ku/contracts build 2>/dev/null || true

# --- API 빌드 ---
echo "🔨 API (NestJS) 빌드..."
pnpm --filter @ku/api build

# --- Console 빌드 ---
echo "🔨 Console (Next.js) 빌드..."
pnpm --filter @ku/console build

# --- uploads 디렉토리 ---
mkdir -p "$PROJECT_DIR/apps/api/uploads"

# --- PM2 ecosystem 설정 복사 ---
cp "$PROJECT_DIR/scripts/install/ecosystem.config.js" "$PROJECT_DIR/ecosystem.config.js"

# --- PM2 실행 ---
echo "🚀 PM2 시작..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# --- 상태 확인 ---
echo ""
pm2 status

# --- 헬스체크 ---
echo "⏳ API 시작 대기 (10초)..."
sleep 10

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health 2>/dev/null || echo "000")
CONSOLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

[ "$API_STATUS" = "200" ] && echo "✅ API OK" || echo "⚠️  API: $API_STATUS (pm2 logs ku-api)"
[ "$CONSOLE_STATUS" = "200" ] && echo "✅ Console OK" || echo "⚠️  Console: $CONSOLE_STATUS (pm2 logs ku-console)"

echo ""
echo "=== 앱 배포 완료 ==="
echo "다음: sudo ./scripts/install/04-nginx-setup.sh"
```

---

### ecosystem.config.js — PM2 설정

```javascript
// scripts/install/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ku-api',
      cwd: '/opt/ku_wave_plat/apps/api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/ku_wave_plat/logs/api-error.log',
      out_file: '/opt/ku_wave_plat/logs/api-out.log',
      merge_logs: true,
    },
    {
      name: 'ku-console',
      cwd: '/opt/ku_wave_plat/apps/console',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/ku_wave_plat/logs/console-error.log',
      out_file: '/opt/ku_wave_plat/logs/console-out.log',
      merge_logs: true,
    },
    {
      name: 'ku-nfc',
      cwd: '/opt/ku_wave_plat/apps/nfc',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/ku_wave_plat/logs/nfc-error.log',
      out_file: '/opt/ku_wave_plat/logs/nfc-out.log',
      merge_logs: true,
    },
  ],
};
```

---

### 04-nginx-setup.sh — Nginx 리버스 프록시

```bash
#!/bin/bash
# Nginx 리버스 프록시 (HTTP, 고정 IP)
# Usage: sudo ./scripts/install/04-nginx-setup.sh
set -euo pipefail

echo "=== [4/5] Nginx 리버스 프록시 설정 ==="

SERVER_IP=$(hostname -I | awk '{print $1}')

apt-get install -y nginx
systemctl enable nginx

cat > /etc/nginx/sites-available/ku-wave << NGINXEOF
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone \$binary_remote_addr zone=login_limit:10m rate=5r/m;

upstream ku_api {
    server 127.0.0.1:8000;
}

upstream ku_console {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name ${SERVER_IP} _;

    client_max_body_size 100M;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css image/svg+xml;
    gzip_min_length 1000;

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://ku_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # 로그인 (강화 Rate Limit)
    location /api/v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://ku_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Swagger
    location /api/v1/docs {
        proxy_pass http://ku_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 업로드 파일
    location /uploads/ {
        proxy_pass http://ku_api;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Console (Next.js)
    location / {
        proxy_pass http://ku_console;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/ku-wave /etc/nginx/sites-enabled/ku-wave
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ""
echo "=== Nginx 설정 완료 ==="
echo "   Console: http://${SERVER_IP}"
echo "   API:     http://${SERVER_IP}/api/v1/health"
echo "   Swagger: http://${SERVER_IP}/api/v1/docs"
echo ""
echo "다음: sudo ./scripts/install/05-backup-cron.sh"
```

---

### 05-backup-cron.sh — DB 백업

```bash
#!/bin/bash
# DB 백업 cron 설정
# Usage: sudo ./scripts/install/05-backup-cron.sh
set -euo pipefail

echo "=== [5/5] DB 백업 cron 설정 ==="

BACKUP_DIR="/opt/ku_wave_plat/backups"
mkdir -p "$BACKUP_DIR"

cat > /opt/ku_wave_plat/scripts/install/db-backup.sh << 'BACKUPEOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/opt/ku_wave_plat/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ku_wave_plat_$TIMESTAMP.sql.gz"

DB_USER=$(grep ^DB_USERNAME /opt/ku_wave_plat/.env | cut -d= -f2)
DB_PASS=$(grep ^DB_PASSWORD /opt/ku_wave_plat/.env | cut -d= -f2)
DB_NAME=$(grep ^DB_DATABASE /opt/ku_wave_plat/.env | cut -d= -f2)

mysqldump -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction --routines --triggers \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] 백업: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
BACKUPEOF

chmod +x /opt/ku_wave_plat/scripts/install/db-backup.sh

CRON_LINE="0 3 * * * /opt/ku_wave_plat/scripts/install/db-backup.sh >> /opt/ku_wave_plat/backups/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "db-backup.sh"; echo "$CRON_LINE") | crontab -

echo "✅ DB 백업 cron (매일 03:00, 7일 보관)"
echo "수동: /opt/ku_wave_plat/scripts/install/db-backup.sh"
```

---

### update.sh — 업데이트 배포

```bash
#!/bin/bash
# 코드 업데이트 후 재배포
# Usage: ./scripts/install/update.sh
set -euo pipefail

echo "=== ku_wave_plat 업데이트 ==="
cd /opt/ku_wave_plat

git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @ku/types build 2>/dev/null || true
pnpm --filter @ku/contracts build 2>/dev/null || true
pnpm --filter @ku/api build
pnpm --filter @ku/console build
pnpm --filter @ku/nfc build
pm2 reload ecosystem.config.js

pm2 status
echo "=== 업데이트 완료 ==="
```

---

## 5. 실행 순서

```
순서    명령어                                              소요
──────────────────────────────────────────────────────────────
 1     sudo ./scripts/install/01-base-setup.sh              ~5분
 2     sudo ./scripts/install/02-mariadb-setup.sh           ~5분
 3     nano .env  (DB 비밀번호, JWT, 서버 IP 수정)          ~5분
 4     ./scripts/install/03-app-build.sh                    ~10분
 5     sudo ./scripts/install/04-nginx-setup.sh             ~2분
 6     sudo ./scripts/install/05-backup-cron.sh             ~1분
──────────────────────────────────────────────────────────────
합계                                                       ~28분
```

---

## 6. 환경변수 (.env)

| 변수 | 필수 | 설명 |
|------|------|------|
| `DB_HOST` | Y | `127.0.0.1` |
| `DB_PORT` | Y | `3306` |
| `DB_USERNAME` | Y | `sqlgw` |
| `DB_PASSWORD` | Y | DB 비밀번호 |
| `DB_DATABASE` | Y | `ku_wave_plat` |
| `JWT_SECRET` | Y | 32자 이상 랜덤 |
| `JWT_REFRESH_SECRET` | Y | 32자 이상 랜덤 |
| `API_PORT` | Y | `8000` |
| `CONSOLE_PORT` | Y | `3000` |
| `NEXT_PUBLIC_API_URL` | Y | `http://서버IP/api/v1` |
| `ALLOWED_ORIGINS` | Y | `http://서버IP` |

---

## 7. 포트 구성

| 서비스 | 포트 | 외부 접근 | 비고 |
|--------|------|----------|------|
| Nginx | 80 | O | 진입점 (리버스 프록시) |
| API (NestJS) | 8000 | X (Nginx 경유) | PM2 관리 |
| Console (Next.js) | 3000 | X (Nginx 경유) | PM2 관리 |
| NFC Agent | - | X (내부 프로세스) | PM2 관리, USB 리더 연결 필요 |
| MariaDB | 3306 | O | DBeaver 등 외부 툴 |
| SSH | 22 | O | 서버 관리 |

---

## 8. PM2 명령어

```bash
pm2 status                  # 프로세스 상태
pm2 logs                    # 전체 로그
pm2 logs ku-api             # API 로그만
pm2 logs ku-console         # Console 로그만
pm2 logs ku-nfc             # NFC 로그만
pm2 restart all             # 전체 재시작
pm2 reload all              # 0초 다운타임 재시작
pm2 monit                   # 실시간 모니터링
pm2 save                    # 프로세스 목록 저장
pm2 install pm2-logrotate   # 로그 로테이션 모듈
```

---

## 9. 이후 업데이트

```bash
cd /opt/ku_wave_plat
./scripts/install/update.sh
```

---

## 10. 트러블슈팅

| 증상 | 확인 | 해결 |
|------|------|------|
| PM2 앱 안 뜸 | `pm2 logs ku-api` | .env 확인, DB 연결 확인 |
| DB 연결 실패 | `systemctl status mariadb` | MariaDB 재시작 |
| 외부 DB 접속 안 됨 | `ufw status` / `netstat -tlnp \| grep 3306` | bind=0.0.0.0, ufw 3306 확인 |
| Nginx 502 | `pm2 status` | 앱 죽었으면 `pm2 restart all` |
| 빌드 실패 | `pnpm --filter @ku/api build` 수동 | 에러 로그 확인 |
| 메모리 부족 | `free -h` / `pm2 monit` | 스왑 추가 |
| NFC 리더 미감지 | `lsusb \| grep 072f` | USB 연결 확인, pcscd 재시작 |
| NFC 태깅 안 됨 | `pm2 logs ku-nfc` | pcscd 실행 확인: `systemctl status pcscd` |
| NFC 리더 재연결 | 리더 뽑았다 꽂음 | `pm2 restart ku-nfc` |
