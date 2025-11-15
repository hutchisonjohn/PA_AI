# Setup ADB port forwarding for Android emulator
Write-Host "Setting up ADB port forwarding..." -ForegroundColor Green
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082
Write-Host "Port forwarding setup complete!" -ForegroundColor Green
Write-Host "You can now run: npm run android" -ForegroundColor Yellow

