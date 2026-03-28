#!/bin/bash
# ============================================
# ku_wave_plat 운영 서버 셋업
# Usage:
#   sudo bash setup.sh          # 인터랙티브 메뉴
#   sudo bash setup.sh 1        # 1단계만
#   sudo bash setup.sh a        # 전체 실행 (0~6)
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

REPO_URL="https://github.com/aquabello/ku_wave_plat.git"
INSTALL_DIR="/opt/ku_wave_plat"

# 전역 변수 (step 간 공유)
INPUT_SERVER_IP=""

show_menu() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║  ku_wave_plat 운영 서버 셋업          ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    echo "  [0] 소스 배포 (git clone)"
    echo "  [1] OS 기본 설정 (Node.js 24, PM2, pcscd, 방화벽)"
    echo "  [2] 환경 설정 (고정IP, .env, 건물/호실/녹화기/FTP)"
    echo "  [3] MariaDB 설치 + 스키마 + 데이터 반영"
    echo "  [4] 앱 빌드 + PM2 시작"
    echo "  [5] Nginx 리버스 프록시"
    echo "  [6] DB 백업 cron"
    echo "  [a] 전체 실행 (0~6)"
    echo "  [q] 종료"
    echo ""
}

# ============================================
# [0] 소스 배포
# ============================================
step0() {
    echo ""
    echo "========== [0/6] 소스 배포 =========="
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
    SCRIPT_DIR="$INSTALL_DIR/scripts/install"
    PROJECT_DIR="$INSTALL_DIR"
    cd "$INSTALL_DIR"
    echo "📂 작업 디렉토리: $(pwd)"
}

# ============================================
# [1] OS 기본 설정
# ============================================
step1() {
    echo ""
    echo "========== [1/6] OS 기본 설정 =========="
    "$SCRIPT_DIR/01-base-setup.sh"
}

