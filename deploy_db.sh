#!/bin/bash
sudo -u postgres psql -c "CREATE USER darlam_user WITH PASSWORD 'darlam_secure_2026';"
sudo -u postgres psql -c "CREATE DATABASE darlam_db OWNER darlam_user;"
sudo -u postgres psql -d darlam_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d darlam_db -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
echo '=== DB SETUP DONE ==='
