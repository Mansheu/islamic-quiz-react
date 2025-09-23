# Firebase Storage CORS Configuration Script (PowerShell)
# This script sets up CORS rules for Firebase Storage to work with local development

Write-Host "🔧 Setting up Firebase Storage CORS configuration..." -ForegroundColor Cyan

# Check if Google Cloud SDK is installed
$gsutilExists = Get-Command gsutil -ErrorAction SilentlyContinue

if (-not $gsutilExists) {
    Write-Host "❌ Google Cloud SDK (gsutil) not found!" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://cloud.google.com/sdk/docs/install"
    Write-Host "2. Run: gcloud init"
    Write-Host "3. Authenticate: gcloud auth login"
    exit 1
}

# Firebase Storage bucket name
$bucketName = "islamic-quiz-app-825c0.firebasestorage.app"

Write-Host "📝 Applying CORS configuration to bucket: $bucketName" -ForegroundColor Yellow

# Apply CORS configuration
try {
    $result = gsutil cors set cors.json "gs://$bucketName" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CORS configuration applied successfully!" -ForegroundColor Green
        Write-Host "📋 Current CORS configuration:" -ForegroundColor Cyan
        gsutil cors get "gs://$bucketName"
    } else {
        Write-Host "❌ Failed to apply CORS configuration" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host "Please make sure you are authenticated and have access to the Firebase project" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error running gsutil: $_" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK and authenticate first" -ForegroundColor Yellow
}