# ============================================
# [2] 환경 설정 (고정IP + .env + 건물/호실/녹화기/FTP)
# ============================================
step2() {
    echo ""
    echo "========== [2/6] 환경 설정 =========="

    # --- 고정 IP 입력 ---
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        touch "$PROJECT_DIR/.env" 2>/dev/null || sudo touch "$PROJECT_DIR/.env"
        sudo chmod 666 "$PROJECT_DIR/.env"

        echo ""
        echo "📋 운영 환경변수를 설정합니다."
        echo ""
        read -p "서버 고정 IP (외부 접근용, 예: 117.16.145.227): " INPUT_SERVER_IP

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

        echo "✅ .env 생성 완료 (서버 IP: ${INPUT_SERVER_IP})"
    else
        INPUT_SERVER_IP=$(grep '^NEXT_PUBLIC_API_URL=' "$PROJECT_DIR/.env" | sed 's|.*http://||;s|/.*||')
        if [ "$INPUT_SERVER_IP" = "localhost" ] || [ "$INPUT_SERVER_IP" = "localhost:8000" ]; then
            echo "⚠️  .env의 API URL이 localhost입니다."
            read -p "서버 고정 IP (예: 117.16.145.227): " INPUT_SERVER_IP
            sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://${INPUT_SERVER_IP}/api/v1|" "$PROJECT_DIR/.env"
            sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://${INPUT_SERVER_IP},http://localhost:3000|" "$PROJECT_DIR/.env"
            echo "✅ .env 업데이트 (서버 IP: ${INPUT_SERVER_IP})"
        else
            echo "✅ .env 이미 존재 (서버 IP: ${INPUT_SERVER_IP})"
        fi
    fi

    # --- 건물/호실/녹화기/FTP 정보 수집 (파일로 저장, step3에서 DB 반영) ---
    SETUP_DATA="$PROJECT_DIR/.setup-data.sh"

    echo ""
    echo "📋 건물 및 호실 정보를 설정합니다."
    read -p "건물/호실 정보를 입력하시겠습니까? (y/N): " SETUP_BUILDING

    if [ "$SETUP_BUILDING" = "y" ] || [ "$SETUP_BUILDING" = "Y" ]; then
        echo "#!/bin/bash" > "$SETUP_DATA"
        echo "# 자동 생성 — setup.sh step2에서 입력받은 데이터" >> "$SETUP_DATA"
        echo "INPUT_SERVER_IP='${INPUT_SERVER_IP}'" >> "$SETUP_DATA"

        echo ""
        read -p "건물명 (예: 산학협동관): " BLD_NAME
        read -p "건물 코드 (기본: BLD-001): " BLD_CODE
        BLD_CODE="${BLD_CODE:-BLD-001}"
        read -p "건물 위치 (기본: 서울시 광진구 능동로 120): " BLD_LOCATION
        BLD_LOCATION="${BLD_LOCATION:-서울시 광진구 능동로 120}"
        read -p "건물 층수 (기본: 5): " BLD_FLOORS
        BLD_FLOORS="${BLD_FLOORS:-5}"

        echo "BLD_NAME='${BLD_NAME}'" >> "$SETUP_DATA"
        echo "BLD_CODE='${BLD_CODE}'" >> "$SETUP_DATA"
        echo "BLD_LOCATION='${BLD_LOCATION}'" >> "$SETUP_DATA"
        echo "BLD_FLOORS=${BLD_FLOORS}" >> "$SETUP_DATA"

        echo "✅ 건물: ${BLD_NAME} (${BLD_CODE})"

        # 호실 + 녹화기 입력 (1개)
        SPACE_SEQ=1
        echo "" >> "$SETUP_DATA"
        echo "SPACES=(" >> "$SETUP_DATA"

        echo ""
        echo "📋 호실 정보를 입력하세요."
        echo ""
        read -p "호실명 (예: 220호): " SPACE_NAME
        if [ -n "$SPACE_NAME" ]; then
            read -p "호실 코드 (기본: SPC-001): " SPACE_CODE
            SPACE_CODE="${SPACE_CODE:-SPC-001}"
            read -p "층 (기본: 1): " SPACE_FLOOR
            SPACE_FLOOR="${SPACE_FLOOR:-1}"
            read -p "공간 유형 (기본: 강의실): " SPACE_TYPE
            SPACE_TYPE="${SPACE_TYPE:-강의실}"
            read -p "수용 인원 (기본: 40): " SPACE_CAP
            SPACE_CAP="${SPACE_CAP:-40}"

            REC_IP=""
            REC_PORT="6060"
            REC_MODEL="BON BR-500"
            read -p "녹화기 IP (기본: ${INPUT_SERVER_IP}): " INPUT_REC_IP
            REC_IP="${INPUT_REC_IP:-$INPUT_SERVER_IP}"
            read -p "녹화기 포트 (기본: 6060): " INPUT_REC_PORT
            REC_PORT="${INPUT_REC_PORT:-6060}"
            read -p "녹화기 모델 (기본: BON BR-500): " INPUT_REC_MODEL
            REC_MODEL="${INPUT_REC_MODEL:-BON BR-500}"

            echo "  '${SPACE_SEQ}|${SPACE_NAME}|${SPACE_CODE}|${SPACE_FLOOR}|${SPACE_TYPE}|${SPACE_CAP}|${REC_IP}|${REC_PORT}|${REC_MODEL}'" >> "$SETUP_DATA"
            echo "  ✅ ${SPACE_NAME} (${SPACE_CODE}) 녹화기: ${REC_IP}:${REC_PORT}"

            # 장비 등록 (전자칠판/프로젝터/스크린)
            echo ""
            echo "  📋 ${SPACE_NAME} 연동 장비 선택"
            DEVICES=""
            read -p "  전자칠판 연동? (Y/n): " DEV_BOARD
            if [ "$DEV_BOARD" != "n" ] && [ "$DEV_BOARD" != "N" ]; then
                DEVICES="${DEVICES}BOARD,"
                echo "    ✅ 전자칠판"
            fi
            read -p "  프로젝터 연동? (Y/n): " DEV_PROJ
            if [ "$DEV_PROJ" != "n" ] && [ "$DEV_PROJ" != "N" ]; then
                DEVICES="${DEVICES}PROJECTOR,"
                echo "    ✅ 프로젝터"
            fi
            read -p "  스크린 연동? (Y/n): " DEV_SCREEN
            if [ "$DEV_SCREEN" != "n" ] && [ "$DEV_SCREEN" != "N" ]; then
                DEVICES="${DEVICES}SCREEN,"
                echo "    ✅ 스크린"
            fi
            DEVICES="${DEVICES%,}"
        fi
        echo ")" >> "$SETUP_DATA"
        # 장비 데이터는 SPACES 밖에 별도 저장
        if [ -n "${DEVICES:-}" ]; then
            echo "DEVICES_1='${DEVICES}'" >> "$SETUP_DATA"
        fi

        # FTP 설정
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

            echo "" >> "$SETUP_DATA"
            echo "FTP_HOST='${INPUT_FTP_HOST}'" >> "$SETUP_DATA"
            echo "FTP_PORT=${INPUT_FTP_PORT}" >> "$SETUP_DATA"
            echo "FTP_USER='${INPUT_FTP_USER}'" >> "$SETUP_DATA"
            echo "FTP_PASS='${INPUT_FTP_PASS}'" >> "$SETUP_DATA"
            echo "FTP_PATH='${INPUT_FTP_PATH}'" >> "$SETUP_DATA"
            echo "  ✅ FTP: ${INPUT_FTP_USER}@${INPUT_FTP_HOST}:${INPUT_FTP_PORT}"
        fi

        echo ""
        echo "✅ 환경 설정 데이터 저장 완료 → step3(MariaDB)에서 DB에 반영됩니다."
    else
        echo "ℹ️  init_database.sql 기본 데이터 사용 (산학협동관, 201/211/216/220호)"
        # 고정 IP만 저장
        echo "#!/bin/bash" > "$SETUP_DATA"
        echo "INPUT_SERVER_IP='${INPUT_SERVER_IP}'" >> "$SETUP_DATA"
    fi
}

