@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════╗
echo ║    💕 情侣网站 — 一键部署        ║
echo ╚══════════════════════════════════╝
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装：https://nodejs.org
    pause
    exit /b 1
)

:: 检查 ngrok
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 ngrok，请先下载：https://ngrok.com/download
    pause
    exit /b 1
)

:: 安装依赖
if not exist "node_modules\" (
    echo 📦 首次运行，安装依赖中...
    call npm install
)

:: 启动 Node 服务（新窗口）
echo 🚀 启动 Web 服务...
start "Love Server" cmd /c "node server.js & pause"

:: 等待服务启动
timeout /t 2 /nobreak >nul

:: 启动 ngrok 内网穿透（新窗口）
echo 🌐 启动内网穿透...
start "Ngrok Tunnel" cmd /c "ngrok http 3000 --log=stdout"

:: 等待 ngrok 就绪
timeout /t 3 /nobreak >nul

:: 获取 ngrok 公网地址
echo.
echo ⏳ 获取公网地址...
node -e "
const http = require('http');
const MAX_ATTEMPTS = 5;
function tryFetch(attempt) {
  http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try {
        const tunnels = JSON.parse(data).tunnels || [];
        const url = tunnels.find(t => t.public_url?.startsWith('https'))?.public_url || tunnels[0]?.public_url;
        if (url) {
          console.log('🌍 公网地址: ' + url);
        } else if (attempt < MAX_ATTEMPTS) {
          setTimeout(() => tryFetch(attempt+1), 2000);
        } else {
          console.log('⚠️  获取超时，请查看 Ngrok Tunnel 窗口');
        }
      } catch { console.log('⚠️  获取失败，请查看 Ngrok Tunnel 窗口'); }
    });
  }).on('error', () => {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => tryFetch(attempt+1), 2000);
    } else {
      console.log('⚠️  获取超时，请查看 Ngrok Tunnel 窗口');
    }
  });
}
tryFetch(0);
"

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✅  部署完成！                        ║
echo ║  把下面的公网地址发给你的朋友吧 💕      ║
echo ║                                        ║
echo ║  📍 本地地址: http://localhost:3000    ║
echo ╚════════════════════════════════════════╝
echo.
echo 按任意键关闭所有服务...
pause >nul

:: 清理：关闭服务
echo.
echo 🛑 正在关闭服务...
taskkill /fi "WindowTitle eq Love Server" /f >nul 2>nul
taskkill /fi "WindowTitle eq Ngrok Tunnel" /f >nul 2>nul
echo ✅ 已关闭所有服务
timeout /t 1 /nobreak >nul
