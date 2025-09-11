import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TimelineEvent, Complaint } from "@/app/page"
import { Plus, Trash2, Edit } from "lucide-react"
import { sortTimelineEvents } from "@/lib/utils"
import { uploadFile } from "@/lib/database"

interface EventBuilderProps {
  events: TimelineEvent[]
  setEvents: (events: TimelineEvent[]) => void
  complaints: Complaint[]
  setComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>
  userId: string
}

export function EventBuilder({ events, setEvents, complaints, setComplaints, userId }: EventBuilderProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [useExactDate, setUseExactDate] = useState(true)
  const [currentEvent, setCurrentEvent] = useState<Partial<TimelineEvent>>({
    type: "",
    title: "",
    description: "",
    approximateDate: "",
    details: {},
    attachments: [],
    didComplain: false,
    complaintTo: "",
    complaintDate: ""
  })
  
  // Store actual File objects for upload
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  
  // Complaint tracking state
  const [showComplaintQuestion, setShowComplaintQuestion] = useState(false)
  const [isCreatingNewComplaint, setIsCreatingNewComplaint] = useState(false)
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("")
  const [newComplaint, setNewComplaint] = useState<Partial<Complaint>>({
    title: "",
    description: "",
    approximateDate: "",
    complaintTo: "",
    complaintDate: "",
    status: "pending"
  })

  const eventTypes = [
    { value: "harassment", label: "Harassment/Discrimination" },
    { value: "wrongful-termination", label: "Wrongful Termination" },
    { value: "wage-violation", label: "Wage/Hour Violation" },
    { value: "safety-violation", label: "Safety Violation" },
    { value: "retaliation", label: "Retaliation" },
    { value: "policy-violation", label: "Policy Violation" },
    { value: "other", label: "Other" }
  ]

  // File handling functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/rtf'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      alert(`File type not allowed: ${file.name}. Please upload images, PDFs, or text documents only.`);
      return false;
    }
    
    if (file.size > maxSize) {
      alert(`File too large: ${file.name}. Maximum size is 10MB.`);
      return false;
    }
    
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Array<{
      id: string
      name: string
      type: string
      size: number
      url?: string
    }> = [];
    
    const newFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        const attachmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        newAttachments.push({
          id: attachmentId,
          name: file.name,
          type: file.type,
          size: file.size
        });
        newFiles.push(file);
      }
    });

    if (newAttachments.length > 0) {
      setCurrentEvent(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...newAttachments]
      }));
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }

    // Reset the input
    event.target.value = '';
  };

  const removeAttachment = (attachmentId: string) => {
    setCurrentEvent(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(att => att.id !== attachmentId) || []
    }));
    
    // Also remove from files to upload (by index)
    setFilesToUpload(prev => {
      const attachment = currentEvent.attachments?.find(att => att.id === attachmentId);
      if (attachment) {
        const index = currentEvent.attachments?.findIndex(att => att.id === attachmentId) || 0;
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleAddEvent = async () => {
    if (currentEvent.type && currentEvent.title && currentEvent.description && currentEvent.approximateDate) {
      try {
        // Upload files first if any
        let attachmentsWithUrls = currentEvent.attachments || [];
        
        if (filesToUpload.length > 0) {
          const uploadPromises = filesToUpload.map(async (file, index) => {
            const attachment = currentEvent.attachments?.[index];
            if (attachment) {
              try {
                const url = await uploadFile(file, userId, attachment.id);
                return {
                  ...attachment,
                  url
                };
              } catch (error) {
                console.error(`Error uploading file ${file.name}:`, error);
                return attachment; // Keep attachment without URL if upload fails
              }
            }
            return null;
          });
          
          const uploadedAttachments = await Promise.all(uploadPromises);
          attachmentsWithUrls = uploadedAttachments.filter(att => att !== null) as any[];
        }
        
        const newEvent: TimelineEvent = {
          id: Date.now().toString(),
          type: currentEvent.type,
          title: currentEvent.title,
          description: currentEvent.description,
          approximateDate: currentEvent.approximateDate,
          details: currentEvent.details || {},
          attachments: attachmentsWithUrls,
          didComplain: currentEvent.didComplain || false,
          complaintTo: currentEvent.complaintTo || "",
          complaintDate: currentEvent.complaintDate || "",
          complaintId: currentEvent.complaintId || ""
        }

        // Handle complaint creation if needed
        let complaintId = currentEvent.complaintId
        if (currentEvent.didComplain && isCreatingNewComplaint && newComplaint.title && newComplaint.description && newComplaint.complaintTo && newComplaint.complaintDate) {
          const newComplaintData: Complaint = {
            id: Date.now().toString() + "_complaint",
            userId: userId,
            title: newComplaint.title,
            description: newComplaint.description,
            approximateDate: currentEvent.approximateDate, // When the incident happened (same as event date)
            complaintTo: newComplaint.complaintTo,
            complaintDate: newComplaint.complaintDate, // When they actually complained
            status: "pending",
            relatedEventIds: [newEvent.id],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          setComplaints(prev => [...prev, newComplaintData])
          complaintId = newComplaintData.id
          newEvent.complaintId = complaintId
        } else if (currentEvent.didComplain && selectedComplaintId) {
          // Add event to existing complaint
          setComplaints(prev => prev.map(complaint => 
            complaint.id === selectedComplaintId 
              ? { ...complaint, relatedEventIds: [...complaint.relatedEventIds, newEvent.id] }
              : complaint
          ))
        }
        
        // Add new event and maintain sorting
        const updatedEvents = [...events, newEvent];
        setEvents(sortTimelineEvents(updatedEvents));
        resetForm()
      } catch (error) {
        console.error("Error adding event:", error);
        alert("Error adding event. Please try again.");
      }
    }
  }

  const handleEditEvent = async () => {
    if (editingId && currentEvent.type && currentEvent.title && currentEvent.description && currentEvent.approximateDate) {
      try {
        // Upload new files first if any
        let attachmentsWithUrls = currentEvent.attachments || [];
        
        if (filesToUpload.length > 0) {
          const uploadPromises = filesToUpload.map(async (file, index) => {
            const attachment = currentEvent.attachments?.[index];
            if (attachment) {
              try {
                const url = await uploadFile(file, userId, attachment.id);
                return {
                  ...attachment,
                  url
                };
              } catch (error) {
                console.error(`Error uploading file ${file.name}:`, error);
                return attachment; // Keep attachment without URL if upload fails
              }
            }
            return null;
          });
          
          const uploadedAttachments = await Promise.all(uploadPromises);
          attachmentsWithUrls = uploadedAttachments.filter(att => att !== null) as any[];
        }
        
        const updatedEvents = events.map(event => 
          event.id === editingId 
            ? { ...event, ...currentEvent, attachments: attachmentsWithUrls } as TimelineEvent
            : event
        )
        // Update events and maintain sorting
        setEvents(sortTimelineEvents(updatedEvents));
        resetForm()
      } catch (error) {
        console.error("Error editing event:", error);
        alert("Error editing event. Please try again.");
      }
    }
  }

    const handleDeleteEvent = (id: string) => {
    // Delete event and maintain sorting
    const updatedEvents = events.filter(event => event.id !== id);
    setEvents(sortTimelineEvents(updatedEvents));
  }

  const startEdit = (event: TimelineEvent) => {
    setCurrentEvent(event)
    setEditingId(event.id)
    setIsAdding(true)
    
    // Determine if the existing date is exact or approximate
    const parsedDate = new Date(event.approximateDate)
    const isExactDate = !isNaN(parsedDate.getTime()) && event.approximateDate.includes('-')
    setUseExactDate(isExactDate)
  }

  const resetForm = () => {
    setCurrentEvent({
      type: "",
      title: "",
      description: "",
      approximateDate: "",
      details: {},
      attachments: [],
      didComplain: false,
      complaintTo: "",
      complaintDate: "",
      complaintId: ""
    })
    setFilesToUpload([])
    setIsAdding(false)
    setEditingId(null)
    setUseExactDate(true)
    setShowComplaintQuestion(false)
    setIsCreatingNewComplaint(false)
    setSelectedComplaintId("")
    setNewComplaint({
      title: "",
      description: "",
      approximateDate: "",
      complaintTo: "",
      complaintDate: "",
      status: "pending"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Timeline Events</h3>
        <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Add/Edit Event Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Event" : "Add New Event"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                id="eventType"
                value={currentEvent.type || ""}
                onChange={(e) => setCurrentEvent({ ...currentEvent, type: e.target.value })}
                required
              >
                <option value="">Select event type</option>
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title *</Label>
              <Input
                id="eventTitle"
                value={currentEvent.title || ""}
                onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                placeholder="Brief title of the incident"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDescription">Description *</Label>
              <Textarea
                id="eventDescription"
                value={currentEvent.description || ""}
                onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                placeholder="Detailed description of what happened..."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date Information *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateType"
                      checked={useExactDate}
                      onChange={() => {
                        setUseExactDate(true)
                        setCurrentEvent({ ...currentEvent, approximateDate: "" })
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">I know the exact date</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateType"
                      checked={!useExactDate}
                      onChange={() => {
                        setUseExactDate(false)
                        setCurrentEvent({ ...currentEvent, approximateDate: "" })
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">I only remember approximately</span>
                  </label>
                </div>
              </div>

              {useExactDate ? (
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Exact Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={currentEvent.approximateDate || ""}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, approximateDate: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="eventApproxDate">Approximate Date *</Label>
                  <Input
                    id="eventApproxDate"
                    type="text"
                    value={currentEvent.approximateDate || ""}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, approximateDate: e.target.value })}
                    placeholder="e.g., 'Summer 2023', 'Early March 2024', 'Around Christmas 2022'"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Examples: "Summer 2023", "Early March 2024", "Around Christmas 2022", "Late 2023", "Beginning of this year"
                  </p>
                </div>
              )}
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>Evidence Attachments</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.txt,.rtf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e)}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-gray-600">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      Images (JPG, PNG, GIF), PDFs, and text documents (DOC, DOCX, TXT) up to 10MB each
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Display uploaded files */}
              {currentEvent.attachments && currentEvent.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  <div className="space-y-2">
                    {currentEvent.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAttachment(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Complaint Tracking Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Complaint Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Did you complain about this incident? This helps track your complaint history.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="didComplain"
                      checked={currentEvent.didComplain === true}
                      onChange={() => {
                        setCurrentEvent({ ...currentEvent, didComplain: true })
                        setShowComplaintQuestion(true)
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Yes, I complained about this</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="didComplain"
                      checked={currentEvent.didComplain === false}
                      onChange={() => {
                        setCurrentEvent({ ...currentEvent, didComplain: false, complaintTo: "", complaintDate: "", complaintId: "" })
                        setShowComplaintQuestion(false)
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">No, I did not complain</span>
                  </label>
                </div>

                {currentEvent.didComplain && showComplaintQuestion && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Is this complaint part of an existing complaint?</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="complaintType"
                            checked={!isCreatingNewComplaint}
                            onChange={() => {
                              setIsCreatingNewComplaint(false)
                              setSelectedComplaintId("")
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">Yes, add to existing complaint</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="complaintType"
                            checked={isCreatingNewComplaint}
                            onChange={() => {
                              setIsCreatingNewComplaint(true)
                              setSelectedComplaintId("")
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">No, create new complaint</span>
                        </label>
                      </div>
                    </div>

                    {!isCreatingNewComplaint && complaints.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="existingComplaint">Select Existing Complaint</Label>
                        <Select
                          id="existingComplaint"
                          value={selectedComplaintId}
                          onChange={(e) => {
                            setSelectedComplaintId(e.target.value)
                            const complaint = complaints.find(c => c.id === e.target.value)
                            if (complaint) {
                              setCurrentEvent({
                                ...currentEvent,
                                complaintId: complaint.id,
                                complaintTo: complaint.complaintTo,
                                complaintDate: complaint.complaintDate
                              })
                            }
                          }}
                        >
                          <option value="">Select a complaint...</option>
                          {complaints.map(complaint => (
                            <option key={complaint.id} value={complaint.id}>
                              {complaint.title} - {complaint.complaintTo} ({complaint.approximateDate})
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    {isCreatingNewComplaint && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="complaintTitle">Complaint Title *</Label>
                          <Input
                            id="complaintTitle"
                            value={newComplaint.title || ""}
                            onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                            placeholder="e.g., 'Harassment Complaint to HR'"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="complaintDescription">Complaint Description *</Label>
                          <Textarea
                            id="complaintDescription"
                            value={newComplaint.description || ""}
                            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                            placeholder="Describe what you complained about..."
                            className="min-h-[80px]"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="complaintTo">Who did you complain to? *</Label>
                            <Input
                              id="complaintTo"
                              value={newComplaint.complaintTo || ""}
                              onChange={(e) => setNewComplaint({ ...newComplaint, complaintTo: e.target.value })}
                              placeholder="e.g., 'HR Department', 'Manager Name'"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="complaintDate">When did you complain? *</Label>
                            <Input
                              id="complaintDate"
                              type="date"
                              value={newComplaint.complaintDate || ""}
                              onChange={(e) => setNewComplaint({ ...newComplaint, complaintDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isCreatingNewComplaint && selectedComplaintId && (
                      <div className="space-y-2">
                        <Label>Complaint Details</Label>
                        <div className="p-3 bg-white rounded border text-sm">
                          <p><strong>Complaint:</strong> {complaints.find(c => c.id === selectedComplaintId)?.title}</p>
                          <p><strong>Complained to:</strong> {currentEvent.complaintTo}</p>
                          <p><strong>Date:</strong> {currentEvent.complaintDate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingId ? handleEditEvent : handleAddEvent}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingId ? "Update Event" : "Add Event"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No events added yet. Click "Add Event" to get started.
          </p>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {eventTypes.find(t => t.value === event.type)?.label || event.type}
                      </span>
                      <span className="text-sm text-muted-foreground">{event.approximateDate}</span>
                    </div>
                    <h4 className="font-semibold mb-2">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    
                    {/* Display attachments if any */}
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.attachments.map((attachment) => (
                            <span
                              key={attachment.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              📎 {attachment.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {events.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length !== 1 ? 's' : ''} added to your timeline.
        </p>
      )}
    </div>
  )
}