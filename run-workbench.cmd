@echo off
set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"
if not exist "dist\index.html" (
  echo First run needs a build. Building now...
  npm.cmd run build
)
start "" "%APP_DIR%\node_modules\electron\dist\electron.exe" "%APP_DIR%"
