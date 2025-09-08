Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    EdUTEND System Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting the server on port 5501..." -ForegroundColor Green
Write-Host ""
Write-Host "If you see any errors, make sure you have:" -ForegroundColor Yellow
Write-Host "1. Node.js installed (version 14 or higher)" -ForegroundColor Yellow
Write-Host "2. Run 'npm install' to install dependencies" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "🚀 Starting server..." -ForegroundColor Green
npm start
