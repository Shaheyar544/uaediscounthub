@echo off
setlocal
title UAE Discount Hub Launcher

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found. Install Node.js LTS, then run this launcher again.
  echo https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo.
  echo Project dependencies are not installed yet.
  echo Run "npm install" in this folder once, then launch again.
  pause
  exit /b 1
)

echo Starting UAE Discount Hub locally...
rem Give Next.js a moment to start, then open the local site in the default browser.
start "UAE Discount Hub Browser" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

rem Keep this window open while the development server runs. Press Ctrl+C to stop it.
call npm run dev

endlocal
