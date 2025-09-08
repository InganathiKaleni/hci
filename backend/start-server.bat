@echo off
cd /d "%~dp0"
start "EdUTEND Backend Server" /B node server.js
echo Backend server started in background on port 5501
pause
