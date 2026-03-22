#!/bin/bash
# DB 백업 cron 설정
# Usage: sudo ./scripts/install/05-backup-cron.sh
set -euo pipefail

# echo "=== [6/6] DB 백업 cron ==="

BACKUP_DIR="/opt/ku_wave_plat/backups"
mkdir -p "$BACKUP_DIR"

cat > /opt/ku_wave_plat/scripts/install/db-backup.sh << 'BACKUPEOF'
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
BACKUPEOF

chmod +x /opt/ku_wave_plat/scripts/install/db-backup.sh

CRON_LINE="0 3 * * * /opt/ku_wave_plat/scripts/install/db-backup.sh >> /opt/ku_wave_plat/backups/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "db-backup.sh"; echo "$CRON_LINE") | crontab -

echo "✅ DB 백업 cron (매일 03:00, 7일 보관)"
echo "수동: /opt/ku_wave_plat/scripts/install/db-backup.sh"
