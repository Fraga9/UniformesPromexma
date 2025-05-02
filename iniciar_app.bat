@echo off
chcp 65001 > nul
title ⚡ INICIANDO SISTEMA PROMEXMA 2083 ⚡
color 0a

setlocal ENABLEDELAYEDEXPANSION

REM Función de "escritura lenta"
set "delay=10"
for %%A in (
    "Conectando a la red central de PROMEXMA..."
    "Autenticando operador: RG-Z3R0x"
    "Estableciendo conexión segura [AES-256]..."
    "Inyectando protocolos de arranque..."
    "Decodificando módulos reactivos..."
    "Cargando paquetes térmicos..."
    "Accediendo a nodo: BACKEND-CORE-FASTAPI..."
    "Sincronizando visor quantum del frontend..."
) do (
    set "line=%%~A"
    call :typeSlow "!line!"
    timeout /t 1 >nul
)

echo.
echo ███████╗██████╗  ██████╗ ███╗   ███╗███████╗██╗  ██╗███╗   ███╗ █████╗ 
echo ██╔════╝██╔══██╗██╔═══██╗████╗ ████║██╔════╝██║  ██║████╗ ████║██╔══██╗
echo █████╗  ██████╔╝██║   ██║██╔████╔██║█████╗  ███████║██╔████╔██║███████║
echo ██╔══╝  ██╔═══╝ ██║   ██║██║╚██╔╝██║██╔══╝  ██╔══██║██║╚██╔╝██║██╔══██║
echo ███████╗██║     ╚██████╔╝██║ ╚═╝ ██║███████╗██║  ██║██║ ╚═╝ ██║██║  ██║
echo ╚══════╝╚═╝      ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝
echo ---------------------------------------------------------------------
echo                Sistema Uniformes Promexma - Fase de Arranque
echo.

timeout /t 1 >nul

REM Lanzar Backend
echo [🛠] Iniciando Backend: FASTAPI + UVICORN...
start "⚙ BACKEND - FastAPI" cmd.exe /c "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload"

timeout /t 2 >nul

REM Lanzar Frontend
echo [⚡] Iniciando Frontend: VITE + REACT...
start "⚡ FRONTEND - Vite React" cmd.exe /c "cd frontend && npm run dev"

timeout /t 1 >nul

REM Mensaje final
echo.
echo [✔] Todos los sistemas en línea.
echo 🔗 API disponible en: http://127.0.0.1:8000/docs
echo 🔗 Frontend en: http://127.0.0.1:5173
echo.
pause
exit /b

:typeSlow
setlocal
set "str=%~1"
set "len=0"
:loop
set "char=!str:~%len%,1!"
if "!char!"=="" goto :eof
<nul set /p=!char!
ping -n 1 127.0.0.1 >nul
set /a len+=1
goto loop
