// Firebase Debug Script
// Run this in your browser console to diagnose Firebase permissions issues

import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

console.log('🔍 Firebase Debug Script Started');

// Check Firebase configuration
console.log('📋 Firebase Config Check:');
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');

// Check authentication state
console.log('\n🔐 Authentication State Check:');
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User is authenticated:', user.uid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    
    // Test database access
    testDatabaseAccess(user.uid);
  } else {
    console.log('❌ No user authenticated');
  }
});

async function testDatabaseAccess(userId) {
  console.log('\n🗄️ Database Access Test:');
  
  try {
    // Test users collection access
    console.log('Testing users collection...');
    const userDoc = doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      console.log('✅ Users collection access: SUCCESS');
      console.log('User data:', userSnap.data());
    } else {
      console.log('⚠️ Users collection access: Document not found');
    }
  } catch (error) {
    console.error('❌ Users collection access: FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
  
  try {
    // Test timelineEvents collection access
    console.log('Testing timelineEvents collection...');
    const eventsQuery = collection(db, 'timelineEvents');
    const eventsSnapshot = await getDocs(eventsQuery);
    console.log('✅ TimelineEvents collection access: SUCCESS');
    console.log('Events count:', eventsSnapshot.size);
  } catch (error) {
    console.error('❌ TimelineEvents collection access: FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
  
  try {
    // Test timelineSubmissions collection access
    console.log('Testing timelineSubmissions collection...');
    const submissionsQuery = collection(db, 'timelineSubmissions');
    const submissionsSnapshot = await getDocs(submissionsQuery);
    console.log('✅ TimelineSubmissions collection access: SUCCESS');
    console.log('Submissions count:', submissionsSnapshot.size);
  } catch (error) {
    console.error('❌ TimelineSubmissions collection access: FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
}

// Check if running in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
} else {
  console.log('🖥️ Running in Node.js environment');
}
