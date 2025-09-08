@echo off
echo Starting EdUTEND Backend Server...
echo.

cd backend

echo Installing dependencies...
npm install

echo.
echo Starting server on port 5000...
echo.
echo Health check will be available at: http://localhost:5000/health
echo API endpoints will be available at: http://localhost:5000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
