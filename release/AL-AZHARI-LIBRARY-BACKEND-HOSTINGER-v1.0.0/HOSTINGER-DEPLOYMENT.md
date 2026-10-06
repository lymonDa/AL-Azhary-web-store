# AL-AZHARI LIBRARY BACKEND — HOSTINGER DEPLOYMENT GUIDE

This release archive contains the production-compiled backend application for the **AL-AZHARI LIBRARY** platform.

---

## 1. Quick Technical Specifications

- **Runtime**: Node.js >= 20.0.0 (Recommended: Node.js 20.x LTS)
- **Framework**: Express 4.x + TypeScript (compiled to CommonJS in `dist/`)
- **Database**: MongoDB (Atlas connection string required)
- **Application Entry Point**: `dist/server.js`
- **Default Port**: Bound to `process.env.PORT` (defaults to 3000 if unset)
- **Start Command**: `npm start` (or `node dist/server.js`)
- **Health Check Endpoints**:
  - Liveness: `GET /health/live` (returns HTTP 200 `{ status: "ok" }`)
  - Readiness: `GET /health/ready` (checks MongoDB and internal worker states)

---

## 2. Hostinger Deployment Steps (via hPanel Node.js Application Manager)

### Step 1: Upload and Extract Archive
1. Log in to your Hostinger Control Panel (**hPanel**).
2. Go to **Websites** -> Select your website -> Open **File Manager**.
3. Navigate to your application root directory (e.g. `/home/u123456789/nodejs_app` or `public_html`).
4. Upload `AL-AZHARI-LIBRARY-BACKEND-HOSTINGER-v1.0.0.zip` and **Extract** its contents.

### Step 2: Configure Node.js Application in hPanel
1. In hPanel, navigate to the **Node.js** section.
2. Configure the following settings:
   - **Node.js Version**: `20.x` (or latest 22.x LTS)
   - **Application Root**: Set to the extracted folder (where `package.json` is located).
   - **Application Startup File**: `dist/server.js`
   - **Application Mode**: `Production`

### Step 3: Install Production Dependencies
In hPanel Node.js section, click **Install Dependencies** (runs `npm install --omit=dev`), or via SSH terminal in the app directory:
```bash
npm ci --omit=dev
```

### Step 4: Configure Production Environment Variables
Copy `.env.example` to `.env` or enter environment variables directly in Hostinger hPanel's **Environment Variables** tab:

```env
NODE_ENV=production
PORT=3000
API_BASE_PATH=/api/v1
PUBLIC_APP_ORIGIN=https://alazharilibrary.com
ALLOWED_ORIGINS=https://alazharilibrary.com,https://www.alazharilibrary.com,https://admin.alazharilibrary.com

# MongoDB Atlas Database Connection
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=Database

# Security & Authentication (minimum 32-character secure random strings)
JWT_ACCESS_SECRET=your_secure_random_access_secret_min_32_chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET=your_secure_random_refresh_secret_min_32_chars
JWT_REFRESH_TTL=7d
JWT_ISSUER=al-azhari-library
JWT_AUDIENCE=al-azhari-web

# HTTPS Cookie Settings (Mandatory for Hostinger SSL)
REFRESH_COOKIE_NAME=al_azhari_refresh
REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_SAME_SITE=lax

# Password Hashing
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_PAYMENT_PROOF_FOLDER=al-azhari/payment-proofs
CLOUDINARY_PRODUCT_FOLDER=al-azhari/products

# SMTP Email (Hostinger Titan / Custom SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@alazharilibrary.com
SMTP_PASSWORD=your_email_password
EMAIL_FROM=no-reply@alazharilibrary.com

# Customer Support
WHATSAPP_PHONE=+201070944400

# Reverse Proxy (Tells Express to trust Hostinger Nginx proxy headers)
TRUST_PROXY=1
SOCKET_PATH=/socket.io
```

### Step 5: Run Database Migrations (One-time Setup)
Via Hostinger SSH or Terminal in the application root:
```bash
npm run migrate
```
To seed initial system roles, default categories, and configuration:
```bash
npm run seed
```

### Step 6: Start and Verify Application
1. In hPanel, click **Restart** (or **Start**) Application.
2. Verify the server is running by opening:
   `https://your-domain.com/health/live`
3. Verify database connectivity:
   `https://your-domain.com/health/ready`
4. Inspect application logs in hPanel to ensure `outbox worker` and `CronScheduler` started cleanly.
