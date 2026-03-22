#!/bin/bash
# MariaDB 설치 + 외부 접근 설정
# Usage: sudo ./scripts/install/02-mariadb-setup.sh
set -euo pipefail

echo "=== [2/6] MariaDB 설정 ==="

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
DB_PASSWORD='!sqlgw@'
ROOT_PASSWORD='!today25@'

# root 비밀번호 유무 자동 감지
MYSQL_CMD="mariadb -u root"
if ! $MYSQL_CMD -e "SELECT 1" &>/dev/null; then
    # 비밀번호가 이미 설정된 경우
    MYSQL_CMD="mariadb -u root -p${ROOT_PASSWORD}"
    if ! $MYSQL_CMD -e "SELECT 1" &>/dev/null; then
        echo "❌ MariaDB root 접속 실패. 비밀번호를 확인하세요."
        exit 1
    fi
    echo "✅ MariaDB root 접속 (비밀번호 사용)"
else
    echo "✅ MariaDB root 접속 (비밀번호 없음 → 설정 예정)"
fi

$MYSQL_CMD << SQLEOF
-- root 비밀번호 설정 + 외부 접근 허용
ALTER USER 'root'@'localhost' IDENTIFIED BY '${ROOT_PASSWORD}';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '${ROOT_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

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
    echo "📄 init_database.sql 스키마 적용 중..."
    mariadb -u root -p"${ROOT_PASSWORD}" ku_wave_plat < "$INIT_SQL"
    TABLE_COUNT=$(mariadb -u root -p"${ROOT_PASSWORD}" ku_wave_plat \
        -sN -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='ku_wave_plat';")
    echo "✅ 스키마 적용 완료 (테이블 ${TABLE_COUNT}개)"
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
