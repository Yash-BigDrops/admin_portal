# Test Everflow API endpoints using PowerShell/curl
# Based on: https://developers.everflow.io/docs/network/advertisers/#find-all

$API_KEY = "G5sv3yETjSgLmVcfB6Q"
$BASE_URL = "https://api.eflow.team/v1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Everflow API Endpoints" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Affiliates Offers Runnable
Write-Host "1. Testing: /affiliates/offersrunnable" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BASE_URL}/affiliates/offersrunnable" `
        -Method GET `
        -Headers @{
            "X-Eflow-API-Key" = $API_KEY
            "Content-Type" = "application/json"
        } -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Affiliates All Offers
Write-Host "2. Testing: /affiliates/alloffers" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BASE_URL}/affiliates/alloffers" `
        -Method GET `
        -Headers @{
            "X-Eflow-API-Key" = $API_KEY
            "Content-Type" = "application/json"
        } -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Network Offers Table (POST)
Write-Host "3. Testing: /networks/offerstable" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $body = @{
        filters = @{
            offer_status = "active"
        }
        sort_by = @{
            column = "created"
            order = "desc"
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "${BASE_URL}/networks/offerstable?page=1&page_size=1000" `
        -Method POST `
        -Headers @{
            "X-Eflow-API-Key" = $API_KEY
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Network Offers (based on docs structure)
Write-Host "4. Testing: /networks/offers" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BASE_URL}/networks/offers" `
        -Method GET `
        -Headers @{
            "X-Eflow-API-Key" = $API_KEY
            "Content-Type" = "application/json"
        } -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Affiliates Offers (simpler endpoint)
Write-Host "5. Testing: /affiliates/offers" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BASE_URL}/affiliates/offers" `
        -Method GET `
        -Headers @{
            "X-Eflow-API-Key" = $API_KEY
            "Content-Type" = "application/json"
        } -ErrorAction Stop
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

