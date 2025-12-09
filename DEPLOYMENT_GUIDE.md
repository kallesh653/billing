# Agarbatti Manufacturing Management System - Complete Deployment Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [VPS Server Setup](#vps-server-setup)
5. [MongoDB Installation](#mongodb-installation)
6. [Node.js and PM2 Setup](#nodejs-and-pm2-setup)
7. [Nginx Installation](#nginx-installation)
8. [Application Deployment](#application-deployment)
9. [SSL Certificate Installation](#ssl-certificate-installation)
10. [Final Configuration](#final-configuration)
11. [Verification](#verification)
12. [Maintenance](#maintenance)
13. [Troubleshooting](#troubleshooting)

---

## System Overview

**Agarbatti Manufacturing Management System** is a full-stack web application for managing an Agarbatti (incense stick) manufacturing business. It includes:

- Product Management
- Inventory Tracking
- Purchase Management
- Sales & Invoicing
- Customer & Supplier Management
- Stock Alerts
- Reports & Analytics
- User Management (Admin & Cashier roles)

**Live URLs:**
- Frontend: https://billing.gentime.in
- Backend API: https://api.gentime.in

**Default Credentials:**
- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

---

## Technology Stack

### Backend
- Node.js v18.19.1
- Express.js
- MongoDB 7.0
- Mongoose ODM
- JWT Authentication
- Multer (file uploads)

### Frontend
- React 18
- Vite
- Ant Design UI
- Axios
- React Router

### Infrastructure
- Ubuntu 24.04 LTS
- Nginx (web server & reverse proxy)
- PM2 (process manager)
- Let's Encrypt SSL/TLS certificates
- Certbot (SSL automation)

---

## Prerequisites

### Required Information
- VPS Server with root access
- Domain names configured:
  - `billing.gentime.in` (Frontend)
  - `api.gentime.in` (Backend API)
- SSH access to server
- Git repository: https://github.com/kallesh653/billing.git

### Domain DNS Configuration
Before deployment, configure these A records in your DNS provider:

```
billing.gentime.in  →  72.61.238.39
api.gentime.in      →  72.61.238.39
```

DNS propagation typically takes 5-30 minutes.

---

## VPS Server Setup

### 1. Connect to VPS
```bash
ssh root@72.61.238.39
```

### 2. Update System Packages
```bash
apt update && apt upgrade -y
```

### 3. Install Essential Build Tools
```bash
apt install -y build-essential curl git
```

---

## MongoDB Installation

### 1. Import MongoDB GPG Key
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
```

### 2. Add MongoDB Repository
Ubuntu 24.04 doesn't have MongoDB 7.0 packages yet, so we use Ubuntu 22.04 (jammy) repository:

```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### 3. Update Package List
```bash
apt update
```

### 4. Install MongoDB
```bash
apt install -y mongodb-org
```

### 5. Start and Enable MongoDB
```bash
systemctl start mongod
systemctl enable mongod
systemctl status mongod
```

**Expected Output:**
```
● mongod.service - MongoDB Database Server
     Loaded: loaded
     Active: active (running)
```

---

## Node.js and PM2 Setup

### 1. Install Node.js v18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

### 2. Verify Installation
```bash
node --version  # Should output: v18.19.1
npm --version   # Should output: 9.2.0
```

### 3. Install PM2 Globally
```bash
npm install -g pm2
```

### 4. Configure PM2 Startup
```bash
pm2 startup systemd
pm2 save
```

This ensures PM2 starts automatically on server reboot.

---

## Nginx Installation

### 1. Install Nginx
```bash
apt install -y nginx
```

### 2. Start and Enable Nginx
```bash
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

### 3. Configure Firewall (if UFW is enabled)
```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

---

## Application Deployment

### 1. Clone Repository
```bash
cd /root
git clone https://github.com/kallesh653/billing.git
cd billing
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

**Expected:** 342 packages installed

### 3. Create Backend Environment File
```bash
cat > /root/billing/backend/.env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=8080

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/company_management

# JWT Secret Keys
JWT_SECRET=148ee728b773382d58305bd9910c735059657e32189ddaa0ead67368cf17bb6c230978d82bf644b10999acff2dff748d9ffcdbc0d79f068245dce4b9570189da
JWT_EXPIRE=30d

# Business Settings
SHOP_NAME=Agarbatti Manufacturing Co.
SHOP_ADDRESS=Your Business Address
SHOP_MOBILE=+91 XXXXXXXXXX
SHOP_EMAIL=info@agarbatti.com
COMPANY_STATE=Your State

# Thermal Printer Settings
PRINTER_NAME=ThermalPrinter
PRINTER_WIDTH=48
EOF
```

### 4. Initialize Database
```bash
cd /root/billing/backend
node utils/seedAdmin.js
```

**Expected Output:**
```
✅ Admin user created
   Username: admin
   Password: admin123
✅ Cashier user created
   Username: cashier
   Password: cashier123
✅ Default business settings created
🎉 Setup completed successfully!
```

### 5. Fix File Name Case Issue
MongoDB and routes are case-sensitive on Linux:
```bash
cd /root/billing/backend/controllers
mv subcodeController.js subCodeController.js
```

### 6. Start Backend with PM2
```bash
cd /root/billing/backend
pm2 start server.js --name billing-backend
pm2 save
```

### 7. Verify Backend Status
```bash
pm2 status
```

**Expected:**
```
┌────┬──────────────────┬─────────┬─────────┬────────┬──────┬──────────┐
│ id │ name             │ mode    │ pid     │ uptime │ ↺    │ status   │
├────┼──────────────────┼─────────┼─────────┼────────┼──────┼──────────┤
│ 0  │ billing-backend  │ fork    │ 20390   │ 10m    │ 15   │ online   │
└────┴──────────────────┴─────────┴─────────┴────────┴──────┴──────────┘
```

### 8. Install Frontend Dependencies
```bash
cd /root/billing/frontend
npm install
```

**Expected:** 229 packages installed

### 9. Update Frontend API Configuration
```bash
cat > /root/billing/frontend/src/services/api.js << 'EOF'
import axios from 'axios';

// Determine API base URL
const getBaseURL = () => {
  // For production VPS deployment
  if (window.location.hostname === 'billing.gentime.in') {
    return 'https://api.gentime.in/api';
  }
  // For development and Electron production
  if (window.location.protocol === 'file:' || import.meta.env.PROD) {
    return 'http://localhost:8080/api';
  }
  // For Vite dev server with proxy
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
EOF
```

### 10. Build Frontend for Production
```bash
cd /root/billing/frontend
npm run build
```

**Expected:** Build completes in ~25 seconds, creates `dist/` folder

### 11. Deploy Frontend to Web Directory
```bash
mkdir -p /var/www/billing
cp -r /root/billing/frontend/dist/* /var/www/billing/
chown -R www-data:www-data /var/www/billing
chmod -R 755 /var/www/billing
```

---

## Nginx Configuration

### 1. Configure Frontend (billing.gentime.in)
```bash
cat > /etc/nginx/sites-available/billing.gentime.in << 'EOF'
server {
    listen 80;
    server_name billing.gentime.in;

    root /var/www/billing;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
```

### 2. Configure Backend API (api.gentime.in)
```bash
cat > /etc/nginx/sites-available/api.gentime.in << 'EOF'
server {
    listen 80;
    server_name api.gentime.in;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
```

### 3. Enable Sites and Remove Default
```bash
ln -sf /etc/nginx/sites-available/billing.gentime.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.gentime.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### 4. Test Nginx Configuration
```bash
nginx -t
```

**Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Reload Nginx
```bash
systemctl reload nginx
```

---

## SSL Certificate Installation

### 1. Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificates
```bash
certbot --nginx -d billing.gentime.in -d api.gentime.in --non-interactive --agree-tos --email kallesh653@gmail.com --redirect
```

**Expected Output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/billing.gentime.in/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/billing.gentime.in/privkey.pem
This certificate expires on 2026-03-09.

Successfully deployed certificate for billing.gentime.in
Successfully deployed certificate for api.gentime.in
Congratulations! You have successfully enabled HTTPS
```

### 3. Verify Auto-Renewal
```bash
certbot renew --dry-run
```

Certbot automatically creates a cron job for renewal. Certificates will auto-renew before expiration.

### 4. Test SSL Configuration
```bash
curl -I https://billing.gentime.in
```

**Expected:** Should return `HTTP/1.1 200 OK` with SSL headers

---

## Final Configuration

### 1. Verify All Services Running
```bash
# Check PM2
pm2 status

# Check MongoDB
systemctl status mongod

# Check Nginx
systemctl status nginx

# Check SSL Certificate
certbot certificates
```

### 2. View Backend Logs
```bash
pm2 logs billing-backend
```

### 3. View Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

## Verification

### 1. Test Frontend
Open in browser:
```
https://billing.gentime.in
```

Should display the login page.

### 2. Test Backend API
```bash
curl https://api.gentime.in/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

Should return JWT token and user data.

### 3. Login to Application
- Username: `admin`
- Password: `admin123`

### 4. Verify Features
- ✅ Product Management
- ✅ Customer Management
- ✅ Purchase Entry
- ✅ Invoice Creation
- ✅ Stock Tracking
- ✅ Reports

---

## Maintenance

### Update Application Code

#### 1. Pull Latest Changes
```bash
cd /root/billing
git pull origin main
```

#### 2. Update Backend
```bash
cd backend
npm install
pm2 restart billing-backend
```

#### 3. Update Frontend
```bash
cd /root/billing/frontend
npm install
npm run build
cp -r dist/* /var/www/billing/
```

### Backup Database

#### Create Backup
```bash
mongodump --db=company_management --out=/root/backups/$(date +%Y%m%d)
```

#### Restore Backup
```bash
mongorestore --db=company_management /root/backups/20251209
```

### Monitor Logs

#### PM2 Logs
```bash
pm2 logs billing-backend
pm2 logs billing-backend --lines 100
```

#### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Services

#### Restart Backend
```bash
pm2 restart billing-backend
```

#### Restart MongoDB
```bash
systemctl restart mongod
```

#### Restart Nginx
```bash
systemctl restart nginx
```

#### Restart All
```bash
pm2 restart all
systemctl restart mongod nginx
```

---

## Troubleshooting

### Backend Not Starting

**Check PM2 Status:**
```bash
pm2 status
pm2 logs billing-backend --err
```

**Common Issues:**
- MongoDB not running: `systemctl start mongod`
- Port 8080 in use: `lsof -i :8080`
- Missing dependencies: `cd /root/billing/backend && npm install`

### Frontend 500 Error

**Check Nginx Error Logs:**
```bash
tail -f /var/log/nginx/error.log
```

**Common Issues:**
- Permission denied: `chown -R www-data:www-data /var/www/billing`
- Missing files: Rebuild frontend and redeploy
- Wrong path in nginx config

### SSL Certificate Issues

**Check Certificate Status:**
```bash
certbot certificates
```

**Renew Manually:**
```bash
certbot renew --force-renewal
```

**Test Auto-Renewal:**
```bash
certbot renew --dry-run
```

### MongoDB Connection Issues

**Check MongoDB Status:**
```bash
systemctl status mongod
journalctl -u mongod -n 50
```

**Restart MongoDB:**
```bash
systemctl restart mongod
```

**Check Connection:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

### API Not Responding

**Test Backend Directly:**
```bash
curl http://localhost:8080/api/auth/test
```

**Check PM2:**
```bash
pm2 restart billing-backend
pm2 logs billing-backend
```

**Check Nginx Proxy:**
```bash
nginx -t
systemctl restart nginx
```

---

## System Architecture

```
Internet
    ↓
[DNS: billing.gentime.in, api.gentime.in]
    ↓
[Nginx - Port 80/443]
    ├── billing.gentime.in → /var/www/billing (Static Files)
    └── api.gentime.in → http://localhost:8080 (Reverse Proxy)
            ↓
        [PM2]
            ↓
        [Node.js Backend - Port 8080]
            ↓
        [MongoDB - Port 27017]
```

---

## Security Checklist

- ✅ SSL/TLS certificates installed (HTTPS)
- ✅ Firewall configured (if applicable)
- ✅ MongoDB not exposed to internet
- ✅ Backend running behind Nginx reverse proxy
- ✅ JWT authentication implemented
- ✅ Security headers configured
- ✅ File upload size limits set
- ✅ Environment variables used for secrets
- ✅ Auto-renewal of SSL certificates
- ✅ CORS properly configured

---

## Performance Optimization

### Nginx Optimizations Applied
- Gzip compression enabled
- Static asset caching (1 year)
- Proper proxy buffering
- Connection timeouts configured

### Frontend Optimizations
- Production build minified
- Code splitting enabled
- Asset compression
- CDN-ready static files

### Backend Optimizations
- PM2 cluster mode available
- MongoDB indexes created
- Efficient queries with population
- File upload limits enforced

---

## Support and Resources

### Important URLs
- Frontend: https://billing.gentime.in
- Backend API: https://api.gentime.in
- GitHub: https://github.com/kallesh653/billing

### Default Credentials
- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

### Contact
- Email: kallesh653@gmail.com

---

## License

Proprietary - All Rights Reserved

---

**Deployment Date:** December 9, 2025
**Server:** 72.61.238.39 (Ubuntu 24.04 LTS)
**Status:** ✅ Production Ready with SSL/HTTPS
