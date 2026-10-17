#!/bin/bash
set -e

DB_USER="${DB_USER:-darlam_user}"
DB_PASSWORD="${DB_PASSWORD:-darlam_password}"
DB_NAME="${DB_NAME:-darlam_db}"

echo "=== Initializing PostgreSQL Database & Extensions ==="
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
echo '=== DB SETUP DONE ==='
