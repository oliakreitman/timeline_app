import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  DocumentData,
  DocumentSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { auth } from "./firebase";

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id?: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  approximateDate: string;
  details: Record<string, any>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  complaintId?: string; // Link to complaint if this event was part of a complaint
  didComplain?: boolean; // Whether user complained about this incident
  complaintTo?: string; // Who they complained to
  complaintDate?: string; // When they complained
  companyDidRespond?: boolean; // Whether company responded to the complaint
  companyResponseDate?: string; // When company responded
  companyResponseDetails?: string; // What company did in response
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id?: string;
  userId: string;
  title: string;
  description: string;
  approximateDate: string;
  complaintTo: string; // Who they complained to
  complaintDate: string; // When they complained
  relatedEventIds: string[]; // IDs of events that are part of this complaint
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthday: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface EmployerInfo {
  companyName: string;
  location: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  payRate: string;
  employmentType: string;
  useExactStartDate?: boolean;
  useExactEndDate?: boolean;
}

export interface TimelineSubmission {
  id?: string;
  userId: string;
  contactInfo: ContactInfo;
  employerInfo: EmployerInfo;
  events: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    approximateDate: string;
    details: Record<string, any>;
    attachments?: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      url?: string;
    }>;
    complaintId?: string;
    didComplain?: boolean;
    complaintTo?: string;
    complaintDate?: string;
    companyDidRespond?: boolean;
    companyResponseDate?: string;
    companyResponseDetails?: string;
  }>;
  complaints?: Complaint[];
  submittedAt: string;
  updatedAt: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

// Helper function to check authentication
const checkAuth = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to perform this action");
  }
  return user.uid;
};

// Helper function to get current user's role from Firestore
const getCurrentUserRole = async (): Promise<UserRole> => {
  const userId = checkAuth();
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return (data.role as UserRole) || 'user';
  }
  return 'user';
};

// Helper function to check if current user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const role = await getCurrentUserRole();
    return role === 'admin';
  } catch {
    return false;
  }
};

// Helper function to check authorization - returns true if user can access the target userId's data
const checkAuthorizationForUser = async (targetUserId: string): Promise<boolean> => {
  const currentUserId = checkAuth();
  
  // User can always access their own data
  if (currentUserId === targetUserId) {
    return true;
  }
  
  // Check if current user is admin
  const isAdmin = await isCurrentUserAdmin();
  return isAdmin;
};

// Helper function to handle Firebase errors
const handleFirebaseError = (error: any, operation: string): never => {
  console.error(`Error in ${operation}:`, error);
  
  if (error.code === 'permission-denied') {
    throw new Error("You don't have permission to perform this action. Please make sure you're signed in and try again.");
  } else if (error.code === 'unauthenticated') {
    throw new Error("You must be signed in to perform this action.");
  } else if (error.code === 'not-found') {
    throw new Error("The requested resource was not found.");
  } else if (error.code === 'already-exists') {
    throw new Error("A resource with this ID already exists.");
  } else if (error.code === 'failed-precondition') {
    throw new Error("The operation failed due to a precondition check.");
  } else {
    throw new Error(`Firebase error: ${error.message || 'Unknown error occurred'}`);
  }
};

