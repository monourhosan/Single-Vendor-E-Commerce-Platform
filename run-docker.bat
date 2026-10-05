@echo off
echo ===================================================
echo   ShopLagbe E-Commerce - Starting Complete Stack
echo ===================================================
echo.

docker compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker failed to start. Please make sure Docker Desktop is installed and running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Waiting 5 seconds for PostgreSQL and Redis services to initialize...
timeout /t 5 /nobreak >nul

echo Running database migrations and seeding demo catalog...
docker compose exec php php artisan migrate --seed --force

echo.
echo ===================================================
echo   ShopLagbe Stack is LIVE!
echo   Storefront:      http://localhost:3000
echo   Admin Portal:    http://localhost:3000/admin/login
echo   Backend API:     http://localhost:8000/api
echo ===================================================
pause
