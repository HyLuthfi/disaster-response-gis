#!/bin/bash
set -e

echo "=== Upgrading to Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
dpkg --force-overwrite -i /var/cache/apt/archives/nodejs_*.deb 2>/dev/null || apt-get install -y --fix-broken nodejs
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

echo "=== Rebuilding frontend ==="
cd /opt/darlam/frontend
rm -rf node_modules
npm install --legacy-peer-deps
npx vite build
echo "=== BUILD_COMPLETE ==="

echo "=== Restarting services ==="
systemctl restart darlam-api
systemctl restart nginx
echo "=== ALL DONE ==="
