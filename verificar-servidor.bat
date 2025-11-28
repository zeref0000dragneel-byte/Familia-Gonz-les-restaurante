@echo off
title Verificar Servidor - Comedor Gonzales
color 0B

echo ================================================
echo   VERIFICACION DEL SERVIDOR
echo ================================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo Directorio actual: %CD%
echo.

echo Verificando archivos necesarios...
echo.

if exist "index.html" (
    echo [OK] index.html encontrado
) else (
    echo [ERROR] index.html NO encontrado
)

if exist "app.js" (
    echo [OK] app.js encontrado
) else (
    echo [ERROR] app.js NO encontrado
)

if exist "estilos.css" (
    echo [OK] estilos.css encontrado
) else (
    echo [ERROR] estilos.css NO encontrado
)

if exist "manifest.json" (
    echo [OK] manifest.json encontrado
) else (
    echo [ERROR] manifest.json NO encontrado
)

if exist "licencias.js" (
    echo [OK] licencias.js encontrado
) else (
    echo [ERROR] licencias.js NO encontrado
)

if exist "login.js" (
    echo [OK] login.js encontrado
) else (
    echo [ERROR] login.js NO encontrado
)

if exist "service-worker.js" (
    echo [OK] service-worker.js encontrado
) else (
    echo [ERROR] service-worker.js NO encontrado
)

echo.
echo ================================================
echo   INSTRUCCIONES
echo ================================================
echo.
echo 1. Detén el servidor actual (Ctrl+C)
echo 2. Ejecuta: iniciar-servidor.bat
echo 3. O ejecuta manualmente:
echo    python -m http.server 8000
echo.
echo ================================================
echo.

pause

