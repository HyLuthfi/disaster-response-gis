#!/bin/bash
set -e

echo "=== [1/6] Updating database credentials ==="
sed -i 's/"user": "postgres"/"user": "darlam_user"/' /opt/darlam/backend/main.py
sed -i 's/"password": "admin"/"password": "darlam_secure_2026"/' /opt/darlam/backend/main.py
echo "DB credentials updated"

echo "=== [2/6] Setting up Python venv & dependencies ==="
cd /opt/darlam/backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet psycopg2-binary fastapi uvicorn[standard]
echo "Python dependencies installed"

echo "=== [3/6] Configuring PostgreSQL authentication ==="
PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
# Allow password auth for local connections
sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA"
systemctl restart postgresql
echo "PostgreSQL auth configured"

echo "=== [4/6] Running database setup scripts ==="
cd /opt/darlam/backend
source venv/bin/activate
python3 setup_tables.py || echo "setup_tables warning (may already exist)"
python3 setup_routing.py || echo "setup_routing warning (may already exist)"
python3 setup_users.py || echo "setup_users warning (may already exist)"
echo "Database tables created"

echo "=== [5/6] Building frontend ==="
cd /opt/darlam/frontend
npm install --legacy-peer-deps 2>&1 | tail -3
npx vite build 2>&1 | tail -5
echo "Frontend built"

echo "=== [6/6] Creating systemd service for backend ==="
cat > /etc/systemd/system/darlam-api.service << 'EOF'
[Unit]
Description=DARLAM FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/darlam/backend
ExecStart=/opt/darlam/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable darlam-api
systemctl start darlam-api
echo "Backend service started"

echo "=== Setting up Nginx ==="
cat > /etc/nginx/sites-available/darlam << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (static files)
    root /opt/darlam/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/darlam /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "Nginx configured"

echo ""
echo "========================================="
echo "  DARLAM DEPLOYMENT COMPLETE!"
echo "  Access: http://195.88.211.5"
echo "========================================="
