@echo off
echo Setting up Clarivo Development Environment...

echo.
echo Setting up Backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo Setting up Frontend...
cd frontend
npm install
cd ..

echo.
echo Setup complete! Run 'scripts\dev.bat' to start development.
pause