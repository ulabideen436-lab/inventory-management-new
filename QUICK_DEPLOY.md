# ⚡ QUICK DEPLOY - 15 Minutes to Online

## 🎯 Fastest Way: Railway.app

### Step 1: Push to GitHub (5 minutes)

```powershell
# In PowerShell, navigate to your project
cd "d:\Inventory managment"

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub: https://github.com/new
# Then run (replace YOUR_USERNAME):
git remote add origin https://github.com/YOUR_USERNAME/inventory-demo.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Railway (5 minutes)

1. **Go to**: https://railway.app
2. **Sign in** with GitHub
3. **Click** "New Project" → "Deploy from GitHub repo"
4. **Select** your `inventory-demo` repo
5. **Add MySQL Database**:
   - Click "+ New" → "Database" → "MySQL"
6. **Configure Backend**:
   - Click backend service → "Settings"
   - Set "Root Directory" to: `backend`
   - Go to "Variables" and add:

```
PORT=5000
DB_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASS=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
JWT_SECRET=b13cdabd569515d19c0a5977a530ad6b6a0dcaab319ebc0ee5be742cb8e527c8
NODE_ENV=production
```

7. **Generate Backend URL**:
   - Click "Settings" → "Networking" → "Generate Domain"
   - Copy the URL (e.g., `https://inventory-backend.railway.app`)

---

### Step 3: Deploy Frontend on Vercel (5 minutes)

1. **Go to**: https://vercel.com
2. **Sign in** with GitHub
3. **Click** "Add New" → "Project"
4. **Select** your `inventory-demo` repo
5. **Configure**:
   - Framework Preset: **Create React App**
   - Root Directory: `frontend`
   - Environment Variables:

```
REACT_APP_API_URL=https://inventory-backend.railway.app
REACT_APP_WS_URL=wss://inventory-backend.railway.app/ws
```

6. **Click Deploy**
7. **Copy Frontend URL** (e.g., `https://inventory-demo.vercel.app`)

---

### Step 4: Import Database (3 minutes)

```powershell
# Export your local database
mysqldump -u root -pZafaryaqoob.com786 storeflow > database_export.sql

# Get Railway MySQL credentials from Railway dashboard
# Import using MySQL Workbench or command:
mysql -h [railway-host] -u [railway-user] -p [railway-database] < database_export.sql
```

---

### Step 5: Update CORS (2 minutes)

Edit `backend/src/index.js` and update CORS:

```javascript
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://inventory-demo.vercel.app'  // Your Vercel URL
    ],
    credentials: true
}));
```

Push update:

```powershell
git add .
git commit -m "Update CORS"
git push
```

Railway auto-deploys!

---

## ✅ Done! Share with Client

**Your URLs:**
- 🌐 **Frontend**: `https://inventory-demo.vercel.app`
- 🔌 **Backend**: `https://inventory-backend.railway.app`

**Test Credentials:**
- Username: `testowner`
- Password: `test123`

---

## 💡 Tips

1. **Free Tier Limits**:
   - Railway: 500 hours/month (20 days full uptime)
   - Vercel: Unlimited

2. **Keep Services Active**:
   - Railway may sleep after 15 min inactivity
   - First request wakes it up (takes 10-20 seconds)
   - Set up UptimeRobot.com for free pinging

3. **When to Delete**:
   - After client approval, move to Hostinger
   - Delete Railway/Vercel services to stop usage

---

## 🆘 Quick Troubleshooting

**Backend not responding?**
- Check Railway logs
- Verify environment variables
- Ensure MySQL database is running

**Frontend can't connect?**
- Verify REACT_APP_API_URL is correct
- Check CORS settings in backend
- Clear browser cache

**Database empty?**
- Re-import database_export.sql
- Check Railway MySQL connection

---

**Total Time**: 15-20 minutes  
**Cost**: FREE  
**Perfect for**: Client demos & testing

🚀 **You're live!**
