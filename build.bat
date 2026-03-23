@echo off
echo =======================================================
echo     Spending Plus - PyInstaller Packaging Script
echo =======================================================

echo.
echo [1/3] Kiem tra moi truong...

set PYTHON_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    set PYTHON_CMD=py
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo LOI: Khong tim thay Python. Vui long cai dat Python truoc.
        pause
        exit /b 1
    )
)

echo Dang su dung: %PYTHON_CMD%

echo.
echo [2/3] Dang build Frontend (React)...
cd frontend
cmd /c "npm run build"
if %errorlevel% neq 0 (
    echo LOI: Build Frontend that bai.
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Dang dong goi Backend (PyInstaller)...
cd backend

REM Cai dat PyInstaller
%PYTHON_CMD% -m pip install pyinstaller

REM Chay PyInstaller
%PYTHON_CMD% -m PyInstaller --name "SpendingPlus" --noconfirm --onefile --add-data "../frontend/dist;dist" --add-data ".env.example;.env.example" --hidden-import="passlib.handlers.bcrypt" --hidden-import="uvicorn.logging" --hidden-import="uvicorn.loops" --hidden-import="uvicorn.loops.auto" --hidden-import="uvicorn.protocols" --hidden-import="uvicorn.protocols.http.auto" --hidden-import="uvicorn.protocols.websockets.auto" --hidden-import="uvicorn.lifespan.on" --hidden-import="uvicorn.lifespan.off" app/main.py

if %errorlevel% neq 0 (
    echo.
    echo LOI: PyInstaller gap loi.
    cd ..
    pause
    exit /b 1
)

echo.
echo [XONG] Build thanh cong!
echo File .exe nam tai: backend/dist/SpendingPlus.exe
echo.
cd ..
pause
