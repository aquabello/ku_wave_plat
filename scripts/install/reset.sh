#!/bin/bash
# install 스크립트로 설정한 항목 초기화 (재설치 전 실행)
# Usage: ./scripts/install/reset.sh
#
# 초기화 범위:
#   - PM2 프로세스 중지 + 삭제
#   - .env 삭제
#   - ecosystem.config.js 삭제
#   - node_modules / 빌드 산출물 삭제
#   - Nginx 설정 제거 (sudo 필요)
#   - uploads 디렉토리 (선택)
#   - DB 데이터 (선택)
#   - backup cron (선택)

set -euo pipefail

PROJECT_DIR="/opt/ku_wave_plat"

echo "============================================"
echo "  KU_WAVE_PLAT 초기화 스크립트"
echo "============================================"
echo ""
echo "⚠️  이 스크립트는 설치 상태를 초기화합니다."
echo ""
read -p "계속하시겠습니까? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "취소됨."
    exit 0
fi

echo ""

# =============================================
# 1. PM2 프로세스 중지 + 삭제
# =============================================
echo "🔹 [1/6] PM2 프로세스 정리..."
if command -v pm2 &> /dev/null; then
    pm2 delete all 2>/dev/null && echo "  ✅ PM2 프로세스 삭제" || echo "  ℹ️  실행 중인 PM2 프로세스 없음"
    pm2 save --force 2>/dev/null || true
    pm2 unstartup 2>/dev/null || true
else
    echo "  ℹ️  PM2 미설치"
fi

# =============================================
# 2. .env + ecosystem 삭제
# =============================================
echo "🔹 [2/6] 설정 파일 삭제..."
[ -f "$PROJECT_DIR/.env" ] && rm -f "$PROJECT_DIR/.env" && echo "  ✅ .env 삭제"
[ -f "$PROJECT_DIR/ecosystem.config.js" ] && rm -f "$PROJECT_DIR/ecosystem.config.js" && echo "  ✅ ecosystem.config.js 삭제"

# =============================================
# 3. 빌드 산출물 + node_modules 삭제
# =============================================
echo "🔹 [3/6] 빌드 산출물 + node_modules 삭제..."

# 빌드 산출물
rm -rf "$PROJECT_DIR/apps/api/dist" 2>/dev/null && echo "  ✅ apps/api/dist 삭제"
rm -rf "$PROJECT_DIR/apps/console/.next" 2>/dev/null && echo "  ✅ apps/console/.next 삭제"
rm -rf "$PROJECT_DIR/apps/nfc/dist" 2>/dev/null && echo "  ✅ apps/nfc/dist 삭제"
rm -rf "$PROJECT_DIR/packages/types/dist" 2>/dev/null && echo "  ✅ packages/types/dist 삭제"
rm -rf "$PROJECT_DIR/packages/contracts/dist" 2>/dev/null && echo "  ✅ packages/contracts/dist 삭제"

# node_modules
rm -rf "$PROJECT_DIR/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/apps/api/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/apps/console/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/apps/nfc/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/packages/types/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/packages/contracts/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/packages/ui/node_modules" 2>/dev/null
rm -rf "$PROJECT_DIR/packages/config/node_modules" 2>/dev/null
echo "  ✅ node_modules 전체 삭제"

# Turbo 캐시
rm -rf "$PROJECT_DIR/.turbo" 2>/dev/null && echo "  ✅ .turbo 캐시 삭제"

# 로그 파일
rm -rf "$PROJECT_DIR/logs" 2>/dev/null && echo "  ✅ logs 디렉토리 삭제"

# =============================================
# 4. Nginx 설정 제거 (sudo 필요)
# =============================================
echo "🔹 [4/6] Nginx 설정 제거..."
if [ -f "/etc/nginx/sites-enabled/ku-wave" ] || [ -f "/etc/nginx/sites-available/ku-wave" ]; then
    if [ "$(id -u)" -eq 0 ]; then
        rm -f /etc/nginx/sites-enabled/ku-wave
        rm -f /etc/nginx/sites-available/ku-wave
        # default 복원
        [ -f /etc/nginx/sites-available/default ] && \
            ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
        nginx -t 2>/dev/null && systemctl restart nginx
        echo "  ✅ Nginx ku-wave 설정 제거"
    else
        echo "  ⚠️  Nginx 설정 제거에 sudo 권한 필요. 수동 실행:"
        echo "     sudo rm -f /etc/nginx/sites-enabled/ku-wave /etc/nginx/sites-available/ku-wave"
        echo "     sudo systemctl restart nginx"
    fi
else
    echo "  ℹ️  Nginx ku-wave 설정 없음"
fi

# =============================================
# 5. uploads 디렉토리 (선택)
# =============================================
if [ -d "$PROJECT_DIR/apps/api/uploads" ]; then
    read -p "🔹 [5/6] uploads 디렉토리도 삭제하시겠습니까? (y/N): " DEL_UPLOADS
    if [ "$DEL_UPLOADS" = "y" ] || [ "$DEL_UPLOADS" = "Y" ]; then
        rm -rf "$PROJECT_DIR/apps/api/uploads"
        echo "  ✅ uploads 삭제"
    else
        echo "  ℹ️  uploads 유지"
    fi
else
    echo "🔹 [5/6] uploads 디렉토리 없음"
fi

# =============================================
# 6. DB 데이터 + backup cron (선택)
# =============================================
echo "🔹 [6/6] DB 및 백업 설정..."
read -p "  DB 데이터를 초기화(DROP)하시겠습니까? (y/N): " DEL_DB
if [ "$DEL_DB" = "y" ] || [ "$DEL_DB" = "Y" ]; then
    read -p "  MariaDB root 비밀번호: " -s ROOT_PW
    echo ""
    if mariadb -u root -p"${ROOT_PW}" -e "DROP DATABASE IF EXISTS ku_wave_plat;" 2>/dev/null; then
        echo "  ✅ ku_wave_plat DB 삭제"
    else
        echo "  ❌ DB 삭제 실패 (비밀번호 확인)"
    fi
else
    echo "  ℹ️  DB 유지"
fi

# backup cron 제거
if crontab -l 2>/dev/null | grep -q "db-backup.sh"; then
    read -p "  백업 cron 작업을 제거하시겠습니까? (y/N): " DEL_CRON
    if [ "$DEL_CRON" = "y" ] || [ "$DEL_CRON" = "Y" ]; then
        crontab -l 2>/dev/null | grep -v "db-backup.sh" | crontab -
        echo "  ✅ 백업 cron 제거"
    else
        echo "  ℹ️  백업 cron 유지"
    fi
fi

echo ""
echo "============================================"
echo "  초기화 완료!"
echo "============================================"
echo ""
echo "재설치 순서:"
echo "  1. sudo ./scripts/install/01-base-setup.sh"
echo "  2. sudo ./scripts/install/02-mariadb-setup.sh"
echo "  3. ./scripts/install/03-app-build.sh"
echo "  4. sudo ./scripts/install/04-nginx-setup.sh"
echo "  5. sudo ./scripts/install/05-backup-cron.sh"
echo ""
