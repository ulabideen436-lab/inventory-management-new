# 🚀 Deploy on Vercel - Complete Guide

## 🎯 What We're Deploying

- **Frontend:** React app (from `/frontend` folder)
- **Backend:** Node.js API (serverless functions)
- **Database:** Railway MySQL (already running!)

---

## 📋 Step-by-Step Instructions

### **Step 1: Push Latest Changes**

```powershell
cd "d:\Inventory managment"
git add .
git commit -m "Add Vercel deployment configuration"
git push
```

---

### **Step 2: Deploy on Vercel**

1. **Go to:** https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select your repository: `ulabideen436-lab/inventory-management-demo`

---

### **Step 3: Configure Project**

**Framework Preset:** Create React App  
**Root Directory:** `frontend`  
**Build Command:** `npm run build`  
**Output Directory:** `build`  
**Install Command:** `npm install`

---

### **Step 4: Add Environment Variables**

Click **"Environment Variables"** and add these:

#### **Railway MySQL Credentials** (Get from Railway Dashboard):

```
DB_HOST
```
Value: (from Railway MySQL - Variables tab - MYSQLHOST)

```
DB_PORT
```
Value: (from Railway MySQL - Variables tab - MYSQLPORT)

```
DB_USER
```
Value: (from Railway MySQL - Variables tab - MYSQLUSER)

```
DB_PASSWORD
```
Value: (from Railway MySQL - Variables tab - MYSQLPASSWORD)

```
DB_NAME
```
Value: (from Railway MySQL - Variables tab - MYSQLDATABASE)

#### **Other Variables:**

```
JWT_SECRET
```
Value: `b13cdabd569515d19c0a5977a530ad6b6a0dcaab319ebc0ee5be742cb8e527c8`

```
NODE_ENV
```
Value: `production`

```
PORT
```
Value: `5000`

```
REACT_APP_API_URL
```
Value: (leave empty for now, we'll add after first deploy)

```
REACT_APP_WS_URL
```
Value: (leave empty for now, we'll add after first deploy)

---

### **Step 5: Deploy**

1. Click **"Deploy"**
2. Wait 3-5 minutes for build
3. **Copy your Vercel URL** (e.g., `https://inventory-management-demo.vercel.app`)

---

### **Step 6: Update Frontend Environment Variables**

After deployment:

1. Go to **Project Settings** → **Environment Variables**
2. Update these variables:

```
REACT_APP_API_URL
```
Value: `https://your-app.vercel.app/api`

```
REACT_APP_WS_URL
```
Value: `wss://your-app.vercel.app/ws`

3. **Redeploy** (go to Deployments → click ⋯ → Redeploy)

---

### **Step 7: Update CORS in Backend**

Update `backend/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'  // Add your Vercel URL
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

Then:
```powershell
git add .
git commit -m "Update CORS for Vercel"
git push
```

Vercel will auto-redeploy!

---

## 🎉 Testing Your App

1. Visit: `https://your-app.vercel.app`
2. Login with:
   - Username: `testowner`
   - Password: `test123`
3. Test all features!

---

## 🔧 Troubleshooting

### **Frontend loads but API doesn't work:**
- Check environment variables in Vercel dashboard
- Verify REACT_APP_API_URL is correct
- Check browser console for errors

### **Database connection fails:**
- Verify Railway MySQL credentials in Vercel
- Make sure Railway MySQL is running
- Check database connection from Railway dashboard

### **CORS errors:**
- Update CORS origin in backend/src/index.js
- Push changes to GitHub
- Wait for Vercel auto-deploy

---

## 💰 Costs

- **Vercel:** FREE (Hobby plan)
- **Railway MySQL:** FREE (500 hours/month)
- **Total:** $0 for demo period!

---

## ⏭️ After Client Approval

Move to Hostinger:
1. Export database from Railway
2. Download code from GitHub
3. Deploy on Hostinger with custom domain
4. Delete Vercel + Railway services

---

**Ready to deploy!** 🚀

Let me know when you've deployed and I'll help with any issues!
