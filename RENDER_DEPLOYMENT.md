# 🚀 Deploy on Render.com (FREE)

Railway has limited free tier, so we'll use **Render.com** instead - it's completely FREE for demos!

## ✅ Why Render?

- ✅ **750 hours/month FREE** (25 days full uptime)
- ✅ **PostgreSQL database FREE**
- ✅ **No credit card required**
- ✅ **Auto-deploy from GitHub**
- ✅ **Free SSL certificates**

---

## 🎯 Step-by-Step Deployment

### **Step 1: Sign Up on Render**

1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest)
4. Authorize Render to access your repositories

---

### **Step 2: Create PostgreSQL Database**

1. Click **"New +"** → **"PostgreSQL"**
2. Settings:
   - **Name:** `inventory-db`
   - **Database:** `storeflow`
   - **Region:** Singapore (or closest to you)
   - **Plan:** **Free**
3. Click **"Create Database"**
4. Wait 2-3 minutes for database to initialize

---

### **Step 3: Convert & Import Database**

Since Render uses PostgreSQL (not MySQL), we need to convert:

**Option A: Use Railway MySQL (Current Setup)**
Keep your MySQL on Railway and connect Render backend to it:
- In Render, manually add Railway MySQL credentials as environment variables

**Option B: Convert to PostgreSQL**
```powershell
# Install pgloader (converts MySQL to PostgreSQL)
# Then import database_export.sql to Render PostgreSQL
```

**For demo purposes, I recommend Option A** - keep Railway MySQL!

---

### **Step 4: Create Web Service (Backend)**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `ulabideen436-lab/inventory-management-demo`
3. Settings:
   - **Name:** `inventory-backend`
   - **Region:** Singapore
   - **Branch:** main
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free**

4. **Environment Variables** (click "Advanced"):
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=b13cdabd569515d19c0a5977a530ad6b6a0dcaab319ebc0ee5be742cb8e527c8
   
   # Use Railway MySQL credentials (get from Railway dashboard):
   DB_HOST=<Railway MySQL Host>
   DB_PORT=<Railway MySQL Port>
   DB_USER=<Railway MySQL User>
   DB_PASSWORD=<Railway MySQL Password>
   DB_NAME=<Railway MySQL Database>
   ```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. **Copy the backend URL** (e.g., `https://inventory-backend.onrender.com`)

---

### **Step 5: Deploy Frontend on Vercel**

1. Go to: https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select `ulabideen436-lab/inventory-management-demo`
4. Settings:
   - **Framework:** Create React App
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     ```
     REACT_APP_API_URL=https://inventory-backend.onrender.com
     REACT_APP_WS_URL=wss://inventory-backend.onrender.com/ws
     ```
5. Click **"Deploy"**
6. **Copy your frontend URL**

---

### **Step 6: Update CORS**

Tell me both URLs and I'll update the CORS settings in your backend!

---

## 💰 Cost Comparison

| Platform | Free Tier | Backend | Database | Frontend |
|----------|-----------|---------|----------|----------|
| **Render** | ✅ 750 hrs | ✅ Yes | ✅ PostgreSQL | ❌ No |
| **Railway** | ⚠️ DB only | ❌ Paid | ✅ MySQL | ❌ No |
| **Vercel** | ✅ Unlimited | ❌ No | ❌ No | ✅ Yes |

**Best Combo:**
- Backend: **Render** (free)
- Database: **Railway MySQL** (free - already set up!)
- Frontend: **Vercel** (free)

---

## 🎯 Quick Start

**Which option do you prefer?**

1. **Switch to Render** (deploy new backend on Render, keep Railway MySQL)
2. **Upgrade Railway** (add credit card for $5 trial credits)
3. **Try another platform** (Fly.io, Heroku alternatives)

Let me know and I'll guide you through! 🚀
