# Phase 2 - Start Services Script
# Run this script to start all Phase 2 services

Write-Host "🚀 Starting Mini-Inventory Phase 2 Services..." -ForegroundColor Green
Write-Host ""

# Start Auth Service
Write-Host "📍 Starting Auth Service (Port 4001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\vyask\Desktop\Invetory\services\auth-service'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 2

# Start API Gateway
Write-Host "📍 Starting API Gateway (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\vyask\Desktop\Invetory\api-gateway'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "📍 Starting React Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\vyask\Desktop\Invetory\client'; npm run dev"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access the application:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "   Auth Service: http://localhost:4001" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Admin: admin@inventory.com / password123" -ForegroundColor White
Write-Host "   Customer: customer@test.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
