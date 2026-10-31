#!/usr/bin/env sh
# Restores the latest (or a given) backup of one database. Used by the weekly restore drill and
# by hand during an incident (docs/runbook.md). Needs: pg_restore 17, age, aws CLI.
#
# Usage: pg-restore.sh <name> <target-database-url> [object-key]
# Env:   BACKUP_BUCKET, AGE_IDENTITY_FILE (private key file), AWS_* as for pg-backup.sh
set -eu

name=$1
target=$2
key=${3:-}

if [ -z "$key" ]; then
  key=$(aws s3 ls "$BACKUP_BUCKET/$name/" | sort | tail -n 1 | awk '{print $4}')
fi
[ -n "$key" ] || { echo "no backup found for $name" >&2; exit 1; }

echo "restoring $name from $key"
aws s3 cp --only-show-errors "$BACKUP_BUCKET/$name/$key" - \
  | age --decrypt --identity "$AGE_IDENTITY_FILE" \
  | pg_restore --no-owner --no-privileges --clean --if-exists --exit-on-error --dbname "$target"
echo "restored $name"
