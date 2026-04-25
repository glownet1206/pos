# PrimePOS - Hostinger VPS Deployment Guide

## Requirements
- Hostinger VPS (Ubuntu 22.04)
- Domain name
- GitHub account with project repo

---

## Step 1 — VPS Connect karo

```bash
ssh root@YOUR_SERVER_IP
```

---

## Step 2 — Server Setup

```bash
apt update && apt upgrade -y

# Node.js 18 install
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y

# Tools install
apt install nginx git -y
npm install -g pm2
```

---

## Step 3 — GitHub se Code Clone karo

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git pos
cd pos
```

---

## Step 4 — .env File Banao

```bash
nano backend/.env
```

Ye paste karo:
```
JWT_SECRET=apna_strong_secret_key_yahan_likho
PORT=5000
NODE_ENV=production
```
Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 5 — Build karo

```bash
cd /var/www/pos
npm run build
```

---

## Step 6 — PM2 se Backend Start karo

```bash
cd /var/www/pos
pm2 start backend/server.js --name pos
pm2 startup
pm2 save
```

---

## Step 7 — Nginx Configure karo

```bash
nano /etc/nginx/sites-available/pos
```

Ye paste karo (domain replace karo):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/pos/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/pos /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Step 8 — SSL Certificate (Free HTTPS)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 9 — Domain Point karo

Namecheap/GoDaddy pe jao → DNS Settings:
- Type: `A Record`
- Host: `@`
- Value: `YOUR_SERVER_IP`

---

## Code Update karna ho to

```bash
cd /var/www/pos
git pull
npm run build
pm2 restart pos
```

---

## Admin Login

- URL: `https://yourdomain.com/admin`
- Email: `admin@posplatform.com`
- Password: `admin123`

> Admin password zaroor change karo Settings mein!
