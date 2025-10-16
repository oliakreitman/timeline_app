"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { signUp, SignUpData, signIn } from "../../lib/auth";
import { useAuth } from "../../lib/auth-context";

interface SignUpFormProps {
  onSignUpSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
  const [formData, setFormData] = useState<SignUpData>({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (name === "password") {
      setPasswordError(null);
    }
    if (error) {
      setError(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordError(null);
  };

  const getFriendlyErrorMessage = (error: any): string => {
    const errorCode = error.code || error.message;
    
    // Map Firebase error codes to user-friendly messages
    if (errorCode?.includes('email-already-in-use') || errorCode?.includes('email already exists')) {
      return "An account with this email already exists. Please sign in instead or use a different email.";
    }
    if (errorCode?.includes('invalid-email')) {
      return "Please enter a valid email address.";
    }
    if (errorCode?.includes('weak-password')) {
      return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
    }
    if (errorCode?.includes('network-request-failed')) {
      return "Network error. Please check your internet connection and try again.";
    }
    if (errorCode?.includes('too-many-requests')) {
      return "Too many attempts. Please try again later.";
    }
    
    // Default message for unknown errors
    return "Unable to create account. Please try again or contact support.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordError(null);

    // Check if passwords match
    if (formData.password !== confirmPassword) {
      setPasswordError("Passwords do not match. Please make sure both passwords are identical.");
      setLoading(false);
      return;
    }

    // Check password length
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // Create the account
      await signUp(formData);
      
      // Automatically sign in the user
      await signIn({
        email: formData.email,
        password: formData.password
      });
      
      // Call the success callback to redirect to main app
      if (onSignUpSuccess) {
        onSignUpSuccess();
      }
    } catch (error: any) {
      // Error is already logged in auth.ts with just the error code
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Sign Up</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {passwordError && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {passwordError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Enter your last name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
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
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password (min 6 characters)"
            required
            minLength={6}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Repeat Password *</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Re-enter your password"
            required
            minLength={6}
            className={confirmPassword && formData.password && confirmPassword !== formData.password ? "border-red-500 dark:border-red-400" : ""}
          />
          {confirmPassword && formData.password && (
            <p className={`text-xs mt-1 ${
              confirmPassword === formData.password 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {confirmPassword === formData.password ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <span className="text-primary hover:underline cursor-pointer font-medium">
            Sign in instead
          </span>
        </div>
      </form>
    </Card>
  );
};
