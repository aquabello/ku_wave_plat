#!/bin/bash
set -euo pipefail
BACKUP_DIR="/opt/ku_wave_plat/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ku_wave_plat_$TIMESTAMP.sql.gz"

DB_USER=$(grep ^DB_USERNAME /opt/ku_wave_plat/.env | cut -d= -f2)
DB_PASS=$(grep ^DB_PASSWORD /opt/ku_wave_plat/.env | cut -d= -f2)
DB_NAME=$(grep ^DB_DATABASE /opt/ku_wave_plat/.env | cut -d= -f2)

mysqldump -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction --routines --triggers \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] 백업: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
