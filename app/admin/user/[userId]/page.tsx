"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getUserProfile,
  getUserTimelineSubmission,
  updateSubmissionStatus,
  updateTimelineSubmission,
  UserProfile,
  TimelineSubmission,
  ContactInfo,
  EmployerInfo,
} from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminUserDetail() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [submission, setSubmission] = useState<TimelineSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable form states
  const [editContactInfo, setEditContactInfo] = useState<ContactInfo | null>(null);
  const [editEmployerInfo, setEditEmployerInfo] = useState<EmployerInfo | null>(null);
  const [editEvents, setEditEvents] = useState<TimelineSubmission['events']>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (!authLoading && user && !isAdmin) {
      router.push("/");
      return;
    }

    if (!authLoading && isAdmin && userId) {
      loadUserData();
    }
  }, [user, isAdmin, authLoading, userId, router]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [profile, userSubmission] = await Promise.all([
        getUserProfile(userId),
        getUserTimelineSubmission(userId),
      ]);

      setTargetUser(profile);
      setSubmission(userSubmission);
      
      if (userSubmission) {
        setEditContactInfo(userSubmission.contactInfo);
        setEditEmployerInfo(userSubmission.employerInfo);
        setEditEvents([...userSubmission.events]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "submitted" | "reviewed") => {
    if (!submission?.id) return;

    try {
      setIsSaving(true);
      await updateSubmissionStatus(submission.id, newStatus);
      setSubmission({ ...submission, status: newStatus });
      setSuccessMessage("Status updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!submission?.id || !editContactInfo || !editEmployerInfo) return;

    try {
      setIsSaving(true);
      setError(null);

      await updateTimelineSubmission(submission.id, {
        contactInfo: editContactInfo,
        employerInfo: editEmployerInfo,
        events: editEvents,
      });

      setSubmission({
        ...submission,
        contactInfo: editContactInfo,
        employerInfo: editEmployerInfo,
        events: editEvents,
      });

      setIsEditing(false);
      setSuccessMessage("Changes saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (submission) {
      setEditContactInfo(submission.contactInfo);
      setEditEmployerInfo(submission.employerInfo);
      setEditEvents([...submission.events]);
    }
    setIsEditing(false);
  };

  const updateEventField = (index: number, field: string, value: any) => {
    const newEvents = [...editEvents];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setEditEvents(newEvents);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
              >
                ← Back to Dashboard
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold text-gray-900">
                  User Submission Details
                </h1>
                <p className="text-sm text-gray-500">
                  {targetUser?.firstName} {targetUser?.lastName} ({targetUser?.email})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={!submission}
                >
                  Edit Submission
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              className="text-red-600 underline text-sm mt-1"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {!submission ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No submission found for this user.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/admin")}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* User & Status Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Submission Status</CardTitle>
                    <CardDescription>
                      Submitted: {formatDate(submission.submittedAt)} | Updated: {formatDate(submission.updatedAt)}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(
                      submission.status
                    )}`}
                  >
                    {submission.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant={submission.status === "draft" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("draft")}
                    disabled={isSaving}
                  >
                    Draft
                  </Button>
                  <Button
                    variant={submission.status === "submitted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("submitted")}
                    disabled={isSaving}
                  >
                    Submitted
                  </Button>
                  <Button
                    variant={submission.status === "reviewed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("reviewed")}
                    disabled={isSaving}
                  >
                    Reviewed
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && editContactInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={editContactInfo.firstName}
                        onChange={(e) => setEditContactInfo({...editContactInfo, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={editContactInfo.lastName}
                        onChange={(e) => setEditContactInfo({...editContactInfo, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editContactInfo.email}
                        onChange={(e) => setEditContactInfo({...editContactInfo, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editContactInfo.phone}
                        onChange={(e) => setEditContactInfo({...editContactInfo, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Birthday</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(editContactInfo.birthday)}
                        onChange={(e) => setEditContactInfo({...editContactInfo, birthday: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={editContactInfo.address}
                        onChange={(e) => setEditContactInfo({...editContactInfo, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact Name</Label>
                      <Input
                        value={editContactInfo.emergencyContactName}
                        onChange={(e) => setEditContactInfo({...editContactInfo, emergencyContactName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Emergency Contact Phone</Label>
                      <Input
                        value={editContactInfo.emergencyContactPhone}
                        onChange={(e) => setEditContactInfo({...editContactInfo, emergencyContactPhone: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                      <p className="text-gray-900">{submission.contactInfo.firstName} {submission.contactInfo.lastName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <p className="text-gray-900">{submission.contactInfo.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                      <p className="text-gray-900">{submission.contactInfo.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Birthday</h4>
                      <p className="text-gray-900">{formatDate(submission.contactInfo.birthday)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                      <p className="text-gray-900">{submission.contactInfo.address || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Emergency Contact</h4>
                      <p className="text-gray-900">{submission.contactInfo.emergencyContactName || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Emergency Phone</h4>
                      <p className="text-gray-900">{submission.contactInfo.emergencyContactPhone || "Not provided"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employer Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && editEmployerInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={editEmployerInfo.companyName}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, companyName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={editEmployerInfo.location}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={editEmployerInfo.jobTitle}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, jobTitle: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Employment Type</Label>
                      <Input
                        value={editEmployerInfo.employmentType}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, employmentType: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(editEmployerInfo.startDate)}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(editEmployerInfo.endDate)}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, endDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Pay Rate</Label>
                      <Input
                        value={editEmployerInfo.payRate}
                        onChange={(e) => setEditEmployerInfo({...editEmployerInfo, payRate: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Company Name</h4>
                      <p className="text-gray-900">{submission.employerInfo.companyName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                      <p className="text-gray-900">{submission.employerInfo.location || "Not provided"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Job Title</h4>
                      <p className="text-gray-900">{submission.employerInfo.jobTitle}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Employment Type</h4>
                      <p className="text-gray-900">{submission.employerInfo.employmentType || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Start Date</h4>
                      <p className="text-gray-900">{formatDate(submission.employerInfo.startDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">End Date</h4>
                      <p className="text-gray-900">{submission.employerInfo.endDate ? formatDate(submission.employerInfo.endDate) : "Currently employed"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Pay Rate</h4>
                      <p className="text-gray-900">{submission.employerInfo.payRate || "Not provided"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Events */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Events ({isEditing ? editEvents.length : submission.events.length})</CardTitle>
                <CardDescription>
                  {isEditing ? "Edit event details below" : "Chronological list of reported incidents"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isEditing ? editEvents : submission.events).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events recorded</p>
                ) : (
                  <div className="space-y-4">
                    {(isEditing ? editEvents : submission.events).map((event, index) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4"
                      >
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Event #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">{event.type}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  value={event.title}
                                  onChange={(e) => updateEventField(index, 'title', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Date</Label>
                                <Input
                                  type="date"
                                  value={formatDateForInput(event.approximateDate)}
                                  onChange={(e) => updateEventField(index, 'approximateDate', e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={event.description}
                                onChange={(e) => updateEventField(index, 'description', e.target.value)}
                                rows={3}
                              />
                            </div>
                            {event.didComplain && (
                              <div className="bg-blue-50 rounded p-3 space-y-2">
                                <p className="font-medium text-blue-800 text-sm">Complaint Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Complained To</Label>
                                    <Input
                                      value={event.complaintTo || ''}
                                      onChange={(e) => updateEventField(index, 'complaintTo', e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Complaint Date</Label>
                                    <Input
                                      type="date"
                                      value={formatDateForInput(event.complaintDate)}
                                      onChange={(e) => updateEventField(index, 'complaintDate', e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Company Response Details</Label>
                                  <Textarea
                                    value={event.companyResponseDetails || ''}
                                    onChange={(e) => updateEventField(index, 'companyResponseDetails', e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{event.title}</h4>
                                <p className="text-sm text-gray-500">{event.type} - {formatDate(event.approximateDate)}</p>
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{index + 1}</span>
                            </div>
                            <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                            {event.didComplain && (
                              <div className="bg-blue-50 rounded p-3 text-sm">
                                <p className="font-medium text-blue-800">Complaint Filed</p>
                                <p className="text-blue-700">To: {event.complaintTo || "Not specified"}</p>
                                {event.complaintDate && <p className="text-blue-700">Date: {formatDate(event.complaintDate)}</p>}
                                {event.companyDidRespond !== undefined && (
                                  <p className="text-blue-700">Company Response: {event.companyDidRespond ? "Yes" : "No"}</p>
                                )}
                                {event.companyResponseDetails && (
                                  <p className="text-blue-700 mt-1">Response: {event.companyResponseDetails}</p>
                                )}
                              </div>
                            )}
                            {event.attachments && event.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium text-gray-700 mb-2">Attachments ({event.attachments.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {event.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                                    >
                                      📎 {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints Section */}
            {submission.complaints && submission.complaints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Formal Complaints ({submission.complaints.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.complaints.map((complaint, index) => (
                      <div key={complaint.id || index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                          <span className="text-xs text-gray-500">{formatDate(complaint.complaintDate)}</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{complaint.description}</p>
                        <p className="text-sm text-gray-500">Complained to: {complaint.complaintTo}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floating Save Button when editing */}
            {isEditing && (
              <div className="fixed bottom-6 right-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="shadow-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="shadow-lg"
                >
                  {isSaving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
