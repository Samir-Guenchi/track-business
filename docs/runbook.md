# Runbook: deploy, roll back, restore

Hosting follows ADR-0001: one Docker image per service, one container host per environment behind Caddy, managed PostgreSQL, Redis on the host. Only the gateway is public.

| Environment | Deployed from | When | Approval |
|---|---|---|---|
| staging | `dev` | every push (target: live within 10 minutes) | none |
| production | `main` | every push | Samir approves the `production` environment |

## One-time setup (Samir)

1. **Host** (any EU VPS with Docker and the Compose plugin): create `/opt/trackecom`, a `deploy` user in the `docker` group, and allow its SSH key.
2. **Databases**: managed PostgreSQL 17 with daily provider backups and point-in-time recovery turned on. One database and one user per service (`identity`, `shipping`, ...), TLS required.
3. **GitHub environments** (Settings → Environments): `staging`, `production` (add *Required reviewers: Samir-Guenchi*) and `backups`.
   - Secrets for `staging` / `production`: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan <host>`), `DEPLOY_ENV_FILE` (the whole `.env`, template in `deploy/.env.example`).
   - Variable `HEALTH_URL`, e.g. `https://api.staging.example.dz/health/ready`.
   - Secrets for `backups`: `BACKUP_BUCKET`, `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY`, `BACKUP_AGE_IDENTITY` (the age private key); variables `BACKUP_AWS_ENDPOINT_URL`, `BACKUP_AWS_REGION`.
4. **JWT key** per environment: `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256`, put it in `JWT_PRIVATE_KEY` with newlines as `\n`. Never reuse the staging key in production.
   **Carrier key** per environment: `openssl rand -base64 32` into `CARRIER_KEK` (with `CARRIER_KEK_ID=v1`). It wraps every store's carrier credentials: keep an offline copy, since losing it means every seller reconnects their carriers. To rotate, set the new key with a new `CARRIER_KEK_ID` and move the old one to `CARRIER_KEK_PREVIOUS` (`v1:<base64>`); old rows keep opening with their key until re-saved.
5. **Sentry**: one project per environment (Node), DSN in `SENTRY_DSN`. Services only send 5xx errors, with headers, cookies, bodies, query strings and user data removed.
6. **Uptime**: point a monitor (Better Stack, UptimeRobot or a self-hosted Uptime Kuma) at `HEALTH_URL` every minute, alert by email + Telegram.
7. **Backups**: on the host, install `age`, `postgresql-client-17` and the AWS CLI, create `/opt/trackecom/backup.env` (see the header of `deploy/backup/pg-backup.sh`) and add the cron line:
   `15 2 * * * . /opt/trackecom/backup.env && /opt/trackecom/backup/pg-backup.sh >> /var/log/trackecom-backup.log 2>&1`
   Set a 35-day lifecycle rule on the bucket. Keep the age private key offline too.

Until `DEPLOY_HOST` is set, the Deploy workflow builds and pushes images and skips the rollout with a notice.

## Deploy

Merge into `dev` (staging) or `main` (production). The **Deploy** workflow:

1. builds one image per folder in `services/` → `ghcr.io/samir-guenchi/trackecom-<service>:sha-<commit>`;
2. copies `deploy/compose.yml`, `deploy/Caddyfile` and the environment's `.env` to the host;
3. runs each service's migrations (`<service>-migrate`, `prisma migrate deploy`) **before** starting new containers;
4. `docker compose up -d --wait` (waits for container health checks), then polls `HEALTH_URL`.

A new service must be added to `deploy/compose.yml` (service + `-migrate` job) in the same PR that creates it.

## Roll back

Actions → **Deploy** → *Run workflow* → environment + `image_tag` of the last good release (see the previous run's summary, e.g. `sha-1a2b3c4`). Nothing is rebuilt.

Migrations are forward-only. A release that changes the schema must stay compatible with the previous code (expand, then contract in a later release), so rolling back the code never needs a schema rollback.

## Restore a database

1. **Recent mistake (minutes to days):** use the managed provider's point-in-time recovery into a new instance, check it, then switch `<SERVICE>_DATABASE_URL` and redeploy.
2. **Provider unavailable:** restore our off-site copy into a fresh database:
   ```bash
   AGE_IDENTITY_FILE=./age.key BACKUP_BUCKET=s3://... deploy/backup/pg-restore.sh identity "postgresql://identity:...@new-host:5432/identity"
   ```
   Then point the service at it and redeploy.

The **Restore drill** workflow restores the latest backup of every database into a throwaway Postgres every Monday and fails if no migrations come back. It was run by hand once before go-live: record the date here.

| Date | Who | Result |
|---|---|---|
| 2026-10-31 | Claude (local Postgres 16, test bucket) | identity restored, 4 migrations |

## Incidents

- Error spike: Sentry (filter by `service` and `correlationId`), then `docker compose logs <service> | grep <correlationId>` on the host.
- Service unhealthy: `docker compose ps`, `docker compose logs --tail 200 <service>`, check `/health/ready` checks (database, redis).
- Roll back first, investigate second.
