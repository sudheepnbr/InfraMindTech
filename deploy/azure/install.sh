#!/bin/bash
# InfraMindTech — Azure VPS install script (Ubuntu 22.04/24.04)
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_USER="${SUDO_USER:-$USER}"
PYTHON_BIN="python3"

echo "==> InfraMindTech installer"
echo "    App directory: $APP_DIR"

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y python3 python3-pip python3-venv nginx

cd "$APP_DIR"

if [ ! -d venv ]; then
  echo "==> Creating Python virtual environment"
  $PYTHON_BIN -m venv venv
fi

echo "==> Installing Python dependencies"
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

mkdir -p data images/uploads
chmod 755 data images images/uploads

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
  echo "    IMPORTANT: Edit $APP_DIR/.env before production use"
fi

if [ ! -f data/cms.db ] && [ -f data/content.json ]; then
  echo "==> Seeding database from content.json"
  ./venv/bin/python deploy/azure/import-content.py
fi

echo "==> Installing systemd service"
sudo cp deploy/azure/inframindtech.service /etc/systemd/system/inframindtech.service
sudo sed -i "s|__APP_DIR__|$APP_DIR|g" /etc/systemd/system/inframindtech.service
sudo sed -i "s|__APP_USER__|$APP_USER|g" /etc/systemd/system/inframindtech.service
sudo systemctl daemon-reload

echo "==> Configuring nginx"
sudo cp deploy/azure/nginx-inframindtech.conf /etc/nginx/sites-available/inframindtech
sudo sed -i "s|__APP_DIR__|$APP_DIR|g" /etc/nginx/sites-available/inframindtech
sudo ln -sf /etc/nginx/sites-available/inframindtech /etc/nginx/sites-enabled/inframindtech
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "==> Install complete!"
echo "    1. Edit: nano $APP_DIR/.env"
echo "    2. Start: sudo systemctl enable --now inframindtech"
echo "    3. Open:  http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
echo "    4. Admin: http://YOUR_IP/admin/"
