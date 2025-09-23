#!/bin/bash

# Firebase Storage CORS Configuration Script
# This script sets up CORS rules for Firebase Storage to work with local development

echo "🔧 Setting up Firebase Storage CORS configuration..."

# Check if Google Cloud SDK is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Google Cloud SDK (gsutil) not found!"
    echo "Please install Google Cloud SDK:"
    echo "1. Download from: https://cloud.google.com/sdk/docs/install"
    echo "2. Run: gcloud init"
    echo "3. Authenticate: gcloud auth login"
    exit 1
fi

# Firebase Storage bucket name
BUCKET_NAME="islamic-quiz-app-825c0.firebasestorage.app"

echo "📝 Applying CORS configuration to bucket: $BUCKET_NAME"

# Apply CORS configuration
gsutil cors set cors.json gs://$BUCKET_NAME

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    echo "📋 Current CORS configuration:"
    gsutil cors get gs://$BUCKET_NAME
else
    echo "❌ Failed to apply CORS configuration"
    echo "Please make sure you're authenticated and have access to the Firebase project"
fi
