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
          <p><strong>Birthday:</strong> {timeline.contactInfo.birthday ? formatDate(timeline.contactInfo.birthday) : 'Not provided'}</p>
          <p><strong>Address:</strong> {timeline.contactInfo.address}</p>
          
          {/* Emergency Contact Information */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Emergency Contact</h4>
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
            <p className="text-gray-500">No events recorded</p>
          ) : (
            <div className="space-y-4">
              {sortEventsByDate(allEvents)
                .map((event, index) => (
                  <div key={event.id} className={`border-l-2 ${
                    ('isComplaint' in event && event.isComplaint) ? 'border-orange-500' : 
                    ('isCompanyResponse' in event && event.isCompanyResponse) ? 'border-green-500' : 
                    'border-blue-500'
                  } pl-4 pb-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        <strong>{
                          ('isComplaint' in event && event.isComplaint) ? 'Complaint Date:' : 
                          ('isCompanyResponse' in event && event.isCompanyResponse) ? 'Response Date:' : 
                          'Event Date:'
                        }</strong> {formatDate(event.approximateDate)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ('isComplaint' in event && event.isComplaint) ? 'bg-orange-100 text-orange-800' : 
                        ('isCompanyResponse' in event && event.isCompanyResponse) ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100'
                      }`}>
                        {('isComplaint' in event && event.isComplaint) ? 'Complaint' : 
                         ('isCompanyResponse' in event && event.isCompanyResponse) ? 'Company Response' : 
                         event.type}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    {/* Complaint Event Details */}
                    {('isComplaint' in event && event.isComplaint) ? (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p><strong>Complained to:</strong> {(event as any).details?.complaintTo || 'Not specified'}</p>
                          <p><strong>Incident Date:</strong> {(event as any).details?.incidentDate ? formatDate((event as any).details.incidentDate) : 'Not specified'}</p>
                          <p><strong>Related Events:</strong> {(event as any).details?.relatedEventIds?.length || 0} incident(s)</p>
                        </div>
                      </div>
                    ) : null}

                    {/* Company Response Event Details */}
                    {('isCompanyResponse' in event && event.isCompanyResponse) ? (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p><strong>Response to:</strong> {(event as any).details?.originalEventTitle || 'Original incident'}</p>
                          <p><strong>Response Details:</strong></p>
                          <p className="text-gray-700 italic pl-2">{(event as any).details?.responseDetails || 'No details provided'}</p>
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Display complaint information if any */}
                    {event.didComplain && (
                      <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-orange-600 font-medium">📢 Complaint Filed</span>
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
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            event.companyDidRespond ? 'text-green-600' : 'text-red-600'
                          }`}>
                            🏢 Company Response
                          </span>
                        </div>
                        <p><strong>Company Responded:</strong> {event.companyDidRespond ? 'Yes' : 'No'}</p>
                        {event.companyDidRespond && event.companyResponseDate && (
                          <p><strong>Response Date:</strong> {formatDate(event.companyResponseDate)}</p>
                        )}
                        {event.companyDidRespond && event.companyResponseDetails && (
                          <div>
                            <p><strong>What the company did:</strong></p>
                            <p className="text-gray-700 italic pl-2">{event.companyResponseDetails}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
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
