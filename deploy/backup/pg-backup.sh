#!/usr/bin/env sh
# Nightly logical backup of every service database, encrypted, stored off-site.
# Runs on the container host (cron, see docs/runbook.md). Needs: pg_dump 17, age, aws CLI.
#
# Env (from /opt/trackecom/backup.env, never committed):
#   BACKUP_DATABASES   space-separated NAME=URL pairs, e.g. "identity=postgresql://... shipping=postgresql://..."
#   AGE_RECIPIENT      public key that can decrypt (private key kept offline + in GitHub secret for the drill)
#   BACKUP_BUCKET      s3://bucket/prefix   (bucket lifecycle deletes objects after 35 days)
#   AWS_ENDPOINT_URL   S3-compatible endpoint (optional), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
set -eu

stamp=$(date -u +%Y-%m-%dT%H%M%SZ)
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

for pair in $BACKUP_DATABASES; do
  name=${pair%%=*}
  url=${pair#*=}
  file="$workdir/$name-$stamp.dump.age"
  # Custom format: compressed, restorable table by table. Never written unencrypted to disk.
  pg_dump --format=custom --no-owner --no-privileges "$url" | age --recipient "$AGE_RECIPIENT" > "$file"
  aws s3 cp --only-show-errors "$file" "$BACKUP_BUCKET/$name/$name-$stamp.dump.age"
  echo "backed up $name ($(wc -c < "$file") bytes)"
done
