#!/bin/bash

echo "========================================"
echo " Servidor Local para PWA"
echo "========================================"
echo ""
echo "Iniciando servidor en http://localhost:8000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""
echo "Abre en tu navegador:"
echo "http://localhost:8000/index.html"
echo ""
echo "========================================"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000

