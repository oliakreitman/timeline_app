# Firebase Permissions Error Fix

## Problem
You're encountering a `FirebaseError: Missing or insufficient permissions` error. This is a common issue that can have several causes.

## Root Causes & Solutions

### 1. Firestore Security Rules (Most Common)

**Problem**: Your Firestore security rules are too restrictive or not properly configured.

**Solution**: Update your Firestore security rules in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `timeline2-ebaf6`
3. Go to Firestore Database → Rules
4. Replace the current rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own timeline events
    match /timelineEvents/{eventId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own timeline submissions
    match /timelineSubmissions/{submissionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**For Testing Only** (temporary):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. Authentication State Issues

**Problem**: User is not properly authenticated when making database calls.

**Solution**: The code has been updated with better authentication checks. Make sure:

1. User is signed in before making database calls
2. The `useAuth` hook is properly implemented
3. Authentication state is properly managed

### 3. Firebase Project Configuration

**Problem**: Wrong project ID or missing configuration.

**Solution**: Verify your `.env.local` file contains the correct values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCIIv8fQ53NM-2J2Txb4zBB3c2YMmYk50Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=timeline2-ebaf6.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=timeline2-ebaf6
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=timeline2-ebaf6.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=529690470493
NEXT_PUBLIC_FIREBASE_APP_ID=1:529690470493:web:1cbb68094958c79fb945b4
```

### 4. Storage Security Rules

**Problem**: Firebase Storage rules are too restrictive.

**Solution**: Update Storage rules in Firebase Console:

1. Go to Storage → Rules
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /timeline-attachments/{userId}/{eventId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the Fix

### Step 1: Add Debug Component
Add the debug component to your app to test Firebase permissions:

```tsx
import FirebaseDebug from '@/components/firebase-debug';

// Add this to your main page or component
<FirebaseDebug />
```

### Step 2: Check Browser Console
1. Open browser developer tools
2. Look for Firebase error messages
3. Check the debug component output

### Step 3: Test Authentication Flow
1. Sign up a new user
2. Sign in with existing user
3. Try to access timeline data

## Common Error Messages & Solutions

| Error Message | Solution |
|---------------|----------|
| `permission-denied` | Update Firestore security rules |
| `unauthenticated` | Ensure user is signed in |
| `not-found` | Check if document exists |
| `failed-precondition` | Check security rules conditions |

## Prevention

1. **Always test security rules** in the Firebase Console Rules Playground
2. **Use proper authentication checks** before database operations
3. **Implement proper error handling** for Firebase operations
4. **Test with different user accounts** to ensure rules work correctly

## Quick Fix Checklist

- [ ] Update Firestore security rules
- [ ] Update Storage security rules  
- [ ] Verify environment variables
- [ ] Test authentication flow
- [ ] Check browser console for errors
- [ ] Test with debug component

## Need Help?

If you're still experiencing issues:

1. Check the Firebase Console for any error logs
2. Use the debug component to identify the specific failing operation
3. Verify your Firebase project is properly set up
4. Ensure all required Firebase services are enabled (Authentication, Firestore, Storage)
