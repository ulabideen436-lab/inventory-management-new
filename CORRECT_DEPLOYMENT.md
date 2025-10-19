# ✅ CORRECT Vercel Deployment Steps

## 🎯 Deploy Frontend Only on Vercel

Since Vercel is having issues with the full-stack setup, let's deploy **frontend only** on Vercel and use **Render.com for backend**.

---

## 📋 Step 1: Configure Vercel Correctly

1. **Go to Vercel Dashboard**
2. **Delete the current project** (if it exists and keeps failing)
3. Click **"Add New"** → **"Project"**
4. Select `ulabideen436-lab/inventory-management-demo`

### **Import Settings:**

| Setting | Value |
|---------|-------|
| **Framework Preset** | Create React App |
| **Root Directory** | `frontend` ← **CRITICAL!** |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install --legacy-peer-deps` |

### **Environment Variables:**

Add these (leave values empty for now):

```
REACT_APP_API_URL=
REACT_APP_WS_URL=
```

### **Click Deploy**

---

## 📋 Step 2: Deploy Backend on Render.com

While Vercel builds:

1. **Go to:** https://render.com
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select `ulabideen436-lab/inventory-management-demo`

### **Settings:**

| Setting | Value |
|---------|-------|
| **Name** | inventory-backend |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### **Environment Variables:**

Get Railway MySQL credentials and add:

```
PORT=5000
NODE_ENV=production
JWT_SECRET=b13cdabd569515d19c0a5977a530ad6b6a0dcaab319ebc0ee5be742cb8e527c8
DB_HOST=<from Railway MySQL>
DB_PORT=<from Railway MySQL>
DB_USER=<from Railway MySQL>
DB_PASSWORD=<from Railway MySQL>
DB_NAME=<from Railway MySQL>
```

### **Click "Create Web Service"**

---

## 📋 Step 3: Connect Frontend to Backend

After both deploy:

1. **Copy Render backend URL** (e.g., `https://inventory-backend.onrender.com`)
2. **Go to Vercel** → Your project → **"Settings"** → **"Environment Variables"**
3. **Update:**
   - `REACT_APP_API_URL` = `https://inventory-backend.onrender.com`
   - `REACT_APP_WS_URL` = `wss://inventory-backend.onrender.com/ws`
4. **Redeploy** frontend

---

## 📋 Step 4: Update CORS

In your code, update `backend/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
}));
```

Push to GitHub - Render will auto-redeploy!

---

## ✅ This Setup Works Because:

- ✅ **Vercel** = Static React app (what it's designed for)
- ✅ **Render** = Node.js backend (free tier supports it)
- ✅ **Railway** = MySQL database (already working)

**Total Cost: $0** 🎉

---

**Want me to help you deploy to Render.com instead?**
