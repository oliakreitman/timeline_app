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
  title: string;
  description: string;
  date: string;
  category: string;
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
  status: 'pending' | 'investigated' | 'resolved' | 'dismissed';
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
    // Verify the user is authenticated and matches the userId
    const currentUserId = checkAuth();
    if (currentUserId !== userId) {
      throw new Error("User ID mismatch: Cannot create profile for different user");
    }
    
    await setDoc(doc(db, "users", userId), userData);
  } catch (error) {
    handleFirebaseError(error, "createUserProfile");
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // Verify the user is authenticated and matches the userId
    const currentUserId = checkAuth();
    if (currentUserId !== userId) {
      throw new Error("User ID mismatch: Cannot access profile for different user");
    }
    
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    handleFirebaseError(error, "getUserProfile");
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
    const docRef = doc(db, "timelineSubmissions", submissionId);
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
