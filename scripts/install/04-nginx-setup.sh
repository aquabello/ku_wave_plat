#!/bin/bash
# Nginx 리버스 프록시 (HTTP, 고정 IP)
# Usage: sudo ./scripts/install/04-nginx-setup.sh
set -euo pipefail

# echo "=== [5/6] Nginx 설정 ==="

LOCAL_IP=$(hostname -I | awk '{print $1}')

# --- 공인 IP 입력 또는 .env에서 추출 ---
ENV_FILE="/opt/ku_wave_plat/.env"
if [ -f "$ENV_FILE" ]; then
    # .env의 NEXT_PUBLIC_API_URL에서 공인 IP 자동 추출
    PUBLIC_IP=$(grep '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" | sed 's|.*http://||;s|/.*||')
    echo "📋 .env에서 공인 IP 자동 적용: ${PUBLIC_IP}"
else
    read -p "공인 IP (ipTIME 외부 IP, 예: 117.16.139.145): " PUBLIC_IP
fi

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ 공인 IP를 입력해야 합니다."
    exit 1
fi

echo ""
echo "🌐 로컬 IP:  ${LOCAL_IP}"
echo "🌐 공인 IP:  ${PUBLIC_IP}"
echo ""

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
    server_name ${PUBLIC_IP} ${LOCAL_IP} _;

    client_max_body_size 100M;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css image/svg+xml;
    gzip_min_length 1000;

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Socket.IO (controller-socket, nfc 등)
    location /socket.io/ {
        proxy_pass http://ku_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # API (REST + WebSocket)
    location /api/ {
        limit_req zone=api_limit burst=50 nodelay;
        proxy_pass http://ku_api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        # WebSocket 지원 (소켓연동 등)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
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
echo "╔══════════════════════════════════════════════╗"
echo "║  Nginx 설정 완료                              ║"
echo "╠══════════════════════════════════════════════╣"
echo "║                                              ║"
echo "║  내부 접속: http://${LOCAL_IP}                ║"
echo "║  외부 접속: http://${PUBLIC_IP}               ║"
echo "║                                              ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Console : http://${PUBLIC_IP}                ║"
echo "║  API     : http://${PUBLIC_IP}/api/v1/health  ║"
echo "║  Swagger : http://${PUBLIC_IP}/api/v1/docs    ║"
echo "║  Uploads : http://${PUBLIC_IP}/uploads/       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "다음: sudo ./scripts/install/05-backup-cron.sh"
