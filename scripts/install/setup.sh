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
        git config --global --add safe.directory /opt/ku_wave_plat
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
    # 이후 단계를 위해 경로 갱신 + 이동
    SCRIPT_DIR="$INSTALL_DIR/scripts/install"
    PROJECT_DIR="$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo "📂 작업 디렉토리: $(pwd)"
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
        # 기존 .env에서 고정 IP 추출
        INPUT_SERVER_IP=$(grep '^ALLOWED_ORIGINS=' "$PROJECT_DIR/.env" | sed 's|.*http://||;s|,.*||')
        echo "✅ .env 이미 존재. (서버 IP: ${INPUT_SERVER_IP})"
    fi

    # --- tb_device_preset comm_ip를 고정 IP로 업데이트 ---
    if [ -n "${INPUT_SERVER_IP:-}" ]; then
        mariadb -u root -p'!today25@' ku_wave_plat \
            -e "UPDATE tb_device_preset SET comm_ip='${INPUT_SERVER_IP}' WHERE comm_ip IS NOT NULL;
                UPDATE tb_ftp_config SET ftp_host='${INPUT_SERVER_IP}' WHERE ftp_isdel='N';" 2>/dev/null && \
            echo "✅ tb_device_preset comm_ip → ${INPUT_SERVER_IP} 업데이트 완료" && \
            echo "✅ tb_ftp_config ftp_host → ${INPUT_SERVER_IP} 업데이트 완료" || \
            echo "⚠️  DB 업데이트 실패 (DB 미설치 시 무시)"
    fi

    # --- 건물/호실 정보 입력 ---
    echo ""
    echo "📋 건물 및 호실 정보를 설정합니다."
    echo ""
    read -p "건물/호실 정보를 입력하시겠습니까? (y/N): " SETUP_BUILDING
    if [ "$SETUP_BUILDING" = "y" ] || [ "$SETUP_BUILDING" = "Y" ]; then
        MYSQL_CMD="mariadb -u root -p'!today25@' ku_wave_plat"

        # 기존 샘플 데이터 삭제
        $MYSQL_CMD -e "DELETE FROM tb_space; DELETE FROM tb_user_building; DELETE FROM tb_building;" 2>/dev/null

        echo ""
        read -p "건물명 (예: 산학협동관): " BLD_NAME
        read -p "건물 코드 (예: BLD-001): " BLD_CODE
        BLD_CODE="${BLD_CODE:-BLD-001}"
        read -p "건물 위치 (예: 서울시 광진구 능동로 120): " BLD_LOCATION
        read -p "건물 층수 (예: 5): " BLD_FLOORS
        BLD_FLOORS="${BLD_FLOORS:-5}"

        # 건물 INSERT
        $MYSQL_CMD -e "
            INSERT INTO tb_building (building_seq, building_name, building_code, building_location, building_floor_count, building_order)
            VALUES (1, '${BLD_NAME}', '${BLD_CODE}', '${BLD_LOCATION}', ${BLD_FLOORS}, 1);
        "
        echo "✅ 건물 등록: ${BLD_NAME} (${BLD_CODE})"

        # admin 건물 권한
        $MYSQL_CMD -e "
            INSERT INTO tb_user_building (tub_seq, tu_seq, building_seq) VALUES (1, 1, 1);
        "

        # 호실 입력 (반복)
        SPACE_SEQ=1
        echo ""
        echo "📋 호실 정보를 입력하세요. (빈 값 입력 시 종료)"
        while true; do
            echo ""
            read -p "호실명 (예: 220호, 빈칸=종료): " SPACE_NAME
            [ -z "$SPACE_NAME" ] && break

            read -p "호실 코드 (예: SPC-220): " SPACE_CODE
            SPACE_CODE="${SPACE_CODE:-SPC-${SPACE_SEQ}}"
            read -p "층 (예: 2): " SPACE_FLOOR
            read -p "공간 유형 (강의실/실험실/회의실, 기본: 강의실): " SPACE_TYPE
            SPACE_TYPE="${SPACE_TYPE:-강의실}"
            read -p "수용 인원 (기본: 40): " SPACE_CAP
            SPACE_CAP="${SPACE_CAP:-40}"

            $MYSQL_CMD -e "
                INSERT INTO tb_space (space_seq, building_seq, space_name, space_code, space_floor, space_type, space_capacity, space_order)
                VALUES (${SPACE_SEQ}, 1, '${SPACE_NAME}', '${SPACE_CODE}', '${SPACE_FLOOR}', '${SPACE_TYPE}', ${SPACE_CAP}, ${SPACE_SEQ});
            "
            echo "  ✅ 호실 등록: ${SPACE_NAME} (${SPACE_CODE})"

            # 녹화기 등록 (호실당 1대)
            read -p "  녹화기 IP (예: 192.168.1.50, 없으면 빈칸): " REC_IP
            if [ -n "$REC_IP" ]; then
                read -p "  녹화기 모델 (기본: BON BR-500): " REC_MODEL
                REC_MODEL="${REC_MODEL:-BON BR-500}"
                $MYSQL_CMD -e "
                    INSERT INTO tb_recorder (recorder_seq, space_seq, recorder_name, recorder_ip, recorder_port, recorder_protocol, recorder_model, recorder_status)
                    VALUES (${SPACE_SEQ}, ${SPACE_SEQ}, 'BON 녹화기', '${REC_IP}', 80, 'HTTP', '${REC_MODEL}', 'OFFLINE');
                "
                echo "  ✅ 녹화기 등록: ${REC_IP} → ${SPACE_NAME}"
            fi
            SPACE_SEQ=$((SPACE_SEQ + 1))
        done

        # --- FTP 설정 ---
        echo ""
        echo "📋 FTP 설정 (녹화 파일 전송용)"
        read -p "FTP 설정을 등록하시겠습니까? (y/N): " SETUP_FTP
        if [ "$SETUP_FTP" = "y" ] || [ "$SETUP_FTP" = "Y" ]; then
            FTP_HOST="${INPUT_SERVER_IP:-117.16.145.227}"
            read -p "  FTP 호스트 (기본: ${FTP_HOST}): " INPUT_FTP_HOST
            INPUT_FTP_HOST="${INPUT_FTP_HOST:-$FTP_HOST}"
            read -p "  FTP 포트 (기본: 21): " INPUT_FTP_PORT
            INPUT_FTP_PORT="${INPUT_FTP_PORT:-21}"
            read -p "  FTP 계정 (기본: kuwave): " INPUT_FTP_USER
            INPUT_FTP_USER="${INPUT_FTP_USER:-kuwave}"
            read -p "  FTP 비밀번호 (기본: kuwave): " INPUT_FTP_PASS
            INPUT_FTP_PASS="${INPUT_FTP_PASS:-kuwave}"
            read -p "  FTP 경로 (기본: /): " INPUT_FTP_PATH
            INPUT_FTP_PATH="${INPUT_FTP_PATH:-/}"

            $MYSQL_CMD -e "
                DELETE FROM tb_ftp_config;
                INSERT INTO tb_ftp_config (ftp_config_seq, recorder_seq, ftp_name, ftp_host, ftp_port, ftp_username, ftp_password, ftp_path, ftp_protocol, ftp_passive_mode, is_default)
                VALUES (1, NULL, '기본 FTP', '${INPUT_FTP_HOST}', ${INPUT_FTP_PORT}, '${INPUT_FTP_USER}', '${INPUT_FTP_PASS}', '${INPUT_FTP_PATH}', 'FTP', 'Y', 'Y');
            "
            echo "  ✅ FTP 설정 등록: ${INPUT_FTP_USER}@${INPUT_FTP_HOST}:${INPUT_FTP_PORT}"
        fi

        # 결과 표시
        echo ""
        echo "╔══════════════════════════════════════════════╗"
        echo "║  등록된 건물/호실/녹화기                       ║"
        echo "╚══════════════════════════════════════════════╝"
        $MYSQL_CMD -e "SELECT building_name AS '건물명', building_code AS '코드' FROM tb_building;"
        $MYSQL_CMD -e "SELECT s.space_seq AS 'SEQ', s.space_name AS '호실', s.space_code AS '코드', s.space_floor AS '층', IFNULL(r.recorder_ip, '-') AS '녹화기IP' FROM tb_space s LEFT JOIN tb_recorder r ON s.space_seq = r.space_seq ORDER BY s.space_seq;"
        $MYSQL_CMD -e "SELECT ftp_name AS 'FTP명', CONCAT(ftp_username,'@',ftp_host,':',ftp_port) AS '접속정보', ftp_path AS '경로' FROM tb_ftp_config WHERE ftp_isdel='N';" 2>/dev/null || true
    else
        echo "ℹ️  기본 샘플 데이터(본관, 101호, 102호) 유지"
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
