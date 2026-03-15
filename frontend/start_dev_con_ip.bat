@echo off
if exist "%TEMP%\avila_ip.txt" (
    for /f %%i in (%TEMP%\avila_ip.txt) do set VITE_API_HOST=http://%%i:8000
) else (
    set VITE_API_HOST=http://localhost:8000
)
npm run dev
