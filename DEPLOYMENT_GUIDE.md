# 🚀 Deployment Guide - Temporary Client Demo

This guide helps you deploy your Inventory Management System for client testing **without keeping your computer on**.

## 📋 Best Option: Railway.app (Recommended)

✅ **Free for 500 hours/month** (enough for demos)  
✅ **MySQL database included** (free)  
✅ **Easy setup** (10-15 minutes)  
✅ **Stays online 24/7**  
✅ **No credit card required** for trial

---

## 🎯 RAILWAY.APP DEPLOYMENT (RECOMMENDED)

### Step 1: Prepare Your Project

1. **Create a GitHub account** if you don't have one: https://github.com
2. **Install Git** if not installed: https://git-scm.com/download/win

3. **Initialize Git repository** (run in PowerShell):

```powershell
cd "d:\Inventory managment"
git init
git add .
git commit -m "Initial commit - Inventory Management System"
```

4. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name: `inventory-management-demo`
   - Keep it **Private**
   - Click "Create repository"

5. **Push your code**:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/inventory-management-demo.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend + Database on Railway

1. **Sign up on Railway**: https://railway.app
   - Use GitHub login (easier)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `inventory-management-demo`
   - Railway will detect Node.js automatically

3. **Add MySQL Database**:
   - In your project, click "+ New"
   - Select "Database" → "MySQL"
   - Railway creates a database automatically

4. **Configure Backend Service**:
   - Click on your backend service
   - Go to "Settings" → "Root Directory"
   - Set to: `backend`
   - Go to "Variables" tab and add:

```
PORT=5000
DB_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASS=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
NODE_ENV=production
```

   - Click "Deploy"

5. **Import Your Database**:
   
   First, export your local database:
   
```powershell
mysqldump -u root -pZafaryaqoob.com786 storeflow > database_export.sql
```

   Then import to Railway:
   - Copy the Railway MySQL connection string
   - Use MySQL Workbench or run:
   
```powershell
mysql -h [railway-host] -u [railway-user] -p[railway-password] [railway-database] < database_export.sql
```

6. **Get Backend URL**:
   - Click on backend service
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-backend.railway.app`)

---

### Step 3: Deploy Frontend on Vercel (Free)

1. **Sign up on Vercel**: https://vercel.com
   - Use GitHub login

2. **Import Project**:
   - Click "Add New" → "Project"
   - Select `inventory-management-demo`
   - Framework: **Create React App**
   - Root Directory: `frontend`

3. **Configure Environment Variables**:
   - Add these variables:

```
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_WS_URL=wss://your-backend.railway.app/ws
```

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your frontend URL (e.g., `https://your-project.vercel.app`)

---

### Step 4: Update CORS Settings

Update your backend to allow the new frontend URL:

**File: `backend/src/index.js`**

Find the CORS configuration and update:

```javascript
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://your-project.vercel.app'  // Add your Vercel URL
    ],
    credentials: true
}));
```

Commit and push:

```powershell
git add .
git commit -m "Update CORS for production"
git push
```

Railway will auto-deploy the update!

---

## 🎯 ALTERNATIVE: Render.com (Also Good)

### Backend + Database on Render

1. **Sign up**: https://render.com
2. **Create PostgreSQL Database** (free tier):
   - Click "New +" → "PostgreSQL"
   - Name: `inventory-db`
   - Free tier selected
   - Create

3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Settings:
     - Name: `inventory-backend`
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Free tier selected

4. **Environment Variables**:
```
PORT=5000
DB_HOST=${{inventory-db.host}}
DB_USER=${{inventory-db.user}}
DB_PASS=${{inventory-db.password}}
DB_NAME=${{inventory-db.database}}
JWT_SECRET=your_secure_secret
NODE_ENV=production
```

5. **Deploy** and copy backend URL

### Frontend on Render

1. **Create Static Site**:
   - Click "New +" → "Static Site"
   - Connect repo
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `build`

2. **Environment Variables**:
```
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_WS_URL=wss://your-backend.onrender.com/ws
```

---

## 📊 Comparison Table

| Feature | Railway | Render | Vercel (Frontend) |
|---------|---------|--------|-------------------|
| **Free Tier** | 500 hrs/month | 750 hrs/month | Unlimited |
| **MySQL** | ✅ Built-in | ❌ PostgreSQL only | ❌ N/A |
| **Setup Time** | 10 min | 15 min | 5 min |
| **Auto-Deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Custom Domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Sleep Policy** | No sleep | Sleeps after 15 min | Never sleeps |

---

## ⚡ Quick Testing After Deployment

1. **Test Backend**:
```
https://your-backend.railway.app/health
```

2. **Test Frontend**:
```
https://your-project.vercel.app
```

3. **Login with test user**:
   - Username: `testowner`
   - Password: `test123`

---

## 🔐 Security Checklist Before Sharing

- ✅ Change default passwords
- ✅ Remove `.env` from Git (add to `.gitignore`)
- ✅ Use strong JWT secret
- ✅ Enable CORS only for your domains
- ✅ Test all features work online

---

## 💰 Cost Estimate

**For Demo (1 month):**
- Railway: **FREE** (500 hours = 20 days full uptime)
- Vercel: **FREE** (unlimited)
- **Total: $0**

**After Demo:**
- You can delete the services anytime
- Or upgrade when moving to Hostinger

---

## 🆘 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Check database connection string
- View logs in Railway/Render dashboard

### Frontend can't connect to backend
- Verify REACT_APP_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running (not sleeping)

### Database connection failed
- Verify DB credentials in environment variables
- Check if database import completed successfully
- Whitelist all IPs (0.0.0.0/0) in database settings

---

## 📞 Support

If you encounter issues:
1. Check deployment logs in Railway/Render dashboard
2. Verify all environment variables are set
3. Test backend health endpoint first
4. Then test frontend connection

---

## ⏭️ Next Steps After Client Approval

1. **Export database** from Railway/Render
2. **Download code** from GitHub
3. **Deploy to Hostinger** with your domain
4. **Delete temporary Railway/Render services**

---

**Estimated Setup Time:** 20-30 minutes  
**Cost:** FREE  
**Uptime:** 24/7 (no need to keep PC on)  

Good luck with your client demo! 🚀
