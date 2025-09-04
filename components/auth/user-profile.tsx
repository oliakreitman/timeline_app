"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useAuth } from "../../lib/auth-context";
import { logOut } from "../../lib/auth";
import { getUserTimelineSubmission, TimelineSubmission } from "../../lib/database";
import { TimelineDisplay } from "./timeline-display";

interface UserProfileProps {
  onEditTimeline?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onEditTimeline }) => {
  const { user, userProfile, loading } = useAuth();
  const [timeline, setTimeline] = useState<TimelineSubmission | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Load user's timeline
  useEffect(() => {
    const loadTimeline = async () => {
      if (user && !timelineLoading) {
        setTimelineLoading(true);
        try {
          const submission = await getUserTimelineSubmission(user.uid);
          setTimeline(submission);
        } catch (error) {
          console.error("Error loading timeline:", error);
        } finally {
          setTimelineLoading(false);
        }
      }
    };

    loadTimeline();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Signed In</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Account Info */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">User Profile</h2>
        
        <div className="space-y-4">
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          
          {userProfile && (
            <>
              {userProfile.displayName && (
                <div>
                  <strong>Name:</strong> {userProfile.displayName}
                </div>
              )}
              
              <div>
                <strong>Account Created:</strong> {new Date(userProfile.createdAt).toLocaleDateString()}
              </div>
            </>
          )}
          
          <Button 
            onClick={handleSignOut}
            variant="destructive"
            className="w-full mt-6"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Timeline Section */}
      <div>
        {timelineLoading ? (
          <Card className="p-6">
            <div className="text-center">
              <p>Loading timeline...</p>
            </div>
          </Card>
        ) : timeline ? (
          <TimelineDisplay 
            timeline={timeline} 
            onEdit={onEditTimeline}
          />
        ) : (
          <Card className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Timeline Found</h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted a timeline yet.
              </p>
              {onEditTimeline && (
                <Button onClick={onEditTimeline} variant="outline">
                  Create Timeline
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
