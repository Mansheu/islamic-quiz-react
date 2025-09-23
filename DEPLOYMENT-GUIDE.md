# 🚀 Deployment Instructions

## Environment Variables Setup

Your app is blank because the deployment platform doesn't have access to your Firebase environment variables. Here's how to fix it:

## 📱 Vercel (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project**: `islamic-quiz-react`
3. **Go to Settings** > **Environment Variables**
4. **Add these variables** (one by one):

```
VITE_FIREBASE_API_KEY = AIzaSyBgvexMLGkPYxMKo0gFIo-ekU61CLZhyGY
VITE_FIREBASE_AUTH_DOMAIN = islamic-quiz-app-825c0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = islamic-quiz-app-825c0
VITE_FIREBASE_STORAGE_BUCKET = islamic-quiz-app-825c0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 6375464242
VITE_FIREBASE_APP_ID = 1:6375464242:web:fa85678163463a7e194b2b
VITE_FIREBASE_MEASUREMENT_ID = G-LYE4YP4EW2
```

5. **Redeploy**: Go to **Deployments** tab and click **Redeploy** on the latest deployment

## 🔐 Firebase Domain Authorization

**IMPORTANT**: After deploying, you need to authorize your deployment domain in Firebase:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `islamic-quiz-app-825c0`  
3. **Go to Authentication** → **Settings** → **Authorized domains**
4. **Click "Add domain"**
5. **Add your deployment URL**:
   - Vercel: `your-project-name.vercel.app`
   - Netlify: `your-site-name.netlify.app`
   - GitHub Pages: `username.github.io`
6. **Click "Add"**

**Without this step, Google Sign-In will fail with "Auth/unauthorized-domain" error.**

## 🌍 Netlify

1. **Go to Netlify Dashboard**: https://app.netlify.com/
2. **Find your site**
3. **Go to Site Settings** > **Environment Variables**
4. **Add the same variables as above**
5. **Trigger a new deploy**: Go to **Deploys** and click **Trigger Deploy**

## 🐙 GitHub Pages (with Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.VITE_FIREBASE_MEASUREMENT_ID }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

Then add the environment variables in **GitHub Repository Settings** > **Secrets and Variables** > **Actions**.

## 🔍 Troubleshooting

### **Blank Page Issues:**
1. **Check Browser Console**: Press F12 and look for Firebase errors
2. **Verify Environment Variables**: Make sure all variables are set correctly
3. **Redeploy**: After adding variables, always redeploy/rebuild
4. **Check Domain**: Some deployment URLs may take a few minutes to update

### **Google Sign-In Issues:**
- **Error: "Auth/unauthorized-domain"**
  - **Solution**: Add your deployment domain to Firebase authorized domains (see above)
- **Error: "Auth/popup-blocked"**
  - **Solution**: Allow popups for your site or try sign-in redirect instead
- **Error: "Auth/network-request-failed"**
  - **Solution**: Check if Firebase config variables are correct

### **General Auth Issues:**
1. **Verify Firebase Project**: Make sure all environment variables match your Firebase project
2. **Check Firebase Rules**: Ensure Firestore and Storage rules allow authenticated users
3. **Clear Browser Cache**: Sometimes cached data causes issues

## ⚡ Quick Fix

The most common issue is missing environment variables. Your app will show:
- Blank page
- Console error: "Firebase Configuration Error: Missing environment variables"

**Solution**: Add all 7 environment variables to your deployment platform and redeploy.

---

**Need help?** Check the browser console (F12) for specific error messages!