'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function FirebaseDebug() {
  const { user, userProfile, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  const runDiagnostics = async () => {
    setIsTesting(true);
    const info: any = {};

    try {
      // Check authentication state
      info.authState = {
        isAuthenticated: !!user,
        userId: user?.uid || 'Not authenticated',
        email: user?.email || 'No email',
        displayName: user?.displayName || 'No display name'
      };

      // Check Firebase configuration
      info.firebaseConfig = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not set'
      };

      if (user) {
        // Test users collection access
        try {
          const userDoc = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDoc);
          info.usersCollection = {
            status: 'SUCCESS',
            exists: userSnap.exists(),
            data: userSnap.exists() ? userSnap.data() : null
          };
        } catch (error: any) {
          info.usersCollection = {
            status: 'ERROR',
            error: error.message,
            code: error.code
          };
        }

        // Test timelineEvents collection access
        try {
          const eventsQuery = collection(db, 'timelineEvents');
          const eventsSnapshot = await getDocs(eventsQuery);
          info.timelineEventsCollection = {
            status: 'SUCCESS',
            count: eventsSnapshot.size
          };
        } catch (error: any) {
          info.timelineEventsCollection = {
            status: 'ERROR',
            error: error.message,
            code: error.code
          };
        }

        // Test timelineSubmissions collection access
        try {
          const submissionsQuery = collection(db, 'timelineSubmissions');
          const submissionsSnapshot = await getDocs(submissionsQuery);
          info.timelineSubmissionsCollection = {
            status: 'SUCCESS',
            count: submissionsSnapshot.size
          };
        } catch (error: any) {
          info.timelineSubmissionsCollection = {
            status: 'ERROR',
            error: error.message,
            code: error.code
          };
        }
      }

      setDebugInfo(info);
    } catch (error: any) {
      info.generalError = {
        message: error.message,
        code: error.code
      };
      setDebugInfo(info);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      runDiagnostics();
    }
  }, [user, loading]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Firebase Debug Information</h2>
      
      <div className="mb-4">
        <button
          onClick={runDiagnostics}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Authentication State:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.authState, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Firebase Configuration:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.firebaseConfig, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Users Collection Test:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.usersCollection, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Timeline Events Collection Test:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.timelineEventsCollection, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Timeline Submissions Collection Test:</h3>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.timelineSubmissionsCollection, null, 2)}
          </pre>
        </div>

        {debugInfo.generalError && (
          <div>
            <h3 className="font-semibold text-red-600">General Error:</h3>
            <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.generalError, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