# ============================================
# [3] MariaDB 설치 + 스키마 + 입력 데이터 반영
# ============================================
step3() {
    echo ""
    echo "========== [3/6] MariaDB + 스키마 + 데이터 =========="
    "$SCRIPT_DIR/02-mariadb-setup.sh"

    SETUP_DATA="$PROJECT_DIR/.setup-data.sh"
    if [ ! -f "$SETUP_DATA" ]; then
        echo "ℹ️  환경 설정 데이터 없음 (step2 미실행). 기본 데이터 유지."
        return
    fi

    # DB 쿼리 헬퍼 함수
    run_sql() {
        mariadb -u root -p"!today25@" ku_wave_plat -e "$1" 2>/dev/null
    }

    source "$SETUP_DATA"

    echo ""
    echo "📋 입력 데이터를 DB에 반영합니다..."

    # --- 고정 IP 반영 ---
    if [ -n "${INPUT_SERVER_IP:-}" ]; then
        run_sql "UPDATE tb_device_preset SET comm_ip='${INPUT_SERVER_IP}' WHERE comm_ip IS NOT NULL;" || true
        run_sql "UPDATE tb_ftp_config SET ftp_host='${INPUT_SERVER_IP}' WHERE ftp_isdel='N';" || true
        echo "✅ comm_ip/ftp_host → ${INPUT_SERVER_IP}"
    fi

    # --- 건물/호실/녹화기 반영 ---
    if [ -n "${BLD_NAME:-}" ]; then
        run_sql "DELETE FROM tb_recorder; DELETE FROM tb_space; DELETE FROM tb_user_building; DELETE FROM tb_building;" || true

        run_sql "
            INSERT INTO tb_building (building_seq, building_name, building_code, building_location, building_floor_count, building_order)
            VALUES (1, '${BLD_NAME}', '${BLD_CODE}', '${BLD_LOCATION}', ${BLD_FLOORS}, 1);
        " || true
        run_sql "INSERT INTO tb_user_building (tub_seq, tu_seq, building_seq) VALUES (1, 1, 1);" || true
        echo "✅ 건물: ${BLD_NAME} (${BLD_CODE})"

        if [ -n "${SPACES+x}" ] && [ ${#SPACES[@]} -gt 0 ]; then
            for entry in "${SPACES[@]}"; do
                IFS='|' read -r SEQ NAME CODE FLOOR TYPE CAP REC_IP REC_PORT REC_MODEL <<< "$entry"
                run_sql "
                    INSERT INTO tb_space (space_seq, building_seq, space_name, space_code, space_floor, space_type, space_capacity, space_order)
                    VALUES (${SEQ}, 1, '${NAME}', '${CODE}', '${FLOOR}', '${TYPE}', ${CAP}, ${SEQ});
                " || true
                echo "  ✅ ${NAME} (${CODE})"

                if [ -n "$REC_IP" ]; then
                    run_sql "
                        INSERT INTO tb_recorder (recorder_seq, space_seq, recorder_name, recorder_ip, recorder_port, recorder_protocol, recorder_model, recorder_status)
                        VALUES (${SEQ}, ${SEQ}, 'BON 녹화기', '${REC_IP}', ${REC_PORT}, 'HTTP', '${REC_MODEL}', 'OFFLINE');
                    " || true
                    echo "     녹화기: ${REC_IP}:${REC_PORT}"
                fi

                # 장비 연동 (tb_space_device)
                # 프리셋: 1=프로젝터, 2=전자칠판, 3=녹화기, 4=스크린
                DEVVAR="DEVICES_${SEQ}"
                DEVLIST="${!DEVVAR:-}"
                if [ -n "$DEVLIST" ]; then
                    run_sql "DELETE FROM tb_space_device WHERE space_seq=${SEQ};" || true
                    DEV_ORDER=1
                    if echo "$DEVLIST" | grep -q "BOARD"; then
                        run_sql "
                            INSERT INTO tb_space_device (space_seq, preset_seq, device_name, device_ip, device_port, device_order)
                            VALUES (${SEQ}, 2, '${NAME} 전자칠판', '${INPUT_SERVER_IP}', 9090, ${DEV_ORDER});
                        " || true
                        echo "     장비: 전자칠판 (${INPUT_SERVER_IP}:9090)"
                        DEV_ORDER=$((DEV_ORDER + 1))
                    fi
                    if echo "$DEVLIST" | grep -q "PROJECTOR"; then
                        run_sql "
                            INSERT INTO tb_space_device (space_seq, preset_seq, device_name, device_ip, device_port, device_order)
                            VALUES (${SEQ}, 1, '${NAME} 프로젝터', '${INPUT_SERVER_IP}', 9090, ${DEV_ORDER});
                        " || true
                        echo "     장비: 프로젝터 (${INPUT_SERVER_IP}:9090)"
                        DEV_ORDER=$((DEV_ORDER + 1))
                    fi
                    if echo "$DEVLIST" | grep -q "SCREEN"; then
                        run_sql "
                            INSERT INTO tb_space_device (space_seq, preset_seq, device_name, device_ip, device_port, device_order)
                            VALUES (${SEQ}, 4, '${NAME} 스크린', '${INPUT_SERVER_IP}', 9090, ${DEV_ORDER});
                        " || true
                        echo "     장비: 스크린 (${INPUT_SERVER_IP}:9090)"
                    fi
                fi
            done
        fi
    fi

    # --- FTP 반영 ---
    if [ -n "${FTP_HOST:-}" ]; then
        run_sql "DELETE FROM tb_ftp_config;" || true
        run_sql "
            INSERT INTO tb_ftp_config (ftp_config_seq, recorder_seq, ftp_name, ftp_host, ftp_port, ftp_username, ftp_password, ftp_path, ftp_protocol, ftp_passive_mode, is_default)
            VALUES (1, NULL, '기본 FTP', '${FTP_HOST}', ${FTP_PORT}, '${FTP_USER}', '${FTP_PASS}', '${FTP_PATH}', 'FTP', 'Y', 'Y');
        " || true
        echo "✅ FTP: ${FTP_USER}@${FTP_HOST}:${FTP_PORT}"
    fi

    # --- NFC 리더기 등록 + config.json ---
    NFC_API_KEY="rdr_3db60088-be2b-484d-8972-56ac3bbf4aca"
    NFC_READER_NAME="${BLD_NAME:-산학협동관}-${SPACE_NAME:-220호}-ACR122U"

    run_sql "DELETE FROM tb_nfc_reader;" || true
    run_sql "
        INSERT INTO tb_nfc_reader (reader_seq, space_seq, reader_name, reader_code, reader_api_key, reader_status)
        VALUES (1, 1, '${NFC_READER_NAME}', 'RDR-001', '${NFC_API_KEY}', 'ACTIVE');
    " || true
    echo "✅ NFC 리더기: ${NFC_READER_NAME} (API Key: ${NFC_API_KEY})"

    # NFC config.json 생성
    NFC_CONFIG_DIR="$PROJECT_DIR/apps/nfc"
    if [ -f "$NFC_CONFIG_DIR/config.example.json" ]; then
        NFC_API_URL="http://${INPUT_SERVER_IP}/api/v1"
        sed "s|rdr_YOUR_API_KEY_HERE|${NFC_API_KEY}|;s|http://localhost:8000/api/v1|${NFC_API_URL}|" \
            "$NFC_CONFIG_DIR/config.example.json" > "$NFC_CONFIG_DIR/config.json"
        echo "✅ NFC config.json 생성 (API: ${NFC_API_URL})"
    fi

    # 결과 표시
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║  DB 데이터 현황                               ║"
    echo "╚══════════════════════════════════════════════╝"
    run_sql "SELECT building_name AS '건물명', building_code AS '코드' FROM tb_building;" || true
    run_sql "SELECT s.space_seq AS 'SEQ', s.space_name AS '호실', s.space_code AS '코드', s.space_floor AS '층', IFNULL(r.recorder_ip, '-') AS '녹화기IP' FROM tb_space s LEFT JOIN tb_recorder r ON s.space_seq = r.space_seq ORDER BY s.space_seq;" || true
    run_sql "SELECT ftp_name AS 'FTP', CONCAT(ftp_username,'@',ftp_host,':',ftp_port) AS '접속정보' FROM tb_ftp_config WHERE ftp_isdel='N';" || true
    run_sql "SELECT reader_name AS 'NFC리더기', reader_api_key AS 'API Key' FROM tb_nfc_reader WHERE reader_isdel='N';" || true

    # 임시 파일 정리
    rm -f "$SETUP_DATA"
}

# ============================================
# [4] 앱 빌드 + PM2
# ============================================
step4() {
    echo ""
    echo "========== [4/6] 앱 빌드 + PM2 =========="
    "$SCRIPT_DIR/03-app-build.sh"
}

# ============================================
# [5] Nginx
# ============================================
step5() {
    echo ""
    echo "========== [5/6] Nginx 설정 =========="
    "$SCRIPT_DIR/04-nginx-setup.sh"
}

# ============================================
# [6] DB 백업 cron
# ============================================
step6() {
    echo ""
    echo "========== [6/6] DB 백업 cron =========="
    "$SCRIPT_DIR/05-backup-cron.sh"
}

# ============================================
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
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    PUBLIC_IP=$(grep '^NEXT_PUBLIC_API_URL=' "$PROJECT_DIR/.env" 2>/dev/null | sed 's|.*http://||;s|/.*||')
    echo "   내부: http://${LOCAL_IP}"
    echo "   외부: http://${PUBLIC_IP:-$LOCAL_IP}"
    echo "   API:  http://${PUBLIC_IP:-$LOCAL_IP}/api/v1/health"
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
