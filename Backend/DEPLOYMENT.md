# 🚀 EduHMS Production Deployment Guide
## Target: Contabo Cloud VPS 6 (Ubuntu 24.04 LTS / 22.04 LTS)

---

## 1. Initial VPS Server Hardening

### 1.1 Update System & Install Core Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban htop unzip jq
```

### 1.2 Setup UFW Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.3 Install Docker Engine & Docker Compose Plugin
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Deploying EduHMS Stack via Docker Compose

### 2.1 Clone Repository
```bash
git clone https://github.com/your-org/eduhms.git /opt/eduhms
cd /opt/eduhms/Backend
```

### 2.2 Configure Production Environment (`.env.production`)
```bash
cp .env .env.production
nano .env.production
```

### 2.3 Acquire Free SSL Certificate via Certbot
```bash
mkdir -p nginx/certbot/conf nginx/certbot/www

sudo docker run -it --rm --name certbot \
  -v "/opt/eduhms/Backend/nginx/certbot/conf:/etc/letsencrypt" \
  -v "/opt/eduhms/Backend/nginx/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d api.eduhms.gh
```

### 2.4 Start Production Containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 2.5 Run Database Migrations & Seeders
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npm run prisma:seed
```

---

## 3. Automated Backups & System Monitoring

### Daily PostgreSQL Automated Backup Cron Job
```bash
# Add to crontab (crontab -e)
0 2 * * * docker compose -f /opt/eduhms/Backend/docker-compose.prod.yml exec -T postgres pg_dump -U postgres eduhms_prod_db | gzip > /opt/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```
