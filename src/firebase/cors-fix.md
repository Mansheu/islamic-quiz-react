# Firebase CORS and Permissions Fix

## 1. Firestore Security Rules

⚠️ **IMPORTANT: Replace `your-admin-email@gmail.com` with your actual admin email before deploying!**

Go to your Firebase Console -> Firestore Database -> Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && (
        // Hardcoded admin email (your email)
        request.auth.token.email == 'babakartijaniyshaykhaniy@gmail.com' ||
        // OR check admin collection (for additional admins)
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }
    
    // Allow read access to questions for all users (authenticated and unauthenticated)
    match /questions/{questionId} {
      allow read: if true; // Allow everyone to read questions
      allow write: if isAdmin(); // Only admins can write
    }
    
    // User profiles - users can read/write their own data, admins can read all
    match /users/{userId} {
      // Users can read all user profiles (needed for leaderboard)
      allow read: if request.auth != null;
      // Users can only write their own data
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins can read and write all user data (separate rule to avoid conflicts)
      allow write: if isAdmin();
    }
    
    // Achievements - users can read/write their own achievements
    match /achievements/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read achievements for analytics
      allow read: if isAdmin();
    }
    
    // Streaks - users can read/write their own streaks
    match /streaks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read streaks for analytics
      allow read: if isAdmin();
    }
    
    // Admin collection - admins can manage other admins
    match /admins/{adminId} {
      allow read, write: if isAdmin();
    }
    
    // Leaderboard data - more specific access control
    match /leaderboard/{userId} {
      // Users can read all leaderboard data
      allow read: if request.auth != null;
      // Users can only write their own leaderboard data
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins can write any leaderboard data
      allow write: if isAdmin();
    }
    
    // Additional: Handle subcollections or nested leaderboard data
    match /leaderboard/{document=**} {
      allow read: if request.auth != null;
      // More restrictive write access for nested documents
      allow write: if request.auth != null && 
        (resource == null || request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // Timed Challenge Results - individual challenge attempts
    match /timedChallengeResults/{resultId} {
      // Users can read all results for leaderboards
      allow read: if request.auth != null;
      // Users can create their own results (validate incoming data has correct userId)
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId &&
        request.resource.data.keys().hasAll(['challengeId', 'score', 'grade', 'userId', 'isPersonalBest']);
      // Users cannot update or delete results (data integrity)
      // Admins can read/write all results
      allow read, write: if isAdmin();
    }
    
    // Timed Challenge Profiles - user personal bests and stats
    match /timedChallengeProfiles/{userId} {
      // Users can read all profiles for leaderboards
      allow read: if request.auth != null;
      // Users can only write their own profile with data validation
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.userId == userId;
      // Admins can read/write all profiles
      allow read, write: if isAdmin();
    }
  }
}
```

## 2. Admin Setup Options

You have two ways to manage admins:

### Option A: Hardcoded Admin (Simpler)
1. Replace `'your-admin-email@gmail.com'` in the rules above with your actual email
2. You'll automatically have admin access when signed in with that email

### Option B: Dynamic Admin Collection (More Flexible)
1. Keep the hardcoded email for bootstrapping
2. Use the Admin Dashboard to add other admins
3. Admins are stored in the `admins` collection in Firestore
4. Later you can remove the hardcoded email from the rules if desired

## 3. Authentication Domain Setup

In Firebase Console -> Authentication -> Settings -> Authorized domains, make sure you have:
- `localhost` (for development)
- Your deployed domain (for production)

## 4. CORS Issues Fix

✅ **Already configured** - CORS headers are already set up in `vite.config.ts`

The following headers are configured to fix Cross-Origin-Opener-Policy errors:
- `Cross-Origin-Opener-Policy`: Allows Google Auth popups
- `Cross-Origin-Embedder-Policy`: Required security header
- `cors: true`: Enables CORS for Firebase API calls

### For Production (if using Vercel/Netlify):
You'll need to add these same headers to your deployment configuration when you deploy.

## 5. Testing the Fix

1. Deploy the updated Firestore rules
2. Clear browser cache and localStorage
3. Test authentication and question loading
4. Check browser console for any remaining errors

## 6. Fallback Mechanism

The app will automatically fall back to static questions if Firebase is unavailable, so users can still use the quiz even with permission issues.