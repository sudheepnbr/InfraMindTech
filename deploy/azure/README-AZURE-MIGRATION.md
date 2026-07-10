# InfraMindTech — Azure VPS Migration Guide

This package contains the full website, CMS admin, and database for deployment on an **Azure Linux VPS** (Ubuntu 22.04/24.04 recommended).

## Package contents

```
InfraMindTech-Azure/
├── website files     (HTML, CSS, JS, admin, server.py, db.py)
├── data/
│   ├── cms.db        SQLite database with your saved CMS content
│   └── content.json  JSON backup / seed file
├── images/           Static assets and uploads folder
├── deploy/azure/     Install scripts and service configs
├── requirements.txt
└── .env.example      Copy to .env and edit before going live
```

## Quick deploy (Ubuntu VPS)

### 1. Upload zip to Azure VM

```bash
# On your PC (PowerShell) — upload via SCP
scp InfraMindTech-Azure.zip azureuser@YOUR_VM_IP:/home/azureuser/
```

Or use Azure Portal → VM → Connect → upload via SFTP.

### 2. Extract on the VM

```bash
sudo apt update && sudo apt install -y unzip
cd /home/azureuser
unzip InfraMindTech-Azure.zip -d inframindtech
cd inframindtech
```

### 3. Run the installer

```bash
chmod +x deploy/azure/install.sh
sudo deploy/azure/install.sh
```

### 4. Configure environment

```bash
cp .env.example .env
nano .env
```

Set these values:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPasswordHere
SECRET_KEY=generate-a-long-random-string-here
# Leave DATABASE_URL empty to use SQLite (recommended for single VPS)
```

### 5. Start the service

```bash
sudo systemctl enable inframindtech
sudo systemctl start inframindtech
sudo systemctl status inframindtech
```

### 6. Open firewall ports

In **Azure Portal** → VM → Networking → Add inbound rules:
- **80** (HTTP)
- **443** (HTTPS, after SSL setup)

On the VM:

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 7. Access the site

- Website: `http://YOUR_VM_IP/`
- Admin: `http://YOUR_VM_IP/admin/`
- Health: `http://YOUR_VM_IP/api/health`

## Database options

### Option A — SQLite (default, recommended for VPS)

- Database file: `data/cms.db`
- **Persistent** on Azure VM disk (unlike Render free tier)
- No extra setup — works out of the box
- Leave `DATABASE_URL` empty in `.env`

### Option B — PostgreSQL (optional)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser inframind -P
sudo -u postgres createdb inframind_cms -O inframind
```

In `.env`:

```env
DATABASE_URL=postgresql://inframind:YOUR_PASSWORD@localhost:5432/inframind_cms
```

Then import seed:

```bash
source venv/bin/activate
python deploy/azure/import-content.py
sudo systemctl restart inframindtech
```

## HTTPS with domain (recommended)

1. Point your domain A-record to the VM public IP
2. Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Useful commands

```bash
# View logs
sudo journalctl -u inframindtech -f

# Restart after code changes
sudo systemctl restart inframindtech

# Backup database
cp data/cms.db ~/cms-backup-$(date +%Y%m%d).db
```

## Admin saves — permanent?

**Yes**, on Azure VPS with SQLite or PostgreSQL. Content is stored in the database on the VM disk and survives reboots and redeploys.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Site not loading | `sudo systemctl status inframindtech` |
| Admin login fails | Check `.env` ADMIN_USERNAME / ADMIN_PASSWORD |
| Old content showing | Confirm `data/cms.db` exists and has size > 0 |
| Port blocked | Azure NSG + `ufw` rules for 80/443 |

## Support files

- `deploy/azure/install.sh` — full server setup
- `deploy/azure/inframindtech.service` — systemd unit
- `deploy/azure/nginx-inframindtech.conf` — reverse proxy
- `deploy/azure/import-content.py` — seed Postgres from content.json
