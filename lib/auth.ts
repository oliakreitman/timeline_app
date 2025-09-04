import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  updateProfile,
  fetchSignInMethodsForEmail,
  getIdToken
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile } from "./database";

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return signInMethods.length > 0;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

// Sign up with email and password
export const signUp = async (data: SignUpData): Promise<UserCredential> => {
  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(data.email);
    if (emailExists) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Update user profile with display name if provided
    if (data.firstName || data.lastName) {
      const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    // Create user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email: data.email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: userCredential.user.displayName || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return userCredential;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (data: SignInData): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    return userCredential;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user's ID token (refreshes if needed)
export const getCurrentUserToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    
    // This will automatically refresh the token if it's expired
    const token = await getIdToken(user, true);
    return token;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
};

// Check if current user is authenticated and token is valid
export const isUserAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getCurrentUserToken();
    return !!token;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
