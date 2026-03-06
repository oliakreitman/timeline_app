"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, UserProfile, UserRole } from "./database";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: UserRole;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  userRole: 'user',
  refreshUserProfile: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole: UserRole = userProfile?.role || 'user';
  const isAdmin = userRole === 'admin';

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(true);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAdmin,
    userRole,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
