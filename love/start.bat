@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo 💕 情侣网站启动中...
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装：https://nodejs.org
    pause
    exit /b 1
)

:: 首次运行自动安装依赖
if not exist "node_modules\" (
    echo 📦 首次运行，安装依赖中...
    npm install
    echo.
)

:: 启动服务
echo 🚀 启动服务: http://localhost:3000
echo.
start "" "http://localhost:3000"
node server.js
pause
