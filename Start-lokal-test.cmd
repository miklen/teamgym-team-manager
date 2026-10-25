@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 exit /b 1
call npm.cmd run preview:local
if errorlevel 1 pause
