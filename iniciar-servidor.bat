@echo off
title Sistema Restaurante - Comedor Gonzales
color 0A

REM Cambiar al directorio del script
cd /d "%~dp0"

echo ================================================
echo   SISTEMA DE RESTAURANTE - COMEDOR GONZALES
echo ================================================
echo.
echo Directorio actual: %CD%
echo.
echo [1/2] Verificando archivos...
echo.

REM Verificar que los archivos existan
if not exist "index.html" (
    echo ERROR: No se encuentra index.html
    echo Asegurate de ejecutar este script desde el directorio del proyecto
    pause
    exit /b 1
)

if not exist "app.js" (
    echo ERROR: No se encuentra app.js
    pause
    exit /b 1
)

if not exist "estilos.css" (
    echo ERROR: No se encuentra estilos.css
    pause
    exit /b 1
)

if not exist "manifest.json" (
    echo ERROR: No se encuentra manifest.json
    pause
    exit /b 1
)

echo [2/2] Iniciando servidor local en puerto 8000...
echo.

REM Iniciar servidor Python
python -m http.server 8000

REM Si llegamos aquí, el servidor se detuvo
pause