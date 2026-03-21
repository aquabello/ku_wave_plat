#!/bin/bash
# 코드 업데이트 후 재배포
# Usage: ./scripts/install/update.sh
set -euo pipefail

echo "=== ku_wave_plat 업데이트 ==="
cd /opt/ku_wave_plat

git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @ku/types build 2>/dev/null || true
pnpm --filter @ku/contracts build 2>/dev/null || true
pnpm --filter @ku/api build
pnpm --filter @ku/console build
pnpm --filter @ku/nfc build
pm2 reload ecosystem.config.js

pm2 status
echo "=== 업데이트 완료 ==="
