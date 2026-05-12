# Start Services WITHOUT Kafka (for testing gRPC only)
Write-Host "🚀 Starting Mini-Inventory (gRPC Testing Mode - No Kafka)" -ForegroundColor Cyan

# Start Docker services (MongoDB, Redis only)
Write-Host "`n📦 Starting Docker containers (MongoDB + Redis)..." -ForegroundColor Yellow
docker-compose -f docker-compose.minimal.yml up -d

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Auth Service
Write-Host "`n🔐 Starting Auth Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\services\auth-service'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start API Gateway
Write-Host "🌐 Starting API Gateway..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\api-gateway'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start Inventory Service
Write-Host "📦 Starting Inventory Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\services\inventory-service'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start Notification Service (with Kafka disabled)
Write-Host "🔔 Starting Notification Service (gRPC only)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\services\notification-service'; `$env:SKIP_KAFKA='true'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "💻 Starting Frontend..." -ForegroundColor Green
$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$clientPath'; npm run dev"

Write-Host "`n✅ All services started!" -ForegroundColor Cyan
Write-Host "`n📍 Service URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "   API Gateway:  http://localhost:3000" -ForegroundColor White
Write-Host "   Auth Service: http://localhost:4001" -ForegroundColor White
Write-Host "   Inventory:    http://localhost:4002" -ForegroundColor White
Write-Host "   Notification: gRPC on localhost:50051" -ForegroundColor White
Write-Host "`n⚠️  Kafka is DISABLED for this test" -ForegroundColor Yellow
Write-Host "   Notifications will work via gRPC only" -ForegroundColor Yellow
Write-Host "`n🎉 Ready to test gRPC notifications!" -ForegroundColor Green
