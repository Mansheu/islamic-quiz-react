Write-Host "Setting up Firebase Storage CORS..." -ForegroundColor Cyan

# Check if gsutil exists
$gsutil = Get-Command gsutil -ErrorAction SilentlyContinue

if (-not $gsutil) {
    Write-Host "Google Cloud SDK not found. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set CORS
Write-Host "Applying CORS configuration..." -ForegroundColor Yellow
gsutil cors set cors.json gs://islamic-quiz-app-825c0.firebasestorage.app

Write-Host "Done!" -ForegroundColor Green
