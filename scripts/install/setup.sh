#!/bin/bash
# ============================================
# ku_wave_plat 운영 서버 셋업
# Usage:
#   sudo ./scripts/install/setup.sh        # 전체 실행
#   sudo ./scripts/install/setup.sh 1      # 1단계만
#   sudo ./scripts/install/setup.sh 3      # 3단계만
#   sudo ./scripts/install/setup.sh 4 6    # 4~6단계
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

REPO_URL="https://github.com/aquabello/ku_wave_plat.git"
INSTALL_DIR="/opt/ku_wave_plat"

show_menu() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║  ku_wave_plat 운영 서버 셋업          ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    echo "  [0] 소스 배포 (git clone)"
    echo "  [1] OS 기본 설정 (Node.js 24, PM2, pcscd, 방화벽)"
    echo "  [2] MariaDB 설치 + 외부 접근 + sqlgw 계정"
    echo "  [3] .env 설정 (인터랙티브)"
    echo "  [4] 앱 빌드 + PM2 시작"
    echo "  [5] Nginx 리버스 프록시"
    echo "  [6] DB 백업 cron"
    echo "  [a] 전체 실행 (0~6)"
    echo "  [q] 종료"
    echo ""
}

step0() {
    echo ""
    echo "========== [0/6] 소스 배포 =========="
    # git 설정
    if [ -z "$(git config --global user.email)" ]; then
        git config --global user.email "aquabello@today25.com"
        git config --global user.name "aquabello"
        echo "✅ git 사용자 설정 완료"
    fi
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo "✅ 이미 clone 되어 있음: $INSTALL_DIR"
        cd "$INSTALL_DIR"
        echo "📥 최신 소스 pull..."
        git pull origin main
    else
        echo "📥 git clone 중..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        echo "✅ clone 완료: $INSTALL_DIR"
    fi
}

step1() {
    echo ""
    echo "========== [1/6] OS 기본 설정 =========="
    "$SCRIPT_DIR/01-base-setup.sh"
}

step2() {
    echo ""
    echo "========== [2/6] MariaDB 설정 =========="
    "$SCRIPT_DIR/02-mariadb-setup.sh"
}

step3() {
    echo ""
    echo "========== [3/6] .env 설정 =========="
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        # 쓰기 권한 확보
        touch "$PROJECT_DIR/.env" 2>/dev/null || sudo touch "$PROJECT_DIR/.env"
        sudo chmod 666 "$PROJECT_DIR/.env"

        echo ""
        echo "📋 운영 환경변수를 설정합니다."
        echo ""
        read -p "서버 고정 IP (외부 접근용, 예: 117.16.145.227): " INPUT_SERVER_IP

        # 고정값
        INPUT_DB_PASSWORD='!sqlgw@'
        INPUT_JWT_SECRET='ku-wave-plat-jwt-secret-2026-x7k9m2p4'
        INPUT_JWT_REFRESH_SECRET='ku-wave-plat-refresh-secret-2026-q3w8n5v1'
        echo "✅ DB/JWT 설정 자동 적용"

        cat > "$PROJECT_DIR/.env" << ENVEOF
# ==========================================
# ku_wave_plat 운영 환경변수
# ==========================================

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=sqlgw
DB_PASSWORD=${INPUT_DB_PASSWORD}
DB_DATABASE=ku_wave_plat

# JWT
JWT_SECRET=${INPUT_JWT_SECRET}
JWT_REFRESH_SECRET=${INPUT_JWT_REFRESH_SECRET}
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# API
API_PORT=8000
API_PREFIX=api/v1

# Console
CONSOLE_PORT=3000
NEXT_PUBLIC_API_URL=http://${INPUT_SERVER_IP}/api/v1

# CORS
ALLOWED_ORIGINS=http://${INPUT_SERVER_IP},http://localhost:3000

# Environment
NODE_ENV=production

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
ENVEOF

        echo ""
        echo "✅ .env 생성 완료 (서버 IP: ${INPUT_SERVER_IP})"
    else
        echo "✅ .env 이미 존재. 수정: vim $PROJECT_DIR/.env"
    fi
}

step4() {
    echo ""
    echo "========== [4/6] 앱 빌드 + PM2 =========="
    "$SCRIPT_DIR/03-app-build.sh"
}

step5() {
    echo ""
    echo "========== [5/6] Nginx 설정 =========="
    "$SCRIPT_DIR/04-nginx-setup.sh"
}

step6() {
    echo ""
    echo "========== [6/6] DB 백업 cron =========="
    "$SCRIPT_DIR/05-backup-cron.sh"
}

run_step() {
    case "$1" in
        0) step0 ;;
        1) step1 ;;
        2) step2 ;;
        3) step3 ;;
        4) step4 ;;
        5) step5 ;;
        6) step6 ;;
        *) echo "❌ 알 수 없는 단계: $1" ;;
    esac
}

show_complete() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║  ✅ 셋업 완료!                        ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "   Console: http://${SERVER_IP}"
    echo "   API:     http://${SERVER_IP}/api/v1/health"
    echo "   Swagger: http://${SERVER_IP}/api/v1/docs"
    echo ""
}

# --- 인자가 있으면 해당 단계만 실행 ---
if [ $# -gt 0 ]; then
    for step in "$@"; do
        run_step "$step"
    done
    exit 0
fi

# --- 인자 없으면 인터랙티브 메뉴 ---
while true; do
    show_menu
    read -p "실행할 단계를 선택하세요: " CHOICE

    case "$CHOICE" in
        0|1|2|3|4|5|6)
            run_step "$CHOICE"
            echo ""
            read -p "계속하시겠습니까? (Enter=메뉴, q=종료): " CONT
            [ "$CONT" = "q" ] && break
            ;;
        a|A)
            for i in 0 1 2 3 4 5 6; do
                run_step "$i"
            done
            show_complete
            break
            ;;
        q|Q)
            echo "종료."
            break
            ;;
        *)
            echo "❌ 잘못된 입력: $CHOICE"
            ;;
    esac
done
