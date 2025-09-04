# Firebase Setup for Timeline App

This document outlines the Firebase authentication and database setup for the Timeline App.

## Configuration

### Environment Variables
The Firebase configuration is stored in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Services
- **Authentication**: Email/password only
- **Firestore Database**: User profiles and timeline events
- **Firebase Storage**: File attachments (images, PDFs, documents)

## Features

### Authentication
- User sign up with email/password (with duplicate email check)
- Automatic sign-in after successful registration
- User sign in
- User profile management
- Sign out

### Database Structure

#### Users Collection (`users/{userId}`)
```typescript
{
  email: string
  firstName: string
  lastName: string
  displayName: string
  createdAt: string
  updatedAt: string
}
```

#### Timeline Events Collection (`timelineEvents/{eventId}`)
```typescript
{
  userId: string
  title: string
  description: string
  date: string
  category: string
  createdAt: string
  updatedAt: string
}
```

#### Timeline Submissions Collection (`timelineSubmissions/{submissionId}`)
```typescript
{
  userId: string
  contactInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
  }
  employerInfo: {
    companyName: string
    location: string
    jobTitle: string
    startDate: string
    endDate: string
    payRate: string
    employmentType: string
  }
  events: Array<{
    id: string
    type: string
    title: string
    description: string
    approximateDate: string
    details: Record<string, any>
  }>
  submittedAt: string
  updatedAt: string
  status: 'draft' | 'submitted' | 'reviewed'
}
```

## Usage

### Authentication Hook
```typescript
import { useAuth } from '@/lib/auth-context'

const { user, userProfile, loading } = useAuth()
```

### Authentication Functions
```typescript
import { signUp, signIn, logOut, checkEmailExists } from '@/lib/auth'

// Check if email exists
const emailExists = await checkEmailExists('user@example.com')

// Sign up (automatically signs in user and redirects to main app)
await signUp({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
})

// Sign in
await signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await logOut()
```

### Database Functions
```typescript
import { 
  createUserProfile, 
  getUserProfile, 
  saveTimelineSubmission,
  getUserTimelineSubmission,
  updateTimelineSubmission,
  createTimelineEvent, 
  getUserTimelineEvents,
  uploadFile,
  deleteFile
} from '@/lib/database'

// Save complete timeline submission
const submissionId = await saveTimelineSubmission({
  userId: user.uid,
  contactInfo: { /* contact details */ },
  employerInfo: { /* employer details */ },
  events: [ /* timeline events */ ],
  status: 'submitted'
})

// Get user's timeline submission
const timeline = await getUserTimelineSubmission(user.uid)

// Update existing timeline
await updateTimelineSubmission(submissionId, {
  status: 'reviewed'
})

// Create individual timeline event
const eventId = await createTimelineEvent({
  userId: user.uid,
  title: 'Event Title',
  description: 'Event description',
  date: '2024-01-01',
  category: 'work'
})

// Get user events
const events = await getUserTimelineEvents(user.uid)

// File operations
const fileUrl = await uploadFile(file, userId, eventId)
await deleteFile(fileUrl)

## Security Rules

Make sure to configure Firestore security rules in the Firebase Console:

```javascript
// Firestore Security Rules
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

### Storage Security Rules

```javascript
// Firebase Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own timeline attachments
    match /timeline-attachments/{userId}/{eventId}/{fileName} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
      allow delete: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## Getting Started

1. Make sure Firebase is properly configured in your project
2. Set up authentication methods in Firebase Console (Email/Password)
3. Create Firestore database
4. Configure security rules
5. The app will automatically redirect to authentication when no user is signed in
