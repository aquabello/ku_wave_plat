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
