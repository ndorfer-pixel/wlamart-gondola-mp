@echo off
cd /d "%~dp0"

echo Iniciando servidor de archivos (puerto 8753)...
start "walmart_gondola_mp - servidor archivos" cmd /k "py -m http.server 8753"

echo Esperando a que levante el servidor...
timeout /t 2 /nobreak >nul

echo Abriendo la app en el navegador...
start "" "http://localhost:8753/index.html"
