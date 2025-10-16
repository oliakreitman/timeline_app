"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { SignUpForm } from "./sign-up-form";
import { SignInForm } from "./sign-in-form";
import { UserProfile } from "./user-profile";
import { useAuth } from "../../lib/auth-context";

type AuthView = "signin" | "signup" | "profile";

interface AuthDemoProps {
  onBackToApp?: () => void;
}

export const AuthDemo: React.FC<AuthDemoProps> = ({ onBackToApp }) => {
  const [currentView, setCurrentView] = useState<AuthView>("signin");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          {onBackToApp && (
            <div className="text-center mb-6">
              <Button onClick={onBackToApp} variant="outline">
                ← Back to Timeline App
              </Button>
            </div>
          )}
          <UserProfile onEditTimeline={onBackToApp} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Timeline App</h1>
          <p className="text-muted-foreground mb-6">Sign in or create an account to get started</p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Button 
              onClick={() => setCurrentView("signin")}
              variant={currentView === "signin" ? "default" : "outline"}
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setCurrentView("signup")}
              variant={currentView === "signup" ? "default" : "outline"}
            >
              Sign Up
            </Button>
          </div>
        </div>

        {currentView === "signin" && <SignInForm />}
        {currentView === "signup" && (
          <SignUpForm onSignUpSuccess={onBackToApp} />
        )}
      </div>
    </div>
  );
};
