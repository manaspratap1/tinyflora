# Deployment & Production Runbook

**Project:** Tiny Flora Microgreens E-Commerce  
**Stack:** Next.js 16.4.4 (App Router), Prisma 6.19.3, Supabase PostgreSQL, Node.js 22, PM2, Nginx, AWS EC2  

---

## 1. Architecture Overview

- **Frontend & API:** Next.js full-stack application running on port `3000` via PM2.
- **Database:** Supabase PostgreSQL with pooled connections for runtime queries and direct connections for schema synchronization.
- **Reverse Proxy:** Nginx routing port `80`/`443` traffic to local Next.js server (`localhost:3000`).
- **Media Uploads:** Stored under `public/uploads/` with persistent local disk storage.

---

## 2. Supabase PostgreSQL Configuration

Supabase provides two database connection strings in your project dashboard (**Project Settings** → **Database** → **Connection String**):

1. **Transaction Pooler (Port 6543) → `DATABASE_URL`**  
   Optimized for serverless and web traffic. Always append `?pgbouncer=true`.
   ```
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. **Direct Connection (Port 5432) → `DIRECT_URL`**  
   Required by Prisma for `npx prisma db push`, migrations, and CLI introspection.
   ```
   DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

> [!NOTE]  
> If you have special characters in your database password (such as `@`, `#`, `$`), ensure the password in the connection string is URL-encoded.

---

## 3. Local Verification with Supabase (Before EC2 Push)

Before pushing to GitHub, you can point your local app to Supabase to verify connectivity:

1. Open `.env` and replace `DATABASE_URL` and `DIRECT_URL` with your Supabase credentials:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

2. Push all database tables to Supabase:
   ```bash
   npx prisma db push
   ```

3. Run the automated seed script to populate admin credentials, store settings, 5 categories, and 22 products:
   ```bash
   npm run seed
   ```

4. Verify tables and data in your Supabase Dashboard Table Editor (`users`, `category`, `product`, `store_settings`, `carts`, `orders`).

---

## 4. Pushing Code to GitHub

1. Confirm that `.env` is ignored and `.env.example` is present:
   ```bash
   git status
   ```
2. Commit and push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete deployment-ready e-commerce with Supabase support and seed script"
   git push origin main
   ```

---

## 5. Step-by-Step Deployment on AWS EC2 (Ubuntu 22.04 / 24.04 LTS)

### Step 5.1: Connect to your EC2 Instance
```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### Step 5.2: Install Node.js 22 LTS & Build Tools
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# Verify installations
node -v   # Should output v22.x.x
npm -v    # Should output 10.x.x
```

### Step 5.3: Install Global Process Manager (PM2)
```bash
sudo npm install -g pm2
```

### Step 5.4: Clone Repository
```bash
# Clone repository
git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git website
cd website

# Install dependencies
npm ci
```

### Step 5.5: Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Fill in the production values:
```env
# 1. Database Connection (Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. Public Storefront URL (Your EC2 Elastic IP or domain)
NEXT_PUBLIC_APP_URL="http://your-ec2-ip:3000"

# 3. Primary Admin Credentials
ADMIN_EMAIL="manas@gmail.com"
ADMIN_PASSWORD="adbYVIUawo2375"

# 4. Security JWT Secret
JWT_SECRET="generate_a_random_32_character_string_here"

# 5. Store Metadata
NEXT_PUBLIC_STORE_NAME="Tiny Flora Microgreens"
NEXT_PUBLIC_STORE_TAGLINE="Pure nutrition, locally grown microgreens delivered fresh from seed to table."
NEXT_PUBLIC_CONTACT_EMAIL="hello@tinyflora.com"
NEXT_PUBLIC_CONTACT_PHONE="+91XXXXXXXXXX"
NEXT_PUBLIC_STORE_ADDRESS="Lucknow, Uttar Pradesh"
```
*(Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit `nano`)*

### Step 5.6: Initialize Database Schema & Seed Data
```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push tables to Supabase PostgreSQL
npx prisma db push

# 3. Execute Seeding Script
npm run seed
```
> **Seed Script Output:**
> - Creates default store profile in `store_settings`
> - Creates the primary admin user defined in `ADMIN_EMAIL` & `ADMIN_PASSWORD`
> - Creates demo admin user (`demo` / `demo`)
> - Creates 5 distinct product categories
> - Creates 22 complete microgreen products with pricing, stock, weights, and high-res photography

### Step 5.7: Build Next.js Application
```bash
npm run build
```
*(Confirms compilation and prerendering of all 25 routes)*

### Step 5.8: Start and Persist with PM2
```bash
# Start application on port 3000
pm2 start npm --name "tinyflora" -- start

# Configure PM2 to restart on server reboot
pm2 startup
# (Run the sudo env PATH=... command printed by PM2)
pm2 save
```

---

## 6. How Admin Management Works

### Method 1: Automated Environment Seed (Recommended)
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file and execute:
```bash
npm run seed
```
The script hashes the password with secure cryptographic PBKDF2/SHA-256 and sets `role = "ADMIN"`.

### Method 2: Supabase Dashboard
1. A user can register on the frontend via `/signup`.
2. Go to your **Supabase Dashboard** → **Table Editor** → **`users`** table.
3. Locate the row with the user's email and change the `role` column value from `CUSTOMER` to `ADMIN`.
4. The user can now access `/admin` immediately with their registered credentials.

---

## 7. Configuring Nginx & SSL (Optional for Custom Domain / Port 80/443)

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/tinyflora
```

Paste the following block:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tinyflora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Obtain free SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 8. Ongoing Updates & Deployment Pulls

When you push new features from your local machine to GitHub:

```bash
cd ~/website
git pull origin main
npm ci
npx prisma generate
npx prisma db push      # If schema changed
npm run build
pm2 restart tinyflora
```

