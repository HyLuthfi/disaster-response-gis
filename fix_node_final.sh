#!/bin/bash
set -e

echo "=== Upgrading to Node.js 20 via n ==="
npm cache clean -f || true
npm install -g n
n 20
hash -r
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

echo "=== Rebuilding frontend ==="
cd /opt/darlam/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx vite build
echo "=== BUILD_COMPLETE ==="

echo "=== Restarting services ==="
systemctl restart darlam-api
systemctl restart nginx
echo "=== ALL DONE ==="
