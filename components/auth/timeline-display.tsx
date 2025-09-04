"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { TimelineSubmission } from "../../lib/database";

interface TimelineDisplayProps {
  timeline: TimelineSubmission;
  onEdit?: () => void;
}

export const TimelineDisplay: React.FC<TimelineDisplayProps> = ({ timeline, onEdit }) => {
  const formatDate = (dateString: string) => {
    // Try to parse as a date, if it fails, return the original string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's not a valid date, return the approximate date string as-is
      return dateString;
    }
    return date.toLocaleDateString();
  };

  const sortEventsByDate = (events: typeof timeline.events) => {
    return events.sort((a, b) => {
      // Try to parse dates for sorting
      const dateA = new Date(a.approximateDate);
      const dateB = new Date(b.approximateDate);
      
      // If both are valid dates, sort by date
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If only one is a valid date, put valid dates first
      if (!isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
        return -1;
      }
      if (isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return 1;
      }
      
      // If neither is a valid date, sort alphabetically
      return a.approximateDate.localeCompare(b.approximateDate);
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-green-100 text-green-800",
      reviewed: "bg-blue-100 text-blue-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Timeline</h2>
        <div className="flex items-center gap-4">
          {getStatusBadge(timeline.status)}
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              Edit Timeline
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Submitted: {formatDate(timeline.submittedAt)}</p>
        {timeline.updatedAt !== timeline.submittedAt && (
          <p>Last Updated: {formatDate(timeline.updatedAt)}</p>
        )}
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {timeline.contactInfo.firstName} {timeline.contactInfo.lastName}</p>
          <p><strong>Email:</strong> {timeline.contactInfo.email}</p>
          <p><strong>Phone:</strong> {timeline.contactInfo.phone}</p>
          <p><strong>Address:</strong> {timeline.contactInfo.address}</p>
        </CardContent>
      </Card>

      {/* Employer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Company:</strong> {timeline.employerInfo.companyName}</p>
          <p><strong>Location:</strong> {timeline.employerInfo.location}</p>
          <p><strong>Job Title:</strong> {timeline.employerInfo.jobTitle}</p>
          <p><strong>Employment Period:</strong> {timeline.employerInfo.startDate} to {timeline.employerInfo.endDate}</p>
          <p><strong>Pay Rate:</strong> {timeline.employerInfo.payRate}</p>
          <p><strong>Employment Type:</strong> {timeline.employerInfo.employmentType}</p>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Events ({timeline.events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.events.length === 0 ? (
            <p className="text-gray-500">No events recorded</p>
          ) : (
            <div className="space-y-4">
              {sortEventsByDate(timeline.events)
                .map((event, index) => (
                  <div key={event.id} className="border-l-2 border-blue-500 pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {formatDate(event.approximateDate)}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        {event.type}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    {/* Display attachments if any */}
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">📎 Attachments:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.attachments.map((attachment) => (
                            <span
                              key={attachment.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {Object.keys(event.details).length > 0 && (
                      <div className="text-xs text-gray-500">
                        <strong>Additional Details:</strong>
                        <ul className="mt-1 space-y-1">
                          {Object.entries(event.details).map(([key, value]) => (
                            <li key={key}>
                              • <span className="font-medium">{key}:</span> {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
