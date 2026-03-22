#!/bin/bash
# ku_wave_plat 운영 서버 기본 설정
# Usage: sudo ./scripts/install/01-base-setup.sh
set -euo pipefail

# echo "=== [1/6] OS 기본 설정 ==="

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
