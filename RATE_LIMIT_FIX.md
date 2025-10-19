# 🚨 Rate Limit Issue - Quick Fix Guide

## Problem
The authentication tests are hitting rate limits (429 error) because we've tested login too many times.

**Rate Limit:** 20 login attempts per 15 minutes per IP address

---

## ✅ Solution Options

### **Option 1: Restart Backend (Fastest - 30 seconds)**

This resets all rate limits immediately.

#### Windows PowerShell:
```powershell
# 1. Find and stop Node.js backend process
Get-Process node | Where-Object {$_.MainWindowTitle -like "*backend*"} | Stop-Process -Force

# 2. Restart backend
cd "d:\Inventory managment\backend"
npm start
```

#### Using Task Manager:
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find "Node.js" processes
3. End the backend server process
4. Run: `cd "d:\Inventory managment\backend" && npm start`

---

### **Option 2: Wait 15 Minutes**

Rate limits automatically reset after 15 minutes. Then run:
```powershell
cd "d:\Inventory managment\backend"
node test-system.js
```

---

### **Option 3: Increase Rate Limit (Development Only)**

**⚠️ Only for development/testing! Don't use in production.**

Edit `backend/src/middleware/auth.js`:

**Change line 8 from:**
```javascript
max: 20, // limit each IP to 20 login attempts per 15 minutes
```

**To:**
```javascript
max: 100, // Increased for testing
```

Then restart backend.

---

## 🎯 Recommended: Quick Restart Script

### Create `quick-restart-backend.bat`:
```batch
@echo off
echo Stopping backend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo Starting backend...
cd backend
start "Backend Server" cmd /k "npm start"

echo.
echo Backend restarted! Wait 5 seconds for it to be ready.
timeout /t 5 /nobreak > nul

echo.
echo Running tests...
node test-system.js
```

### Run it:
```powershell
cd "d:\Inventory managment"
.\quick-restart-backend.bat
```

---

## 📊 After Restart - Expected Results

Once backend is restarted and rate limits are reset:

```
✅ Authentication Tests: 2/2 passed
✅ API Tests: 4/4 passed  
✅ Customer Tests: 4/4 passed
✅ Product Tests: 4/4 passed
✅ Sales Tests: 6/6 passed
✅ Supplier Tests: 2/2 passed

🎉 TOTAL: 29/29 passed (100.0%)
```

---

## 🔍 Verify Rate Limit is the Issue

Run this to check:
```powershell
cd "d:\Inventory managment\backend"
node get-test-token.js
```

If you see "429" error, it confirms rate limiting.

---

## 💡 Prevention for Future

### For Testing:
Add delay between test runs:
```javascript
// Wait 2-3 seconds between login attempts
await new Promise(resolve => setTimeout(resolve, 2000));
```

### For Development:
Use environment-based rate limits:
```javascript
max: process.env.NODE_ENV === 'test' ? 1000 : 20
```

---

## ⚡ Quick Command Summary

```powershell
# Stop backend (PowerShell)
Get-Process node | Stop-Process -Force

# Or use Ctrl+C in backend terminal

# Restart backend
cd "d:\Inventory managment\backend"
npm start

# Wait 5 seconds, then run tests
node test-system.js
```

---

**Status:** Rate limit hit after multiple test runs  
**Solution:** Restart backend server  
**Time:** 30 seconds  
**Expected Result:** 100% test pass rate
