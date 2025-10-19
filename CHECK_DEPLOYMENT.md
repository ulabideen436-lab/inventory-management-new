# ✅ Deployment Checklist

Use this checklist to ensure everything is working after deployment.

## 📋 Pre-Deployment Checklist

- [ ] Git installed
- [ ] GitHub account created
- [ ] Railway.app account created (via GitHub)
- [ ] Vercel account created (via GitHub)
- [ ] Database exported (`database_export.sql` created)

---

## 🔧 Backend Deployment Checklist (Railway)

- [ ] Repository connected to Railway
- [ ] MySQL database created in Railway
- [ ] Backend service root directory set to `backend`
- [ ] All environment variables added:
  - [ ] `PORT=5000`
  - [ ] `DB_HOST` (from Railway MySQL)
  - [ ] `DB_USER` (from Railway MySQL)
  - [ ] `DB_PASS` (from Railway MySQL)
  - [ ] `DB_NAME` (from Railway MySQL)
  - [ ] `JWT_SECRET` (your secret key)
  - [ ] `NODE_ENV=production`
- [ ] Backend domain generated
- [ ] Database imported successfully
- [ ] Backend health check works: `https://your-backend.railway.app/health`

---

## 🎨 Frontend Deployment Checklist (Vercel)

- [ ] Repository connected to Vercel
- [ ] Framework preset set to "Create React App"
- [ ] Root directory set to `frontend`
- [ ] Environment variables added:
  - [ ] `REACT_APP_API_URL=https://your-backend.railway.app`
  - [ ] `REACT_APP_WS_URL=wss://your-backend.railway.app/ws`
- [ ] CORS updated in backend with Vercel URL
- [ ] Changes pushed to GitHub (triggers auto-deploy)
- [ ] Frontend loads: `https://your-project.vercel.app`

---

## 🧪 Testing Checklist

### Backend Tests

Visit: `https://your-backend.railway.app`

- [ ] Health endpoint responds: `/health`
- [ ] Login endpoint works: `/api/auth/login`
- [ ] Products endpoint protected: `/api/products` (requires auth)

### Frontend Tests

Visit: `https://your-project.vercel.app`

- [ ] Page loads without errors
- [ ] Login page appears
- [ ] Test login with credentials:
  - Username: `testowner`
  - Password: `test123`
- [ ] Dashboard loads after login
- [ ] Products page loads
- [ ] Sales page loads
- [ ] POS page loads and works
- [ ] Barcode scanning works (if applicable)
- [ ] Reports generate

### Integration Tests

- [ ] Frontend connects to backend successfully
- [ ] JWT authentication works
- [ ] Database queries return data
- [ ] WebSocket connection works (real-time features)
- [ ] Images/assets load correctly
- [ ] Mobile responsive design works

---

## 🔐 Security Checklist

- [ ] `.env` file NOT committed to GitHub
- [ ] Strong JWT secret used (not default)
- [ ] Database password changed from default
- [ ] CORS restricted to frontend domain only
- [ ] GitHub repository set to PRIVATE
- [ ] Admin passwords changed in database

---

## 📊 Performance Checklist

- [ ] Backend responds in < 2 seconds
- [ ] Frontend loads in < 3 seconds
- [ ] No console errors in browser
- [ ] Railway service not sleeping (test after 20 minutes)
- [ ] WebSocket reconnects automatically

---

## 🐛 Common Issues & Solutions

### Issue: Backend returns 502 Bad Gateway
**Solution:**
- Check Railway logs for errors
- Verify environment variables are correct
- Ensure MySQL database is running

### Issue: Frontend shows "Network Error"
**Solution:**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is deployed and running

### Issue: Login fails with 401
**Solution:**
- Check database has users
- Verify JWT_SECRET is set
- Ensure passwords are hashed correctly

### Issue: Database connection failed
**Solution:**
- Use Railway's internal URL (not public)
- Check database credentials
- Verify database is running

### Issue: Railway service keeps sleeping
**Solution:**
- Upgrade to Hobby plan ($5/month)
- Use UptimeRobot.com to ping every 5 minutes
- Make regular requests from frontend

---

## 📱 Share with Client

Once all tests pass, share:

**Live URL:** `https://your-project.vercel.app`

**Test Credentials:**
```
Username: testowner
Password: test123
```

**Demo Instructions:**
1. Visit the URL
2. Login with provided credentials
3. Explore all features:
   - View products
   - Make a sale
   - Generate reports
   - Manage inventory

---

## 🎯 Post-Demo Actions

After client approval:

- [ ] Export production database from Railway
- [ ] Prepare for Hostinger deployment
- [ ] Delete Railway services (to stop usage)
- [ ] Delete Vercel project (optional)
- [ ] Archive GitHub repository

---

## 📞 Support Links

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **GitHub Docs:** https://docs.github.com

---

**Deployment Date:** _______________  
**Backend URL:** _______________  
**Frontend URL:** _______________  
**Client Shared:** _______________  

✅ **Ready for client testing!**
