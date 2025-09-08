Write-Host "Starting EdUTEND Backend Server..." -ForegroundColor Green
Write-Host ""

Set-Location backend

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Starting server on port 5000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Health check will be available at: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "API endpoints will be available at: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

npm start
