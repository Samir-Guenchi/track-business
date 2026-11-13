#!/bin/sh
# Creates one database and one owner per service (ADR-0001: a service owns its data),
# plus the extensions the services need. Runs once, on the first start of an empty volume.
set -eu

for service in identity shipping orders payments notifications integrations; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
CREATE ROLE $service LOGIN PASSWORD '$service' CREATEDB;
CREATE DATABASE $service OWNER $service;
SQL
done

# Fuzzy search on customer names and addresses (orders) needs pg_trgm, which needs a superuser.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname orders -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'
