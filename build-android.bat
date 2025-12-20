@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d c:\Users\Cliente\.gemini\antigravity\scratch\lp-catalogos
call npx cap init "LP CATALOGOS" "com.sane.lpcatalogos" --web-dir "."
call npx cap add android
call npx cap sync
echo Done!
pause
