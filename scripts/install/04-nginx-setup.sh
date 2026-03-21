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
