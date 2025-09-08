@echo off
chcp 65001 >nul
echo 🚀 Starting EdUTEND Deployment Process...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Not in a git repository. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    echo    git remote add origin ^<your-github-repo-url^>
    pause
    exit /b 1
)

REM Check if we have a remote origin
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ No remote origin found. Please add your GitHub repository:
    echo    git remote add origin ^<your-github-repo-url^>
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git remote get-url origin') do set REMOTE_URL=%%i
echo ✅ Git repository found: %REMOTE_URL%

REM Check if we have uncommitted changes
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    echo ⚠️  You have uncommitted changes. Please commit them first:
    echo    git add .
    echo    git commit -m "Update before deployment"
    pause
    exit /b 1
)

echo ✅ All changes are committed

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    pause
    exit /b 1
)

echo ✅ Successfully pushed to GitHub
echo.
echo 🎯 Next Steps:
echo 1. Deploy your backend to Railway:
echo    - Go to https://railway.app/
echo    - Connect your GitHub repository
echo    - Set environment variables ^(see DEPLOYMENT.md^)
echo.
echo 2. Deploy your frontend to Netlify:
echo    - Go to https://netlify.com/
echo    - Connect your GitHub repository
echo    - Update js/config.production.js with your backend URL
echo.
echo 3. Test your deployment:
echo    - Check backend health: https://your-app.railway.app/health
echo    - Visit your frontend URL
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
pause
