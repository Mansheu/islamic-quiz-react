# 🚨 Firebase Storage CORS Fix

## Problem
You're getting CORS errors when uploading profile pictures because Firebase Storage doesn't allow cross-origin requests from your local development server by default.

## Quick Solutions

### Option 1: Use Google Cloud SDK (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Follow the installation instructions for your OS

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project islamic-quiz-app-825c0
   ```

3. **Apply CORS configuration** (choose one):
   
   **On Windows PowerShell:**
   ```powershell
   .\setup-cors.ps1
   ```
   
   **On Mac/Linux:**
   ```bash
   chmod +x setup-cors.sh
   ./setup-cors.sh
   ```
   
   **Manual command:**
   ```bash
   gsutil cors set cors.json gs://islamic-quiz-app-825c0.firebasestorage.app
   ```

### Option 2: Firebase Console (Alternative)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `islamic-quiz-app-825c0`
3. Go to **Storage** → **Rules**
4. Update the rules to allow uploads:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /profile-pictures/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### Option 3: Temporary Workaround

For immediate testing, you can temporarily disable web security in Chrome:
```bash
# ⚠️ ONLY for development testing - NOT for production!
chrome.exe --user-data-dir=/tmp/chrome_dev_session --disable-web-security
```

## Testing

After applying the CORS fix:
1. Restart your development server: `npm run dev`
2. Try uploading a profile picture again
3. Check browser console for any remaining errors

## Files Created
- `cors.json` - CORS configuration for Firebase Storage
- `setup-cors.ps1` - PowerShell script to apply CORS settings
- `setup-cors.sh` - Bash script to apply CORS settings

## Support
If you continue experiencing issues, check:
1. Firebase project permissions
2. Internet connection
3. Browser developer tools for detailed error messages
