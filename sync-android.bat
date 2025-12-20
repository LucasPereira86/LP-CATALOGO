@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d c:\Users\Cliente\.gemini\antigravity\scratch\lp-catalogos
call npx cap sync android
echo Sync complete!
