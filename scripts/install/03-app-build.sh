#!/bin/bash
# 앱 빌드 + PM2 실행
# Usage: ./scripts/install/03-app-build.sh
set -euo pipefail
export CI=true

# echo "=== [4/6] 앱 빌드 + PM2 ==="

PROJECT_DIR="/opt/ku_wave_plat"
cd "$PROJECT_DIR"

# --- .env 생성 (없을 때만) ---
if [ ! -f ".env" ]; then
    echo ""
    echo "📋 환경 설정을 시작합니다."
    echo ""

    # --- 네트워크 정보 수집 ---
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "🌐 감지된 로컬 IP: ${LOCAL_IP}"
    echo ""

    read -p "공인 IP (ipTIME 외부 IP, 예: 117.16.139.145): " PUBLIC_IP
    if [ -z "$PUBLIC_IP" ]; then
        echo "❌ 공인 IP를 입력해야 합니다."
        exit 1
    fi

    # --- DB 정보 수집 ---
    read -p "DB 비밀번호 (sqlgw): " -s DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ DB 비밀번호를 입력해야 합니다."
        exit 1
    fi

    # --- JWT Secret 자동 생성 ---
    JWT_SECRET=$(openssl rand -base64 48)
    JWT_REFRESH_SECRET=$(openssl rand -base64 48)

    # --- .env 생성 ---
    cat > .env << ENVEOF
# ==========================================
# ku_wave_plat 운영 환경변수
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# ==========================================

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=sqlgw
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=ku_wave_plat

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# API
API_PORT=8000
API_PREFIX=api/v1

# Console
CONSOLE_PORT=3000
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}/api/v1

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://${PUBLIC_IP},http://${LOCAL_IP}

# Environment
NODE_ENV=production

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# AI PC (ku_ai_pc 강의실 클라이언트, 1:1 고정 IP)
AI_PC_URL=http://192.168.1.19:9100
WAVE_PLAT_SELF_URL=http://192.168.1.18/api/v1
ENVEOF

    echo ""
    echo "✅ .env 생성 완료"
    echo "   공인 IP:  ${PUBLIC_IP}"
    echo "   로컬 IP:  ${LOCAL_IP}"
    echo "   DB User:  sqlgw"
    echo "   JWT:      자동 생성됨"
    echo ""
fi

# --- node-gyp 권한 수정 (pcsclite/bcrypt 네이티브 빌드용) ---
find /root/.local/share/pnpm -name "gyp_main.py" -exec chmod +x {} \; 2>/dev/null || true

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

# --- Console 빌드 (NEXT_PUBLIC_API_URL 검증) ---
CURRENT_API_URL=$(grep '^NEXT_PUBLIC_API_URL=' "$PROJECT_DIR/.env" | cut -d= -f2-)
if echo "$CURRENT_API_URL" | grep -q "localhost"; then
    # .env에서 공인 IP 추출 (ALLOWED_ORIGINS에서)
    PUBLIC_IP=$(grep '^ALLOWED_ORIGINS=' "$PROJECT_DIR/.env" | sed 's|.*http://||;s|,.*||')
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "localhost" ]; then
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}/api/v1|" "$PROJECT_DIR/.env"
        echo "⚠️  NEXT_PUBLIC_API_URL이 localhost → http://${PUBLIC_IP}/api/v1 로 자동 수정됨"
    else
        echo "⚠️  NEXT_PUBLIC_API_URL이 localhost입니다. 외부 접근이 안 될 수 있습니다."
    fi
fi
# .env를 apps/console/에 복사 (Next.js는 빌드 시 자체 디렉토리의 .env를 읽음)
cp "$PROJECT_DIR/.env" "$PROJECT_DIR/apps/console/.env"
echo "📋 .env → apps/console/.env 복사 완료"

echo "🔨 Console (Next.js) 빌드... (API_URL: $(grep '^NEXT_PUBLIC_API_URL=' "$PROJECT_DIR/.env" | cut -d= -f2-))"
rm -rf "$PROJECT_DIR/apps/console/.next"
pnpm --filter @ku/console build

# --- NFC Agent 빌드 ---
echo "🔨 NFC Agent 빌드..."
pnpm --filter @ku/nfc build

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

# API는 JWT 인증이 글로벌이므로 401도 정상
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    echo "✅ API OK (${API_STATUS})"
else
    echo "⚠️  API: $API_STATUS (pm2 logs ku-api)"
fi

# Console은 로그인 리다이렉트(307)도 정상
if [ "$CONSOLE_STATUS" = "200" ] || [ "$CONSOLE_STATUS" = "307" ]; then
    echo "✅ Console OK (${CONSOLE_STATUS})"
else
    echo "⚠️  Console: $CONSOLE_STATUS (pm2 logs ku-console)"
fi

echo ""
echo "=== 앱 배포 완료 ==="
echo "다음: sudo ./scripts/install/04-nginx-setup.sh"
