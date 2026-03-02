@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo [1/2] 의존성 설치 중...
call npm install --silent

echo [2/2] 서버 시작 중...
node server.js
pause
