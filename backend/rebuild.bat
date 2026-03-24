@echo off
echo Installing requirements...
python -m pip install -r ..\requirements.txt
if %errorlevel% neq 0 exit /b %errorlevel%

echo Installing pyinstaller...
python -m pip install pyinstaller
if %errorlevel% neq 0 exit /b %errorlevel%

echo Building PyInstaller executable...
python -m PyInstaller --name "SpendingPlus" --noconfirm --onefile --add-data "../frontend/dist;dist" --add-data ".env.example;.env.example" --hidden-import="passlib.handlers.bcrypt" --hidden-import="uvicorn.logging" --hidden-import="uvicorn.loops" --hidden-import="uvicorn.loops.auto" --hidden-import="uvicorn.protocols" --hidden-import="uvicorn.protocols.http.auto" --hidden-import="uvicorn.protocols.websockets.auto" --hidden-import="uvicorn.lifespan.on" --hidden-import="uvicorn.lifespan.off" --hidden-import="truststore" --hidden-import="certifi" app/main.py
if %errorlevel% neq 0 exit /b %errorlevel%

echo Build finished successfully!
