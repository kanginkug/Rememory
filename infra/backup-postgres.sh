#!/usr/bin/env bash
# Oracle VM에서 cron으로 매일 실행할 self-hosted PostgreSQL 백업 스크립트.
# RDS는 AWS가 자동 백업해줬지만 컨테이너 postgres는 직접 챙겨야 함.
#
# 설치 (Oracle VM):
#   sudo cp infra/backup-postgres.sh /usr/local/bin/backup-postgres.sh
#   sudo chmod +x /usr/local/bin/backup-postgres.sh
#   crontab -e
#   0 4 * * * POSTGRES_DB=... POSTGRES_USER=... /usr/local/bin/backup-postgres.sh >> /var/log/rememory-backup.log 2>&1
#
# S3 호환(Oracle Object Storage) 업로드까지 하려면 aws-cli 설치 + 아래 환경변수 설정:
#   S3_ENDPOINT, S3_BUCKET, AWS_ACCESS_KEY_ID(=S3_ACCESS_KEY), AWS_SECRET_ACCESS_KEY(=S3_SECRET_KEY)
# 설정 안 하면 로컬 디스크에만 보관.

set -euo pipefail

CONTAINER_NAME="${POSTGRES_CONTAINER:-rememory-postgres}"
DB_NAME="${POSTGRES_DB:?POSTGRES_DB 환경변수 필요}"
DB_USER="${POSTGRES_USER:?POSTGRES_USER 환경변수 필요}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$BACKUP_DIR/rememory-$TIMESTAMP.sql.gz"

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DUMP_FILE"

if [ -n "${S3_ENDPOINT:-}" ] && [ -n "${S3_BUCKET:-}" ]; then
  aws --endpoint-url "$S3_ENDPOINT" s3 cp "$DUMP_FILE" "s3://$S3_BUCKET/postgres-backups/$(basename "$DUMP_FILE")"
fi

find "$BACKUP_DIR" -name "rememory-*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "backup done: $DUMP_FILE"
