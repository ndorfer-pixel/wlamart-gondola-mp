@echo off
cd /d "%~dp0"

echo Iniciando servidor de archivos (puerto 8753)...
start "walmart_gondola_mp - servidor archivos" cmd /k "py -m http.server 8753"

echo Iniciando proxy de Roboflow (puerto 8754)...
start "walmart_gondola_mp - proxy Roboflow" cmd /k "py proxy_roboflow.py"

echo Esperando a que levanten los servidores...
timeout /t 2 /nobreak >nul

echo Abriendo la app en el navegador...
start "" "http://localhost:8753/index.html"
