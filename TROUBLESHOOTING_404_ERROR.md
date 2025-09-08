# 🔧 Troubleshooting HTTP 404: Not Found Error

## Problem Description
The frontend is receiving HTTP 404: Not Found errors when trying to connect to the backend API endpoints.

## Root Cause Analysis
The main issue was a **port mismatch** between frontend and backend:
- **Backend server** runs on port `5000` (as configured in `backend/server.js`)
- **Frontend config** was trying to connect to port `5501` (as configured in `js/config.js`)

## ✅ **Fixes Applied**

### 1. **Fixed Port Configuration**
- Updated `js/config.js` to use port `5000` instead of `5501`
- Changed `BASE_URL` from `http://localhost:5501/api` to `http://localhost:5000/api`
- Changed `SOCKET_CONFIG.URL` from `http://localhost:5501` to `http://localhost:5000`

### 2. **Added Missing API Endpoints**
- Added `CHANGE_PASSWORD: '/auth/change-password'` to AUTH endpoints
- Updated `CREATE: '/courses/create'` for the new GET method

### 3. **Created Test Tools**
- `test-backend-connection.html` - Comprehensive backend connectivity test
- `start-backend.bat` - Windows batch file to start backend
- `start-backend.ps1` - PowerShell script to start backend

## 🚀 **Steps to Fix the 404 Error**

### Step 1: Start the Backend Server
```bash
# Option 1: Use the batch file (Windows)
start-backend.bat

# Option 2: Use PowerShell (Windows)
.\start-backend.ps1

# Option 3: Manual start
cd backend
npm install
npm start
```

### Step 2: Verify Backend is Running
1. Open `test-backend-connection.html` in your browser
2. Click "Test Health Check" button
3. You should see: `✅ Health Check Successful!`

### Step 3: Test API Endpoints
1. In the same test page, click "Test API Endpoints"
2. All endpoints should show `✅` status
3. If any show `❌`, check the backend logs

### Step 4: Test Frontend
1. Open `index.html` in your browser
2. Try to register a new user
3. Try to login with existing credentials
4. Check browser console for any errors

## 🔍 **Diagnostic Commands**

### Check if Backend is Running
```bash
# Check if port 5000 is listening
netstat -an | findstr :5000

# Test health endpoint
curl http://localhost:5000/health
```

### Check Backend Logs
```bash
# Look for startup messages
cd backend
npm start
```

### Check Frontend Configuration
1. Open browser console
2. Type: `console.log(API_CONFIG.BASE_URL)`
3. Should show: `http://localhost:5000/api`

## 🚨 **Common Issues and Solutions**

### Issue 1: "Backend server is not running"
**Solution:**
1. Navigate to `backend` folder
2. Run `npm install` to install dependencies
3. Run `npm start` to start server
4. Verify server starts on port 5000

### Issue 2: "CORS error"
**Solution:**
1. Check backend CORS configuration in `backend/server.js`
2. Ensure `FRONTEND_URL` environment variable is set correctly
3. Backend should allow requests from `http://localhost:3000` (or your frontend port)

### Issue 3: "Port already in use"
**Solution:**
1. Find process using port 5000: `netstat -ano | findstr :5000`
2. Kill the process: `taskkill /PID <PID> /F`
3. Restart backend server

### Issue 4: "Database connection failed"
**Solution:**
1. Check MongoDB connection in `backend/config/database.js`
2. Ensure MongoDB is running
3. Check environment variables in `.env` file

## 📋 **Verification Checklist**

- [ ] Backend server starts without errors
- [ ] Health check endpoint responds: `http://localhost:5000/health`
- [ ] API base endpoint accessible: `http://localhost:5000/api`
- [ ] Frontend config shows correct port: `5000`
- [ ] No CORS errors in browser console
- [ ] Registration form works
- [ ] Login form works
- [ ] All GET endpoints respond correctly

## 🔧 **Advanced Troubleshooting**

### Check Environment Variables
```bash
# In backend folder
echo %MONGODB_URI%
echo %JWT_SECRET%
echo %FRONTEND_URL%
```

### Check Network Configuration
```bash
# Test localhost connectivity
ping localhost

# Test port accessibility
telnet localhost 5000
```

### Check File Permissions
```bash
# Ensure backend files are readable
dir backend
dir backend\routes
```

## 📞 **Getting Help**

If you're still experiencing issues:

1. **Check the test page**: `test-backend-connection.html`
2. **Review backend logs** for error messages
3. **Check browser console** for frontend errors
4. **Verify all files** are in correct locations
5. **Ensure dependencies** are installed: `npm install`

## 🎯 **Expected Results**

After applying the fixes:
- ✅ Backend server runs on port 5000
- ✅ Health check responds successfully
- ✅ All API endpoints are accessible
- ✅ Frontend connects without 404 errors
- ✅ Registration and login work correctly
- ✅ GET endpoints function as expected

The 404 error should be completely resolved once the port configuration is corrected and the backend server is running.