// User Profile Operations
export const createUserProfile = async (userId: string, userData: UserProfile): Promise<void> => {
  try {
    // During signup, auth.currentUser should be set, but we add logging for debugging
    const currentUser = auth.currentUser;
    console.log("createUserProfile called for userId:", userId);
    console.log("auth.currentUser:", currentUser?.uid || "null");
    
    // If there's a current user, verify they match (unless creating own profile right after signup)
    if (currentUser && currentUser.uid !== userId) {
      throw new Error("User ID mismatch: Cannot create profile for different user");
    }
    
    // If no current user at all, this might be a timing issue - still try to create
    // Firestore security rules will be the final guard
    console.log("Attempting to create Firestore document...");
    await setDoc(doc(db, "users", userId), userData);
    console.log("Firestore document created successfully for:", userId);
  } catch (error: any) {
    console.error("Error in createUserProfile:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    handleFirebaseError(error, "createUserProfile");
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // Verify the user is authenticated and has permission
    const canAccess = await checkAuthorizationForUser(userId);
    if (!canAccess) {
      throw new Error("Access denied: You don't have permission to access this profile");
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        role: data.role || 'user' // Default to 'user' if role not set
      } as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    handleFirebaseError(error, "getUserProfile");
    return null;
  }
};

export const updateUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<void> => {
  try {
    // Verify the user is authenticated and matches the userId
    const currentUserId = checkAuth();
    if (currentUserId !== userId) {
      throw new Error("User ID mismatch: Cannot update profile for different user");
    }
    
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirebaseError(error, "updateUserProfile");
  }
};

// Timeline Events Operations
export const createTimelineEvent = async (eventData: Omit<TimelineEvent, 'id'>): Promise<string> => {
  try {
    // Verify the user is authenticated and matches the userId
    const currentUserId = checkAuth();
    if (currentUserId !== eventData.userId) {
      throw new Error("User ID mismatch: Cannot create event for different user");
    }
    
    const docRef = await addDoc(collection(db, "timelineEvents"), {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirebaseError(error, "createTimelineEvent");
    // This line will never be reached, but satisfies TypeScript
    return "";
  }
};

export const getTimelineEvent = async (eventId: string): Promise<TimelineEvent | null> => {
  try {
    const docRef = doc(db, "timelineEvents", eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TimelineEvent;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting timeline event:", error);
    throw error;
  }
};

export const getUserTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
  try {
    // Verify the user is authenticated and matches the userId
    const currentUserId = checkAuth();
    if (currentUserId !== userId) {
      throw new Error("User ID mismatch: Cannot access events for different user");
    }
    
    const q = query(
      collection(db, "timelineEvents"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const events: TimelineEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as TimelineEvent);
    });
    
    return events;
  } catch (error) {
    handleFirebaseError(error, "getUserTimelineEvents");
    // This line will never be reached, but satisfies TypeScript
    return [];
  }
};

export const updateTimelineEvent = async (eventId: string, eventData: Partial<TimelineEvent>): Promise<void> => {
  try {
    const docRef = doc(db, "timelineEvents", eventId);
    await updateDoc(docRef, {
      ...eventData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating timeline event:", error);
    throw error;
  }
};

export const deleteTimelineEvent = async (eventId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "timelineEvents", eventId));
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    throw error;
  }
};

// Timeline Submission Operations
export const saveTimelineSubmission = async (submissionData: Omit<TimelineSubmission, 'id' | 'submittedAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Check if user already has a timeline submission
    const existingSubmission = await getUserTimelineSubmission(submissionData.userId);
    
    if (existingSubmission) {
      // Update existing submission
      const docRef = doc(db, "timelineSubmissions", existingSubmission.id!);
      await updateDoc(docRef, {
        ...submissionData,
        updatedAt: new Date().toISOString()
      });
      return existingSubmission.id!;
    } else {
      // Create new submission
      const docRef = await addDoc(collection(db, "timelineSubmissions"), {
        ...submissionData,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving timeline submission:", error);
    throw error;
  }
};

export const getUserTimelineSubmission = async (userId: string): Promise<TimelineSubmission | null> => {
  try {
    const q = query(
      collection(db, "timelineSubmissions"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as TimelineSubmission;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user timeline submission:", error);
    throw error;
  }
};

export const updateTimelineSubmission = async (submissionId: string, submissionData: Partial<TimelineSubmission>): Promise<void> => {
  try {
    // Get the submission to check ownership
    const docRef = doc(db, "timelineSubmissions", submissionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Submission not found");
    }
    
    const existingData = docSnap.data();
    const canAccess = await checkAuthorizationForUser(existingData.userId);
    
    if (!canAccess) {
      throw new Error("Access denied: You don't have permission to update this submission");
    }
    
    await updateDoc(docRef, {
      ...submissionData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating timeline submission:", error);
    throw error;
  }
};

export const deleteTimelineSubmission = async (submissionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "timelineSubmissions", submissionId));
  } catch (error) {
    console.error("Error deleting timeline submission:", error);
    throw error;
  }
};

// File Upload Operations
export const uploadFile = async (file: File, userId: string, eventId: string): Promise<string> => {
  try {
    // Create a unique file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `timeline-attachments/${userId}/${eventId}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathSegments = url.pathname.split('/');
    const filePath = pathSegments.slice(-4).join('/'); // Get last 4 segments
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Delete file
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// ==================== ADMIN FUNCTIONS ====================

export interface UserWithSubmission extends UserProfile {
  id: string;
  hasSubmission: boolean;
  submissionStatus?: 'draft' | 'submitted' | 'reviewed';
  submissionDate?: string;
}

// Admin only: Get all users with their submission status
export const getAllUsersWithSubmissions = async (): Promise<UserWithSubmission[]> => {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }
    
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: UserWithSubmission[] = [];
    
    const submissionsSnapshot = await getDocs(collection(db, "timelineSubmissions"));
    const submissionsByUserId = new Map<string, { status: string; date: string }>();
    
    submissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      submissionsByUserId.set(data.userId, {
        status: data.status || 'draft',
        date: data.submittedAt || data.updatedAt
      });
    });
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const submission = submissionsByUserId.get(doc.id);
      
      users.push({
        id: doc.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        displayName: userData.displayName || '',
        role: userData.role || 'user',
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        hasSubmission: !!submission,
        submissionStatus: submission?.status as 'draft' | 'submitted' | 'reviewed' | undefined,
        submissionDate: submission?.date
      });
    });
    
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

// Admin only: Search users by name or email
export const searchUsers = async (searchTerm: string): Promise<UserWithSubmission[]> => {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }
    
    const allUsers = await getAllUsersWithSubmissions();
    const searchLower = searchTerm.toLowerCase();
    
    return allUsers.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.displayName.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

// Admin only: Update user role
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }
    
    const currentUserId = checkAuth();
    if (currentUserId === userId && newRole !== 'admin') {
      throw new Error("Cannot remove your own admin privileges");
    }
    
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Admin only: Update submission status
export const updateSubmissionStatus = async (
  submissionId: string, 
  status: 'draft' | 'submitted' | 'reviewed'
): Promise<void> => {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }
    
    const docRef = doc(db, "timelineSubmissions", submissionId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    throw error;
  }
};
