"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isUpdate?: boolean;
}

export function SuccessModal({ isOpen, onClose, title, message, isUpdate = false }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 px-6"
            >
              {isUpdate ? "Continue" : "Got it!"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
