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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      // Check if the error is about existing email and suggest sign in
      if (error.message?.includes("email already exists")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(error.message || "An error occurred during sign up");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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
            placeholder="Enter your password"
            required
            minLength={6}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
    </Card>
  );
};
