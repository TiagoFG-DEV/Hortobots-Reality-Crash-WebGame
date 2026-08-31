@echo off
title HORTOBOTS: A TORRE DIGITAL - TERMINAL VIRTUAL (QUEZAS-DOS)
color 0A
cls

echo ==============================================================================
echo    _   _  ____  ____  _____ ____  ____   ___ _____ ____  
echo   ^| ^| ^| ^|/ __ \^|  _ \^|_   _/ __ \^|  _ \ / _ \_   _/ ___^| 
echo   ^| ^|_^| ^| ^|  ^| ^| ^|_) ^| ^| ^| ^|  ^| ^| ^|_) ^| ^| ^| ^|^| ^| \___ \ 
echo   ^|  _  ^| ^|__^| ^|  _ ^<  ^| ^| ^| ^|__^| ^|  _ ^<^| ^|_^| ^|^| ^|  ___) ^|
echo   ^|_^| ^|_^|\____/^|_^| \_\ ^|_^|  \____/^|_^| \_\\___/ ^|_^| ^|____/ 
echo                      A TORRE DIGITAL DE QUEZADILHAS
echo ==============================================================================
echo.
echo  [SISTEMA] Inicializando Servidor de Terminal Retro na porta 3333...
echo  [SISTEMA] Mapeando trilhas sonoras originais e modulo CRT Blackout...
echo.

cd /d "%~dp0"

start http://localhost:3333

node server.js

pause
