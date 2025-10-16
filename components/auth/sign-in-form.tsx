"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { signIn, SignInData, resetPassword } from "../../lib/auth";
import { useAuth } from "../../lib/auth-context";

export const SignInForm: React.FC = () => {
  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const errorCode = error.code || error.message;
    
    // Map Firebase error codes to user-friendly messages
    if (errorCode?.includes('invalid-credential') || errorCode?.includes('wrong-password')) {
      return "Incorrect email or password. Please try again.";
    }
    if (errorCode?.includes('user-not-found')) {
      return "No account found with this email. Please check your email or sign up.";
    }
    if (errorCode?.includes('invalid-email')) {
      return "Please enter a valid email address.";
    }
    if (errorCode?.includes('too-many-requests')) {
      return "Too many failed attempts. Please try again later or reset your password.";
    }
    if (errorCode?.includes('network-request-failed')) {
      return "Network error. Please check your internet connection and try again.";
    }
    if (errorCode?.includes('user-disabled')) {
      return "This account has been disabled. Please contact support.";
    }
    
    // Default message for unknown errors
    return "Unable to sign in. Please check your credentials and try again.";
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    setError(null);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (error: any) {
      const errorCode = error.code || error.message;
      if (errorCode?.includes('user-not-found')) {
        setError("No account found with this email address.");
      } else if (errorCode?.includes('invalid-email')) {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(formData);
      // User will be automatically redirected via auth state change
    } catch (error: any) {
      // Error is already logged in auth.ts with just the error code
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Welcome Back!</h2>
          <p className="text-muted-foreground mb-4">
            You are successfully signed in as {user.email}
          </p>
        </div>
      </Card>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {resetSuccess ? (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
            <p className="font-medium mb-2">Password reset email sent!</p>
            <p className="text-sm">
              Check your email inbox for a link to reset your password. The link will expire in 1 hour.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="resetEmail">Email Address</Label>
                <Input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setShowForgotPassword(false);
              setResetSuccess(false);
              setResetEmail("");
              setError(null);
            }}
            className="text-primary hover:underline"
          >
            ← Back to Sign In
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Sign In</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setError(null);
          }}
          className="text-sm text-primary hover:underline mb-3 block w-full"
        >
          Forgot your password?
        </button>
        
        <div className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <span className="text-primary hover:underline cursor-pointer font-medium">
            Sign up instead
          </span>
        </div>
      </div>
    </Card>
  );
};
