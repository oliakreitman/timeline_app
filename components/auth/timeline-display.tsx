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
    if (!dateString) return 'Not provided'
    
    // Try to parse as a date first
    if (dateString.includes('-')) {
      // It's a valid date string (YYYY-MM-DD format)
      // Parse it as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day) // month is 0-indexed
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString()
      }
    }
    
    // If it's not a valid date format, return the string as-is (approximate date)
    return dateString
  }

  // Convert complaints to timeline events
  const complaintEvents = timeline.complaints?.map(complaint => ({
    id: `complaint_${complaint.id}`,
    type: "Complaint",
    title: complaint.title,
    description: complaint.description,
    approximateDate: complaint.complaintDate, // Use complaint date for chronological sorting
    details: {
      complaintTo: complaint.complaintTo,
      incidentDate: complaint.approximateDate,
      relatedEventIds: complaint.relatedEventIds
    },
    attachments: [],
    isComplaint: true,
    complaintId: complaint.id
  })) || []

  // Convert company responses to timeline events
  const companyResponseEvents = timeline.events
    .filter(event => event.companyDidRespond && event.companyResponseDate)
    .map(event => ({
      id: `company_response_${event.id}`,
      type: "Company Response",
      title: `Company Response to ${event.title}`,
      description: event.companyResponseDetails || "Company responded to the complaint",
      approximateDate: event.companyResponseDate!,
      details: {
        originalEventId: event.id,
        originalEventTitle: event.title,
        responseDetails: event.companyResponseDetails
      },
      attachments: [],
      isCompanyResponse: true,
      originalEventId: event.id
    }))

  // Merge events, complaint events, and company response events
  const allEvents: (typeof timeline.events[0] | typeof complaintEvents[0] | typeof companyResponseEvents[0])[] = [
    ...timeline.events, 
    ...complaintEvents, 
    ...companyResponseEvents
  ];

  const formatEmployerDate = (dateString: string) => {
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
      draft: "bg-muted text-muted-foreground",
      submitted: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
      reviewed: "bg-primary/10 text-primary"
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
        <h2 className="text-2xl font-bold text-foreground">Your Timeline</h2>
        <div className="flex items-center gap-4">
          {getStatusBadge(timeline.status)}
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              Edit Timeline
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
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
          <p><strong>Birthday:</strong> {timeline.contactInfo.birthday ? formatDate(timeline.contactInfo.birthday) : 'Not provided'}</p>
          <p><strong>Address:</strong> {timeline.contactInfo.address}</p>
          
          {/* Emergency Contact Information */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-semibold text-foreground mb-2">Emergency Contact</h4>
            <p><strong>Name:</strong> {timeline.contactInfo.emergencyContactName || 'Not provided'}</p>
            <p><strong>Phone:</strong> {timeline.contactInfo.emergencyContactPhone || 'Not provided'}</p>
          </div>
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
          <p><strong>Employment Period:</strong> {formatEmployerDate(timeline.employerInfo.startDate)} to {timeline.employerInfo.endDate ? formatEmployerDate(timeline.employerInfo.endDate) : 'Current'}</p>
          <p><strong>Pay Rate:</strong> {timeline.employerInfo.payRate}</p>
          <p><strong>Employment Type:</strong> {timeline.employerInfo.employmentType}</p>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Events ({allEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <p className="text-muted-foreground">No events recorded</p>
          ) : (
            <div className="space-y-4">
              {sortEventsByDate(allEvents)
                .map((event, index) => (
                  <div key={event.id} className={`border-l-2 ${
                    ('isComplaint' in event && event.isComplaint) ? 'border-orange-500 dark:border-orange-600' : 
                    ('isCompanyResponse' in event && event.isCompanyResponse) ? 'border-green-500 dark:border-green-600' : 
                    'border-primary'
                  } pl-4 pb-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-primary">
                        <strong>{
                          ('isComplaint' in event && event.isComplaint) ? 'Complaint Date:' : 
                          ('isCompanyResponse' in event && event.isCompanyResponse) ? 'Response Date:' : 
                          'Event Date:'
                        }</strong> {formatDate(event.approximateDate)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ('isComplaint' in event && event.isComplaint) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : 
                        ('isCompanyResponse' in event && event.isCompanyResponse) ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {('isComplaint' in event && event.isComplaint) ? 'Complaint' : 
                         ('isCompanyResponse' in event && event.isCompanyResponse) ? 'Company Response' : 
                         event.type}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1 text-foreground">{event.title}</h4>
                    <p className="text-muted-foreground text-sm mb-2">{event.description}</p>
                    
                    {/* Complaint Event Details */}
                    {('isComplaint' in event && event.isComplaint) ? (
                      <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Complained to:</strong> {(event as any).details?.complaintTo || 'Not specified'}</p>
                          <p><strong>Incident Date:</strong> {(event as any).details?.incidentDate ? formatDate((event as any).details.incidentDate) : 'Not specified'}</p>
                          <p><strong>Related Events:</strong> {(event as any).details?.relatedEventIds?.length || 0} incident(s)</p>
                        </div>
                      </div>
                    ) : null}

                    {/* Company Response Event Details */}
                    {('isCompanyResponse' in event && event.isCompanyResponse) ? (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Response to:</strong> {(event as any).details?.originalEventTitle || 'Original incident'}</p>
                          <p><strong>Response Details:</strong></p>
                          <p className="text-muted-foreground italic pl-2">{(event as any).details?.responseDetails || 'No details provided'}</p>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Display complaint information if any */}
                    {event.didComplain && (
                      <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-orange-600 dark:text-orange-400 font-medium">📢 Complaint Filed</span>
                        </div>
                        {(() => {
                          // If event is linked to a complaint, show complaint data
                          if (event.complaintId && timeline.complaints) {
                            const linkedComplaint = timeline.complaints.find(c => c.id === event.complaintId);
                            if (linkedComplaint) {
                              return (
                                <>
                                  <p><strong>Complaint Title:</strong> {linkedComplaint.title}</p>
                                  <p><strong>Complained to:</strong> {linkedComplaint.complaintTo}</p>
                                  <p><strong>When Complained:</strong> {formatDate(linkedComplaint.complaintDate)}</p>
                                </>
                              );
                            }
                          }
                          // Fallback to event's own complaint data if no linked complaint found
                          return (
                            <>
                              <p><strong>Complained to:</strong> {event.complaintTo || 'Not specified'}</p>
                              <p><strong>When Complained:</strong> {event.complaintDate ? formatDate(event.complaintDate) : 'Not specified'}</p>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Display company response information if any */}
                    {event.companyDidRespond !== undefined && (
                      <div className={`mb-2 p-2 rounded text-sm ${
                        event.companyDidRespond 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            event.companyDidRespond ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            🏢 Company Response
                          </span>
                        </div>
                        <p className="text-foreground"><strong>Company Responded:</strong> {event.companyDidRespond ? 'Yes' : 'No'}</p>
                        {event.companyDidRespond && event.companyResponseDate && (
                          <p className="text-foreground"><strong>Response Date:</strong> {formatDate(event.companyResponseDate)}</p>
                        )}
                        {event.companyDidRespond && event.companyResponseDetails && (
                          <div>
                            <p className="text-foreground"><strong>What the company did:</strong></p>
                            <p className="text-muted-foreground italic pl-2">{event.companyResponseDetails}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Display attachments if any */}
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">📎 Attachments:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.attachments.map((attachment) => (
                            <span
                              key={attachment.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                            >
                              {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {Object.keys(event.details).length > 0 && (
                      <div className="text-xs text-muted-foreground">
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
