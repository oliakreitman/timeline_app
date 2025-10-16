import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContactInfo, EmployerInfo, TimelineEvent, Complaint } from "@/app/page"
import { CalendarDays, Building2, User, FileText, GripVertical, ArrowUpDown, Clock } from "lucide-react"

interface TimelineReviewProps {
  contactInfo: ContactInfo
  employerInfo: EmployerInfo
  events: TimelineEvent[]
  setEvents: (events: TimelineEvent[]) => void
  complaints: Complaint[]
}

export function TimelineReview({ contactInfo, employerInfo, events, setEvents, complaints }: TimelineReviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOver, setDraggedOver] = useState<number | null>(null)
  const [isChronological, setIsChronological] = useState(true)

  // Convert complaints to timeline events
  const complaintEvents = complaints.map(complaint => ({
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
  }))

  // Merge events and complaint events
  const allEvents: (TimelineEvent | typeof complaintEvents[0])[] = [...events, ...complaintEvents]
  
  // Helper function to format dates - handles both exact dates and approximate text
  const formatEventDate = (dateString: string) => {
    // Try to parse as a date first
    if (dateString.includes('-')) {
      // It's a valid date string (YYYY-MM-DD format)
      // Parse it as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      return parsedDate.toLocaleDateString()
    }
    // It's approximate text, return as-is
    return dateString
  }

  // Helper function to format birthday (avoiding timezone issues)
  const formatBirthday = (dateString: string) => {
    if (!dateString) return 'Not provided'
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString()
  }

  // Helper function to format employer dates - handles both exact dates and approximate text
  const formatEmployerDate = (dateString: string) => {
    // Try to parse as a date first
    if (dateString.includes('-')) {
      // It's a valid date string (YYYY-MM-DD format)
      // Parse it as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      return parsedDate.toLocaleDateString()
    }
    // It's approximate text, return as-is
    return dateString
  }

  // Smart date parsing for sorting - converts approximate dates to sortable dates
  const parseApproximateDate = (dateString: string): Date => {
    // Try exact date first
    const exactDate = new Date(dateString)
    if (!isNaN(exactDate.getTime()) && dateString.includes('-')) {
      return exactDate
    }

    // Parse approximate dates
    const lowerCase = dateString.toLowerCase()
    const currentYear = new Date().getFullYear()
    
    // Extract year if present
    const yearMatch = dateString.match(/\b(19|20)\d{2}\b/)
    const year = yearMatch ? parseInt(yearMatch[0]) : currentYear

    // Season patterns
    if (lowerCase.includes('spring')) return new Date(year, 2, 15) // Mid March
    if (lowerCase.includes('summer')) return new Date(year, 5, 15) // Mid June
    if (lowerCase.includes('fall') || lowerCase.includes('autumn')) return new Date(year, 8, 15) // Mid September
    if (lowerCase.includes('winter')) return new Date(year, 11, 15) // Mid December

    // Month patterns
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                    'july', 'august', 'september', 'october', 'november', 'december']
    
    for (let i = 0; i < months.length; i++) {
      if (lowerCase.includes(months[i]) || lowerCase.includes(months[i].substring(0, 3))) {
        if (lowerCase.includes('early') || lowerCase.includes('beginning')) {
          return new Date(year, i, 5)
        } else if (lowerCase.includes('late') || lowerCase.includes('end')) {
          return new Date(year, i, 25)
        } else if (lowerCase.includes('mid') || lowerCase.includes('middle')) {
          return new Date(year, i, 15)
        } else {
          return new Date(year, i, 15) // Default to middle of month
        }
      }
    }

    // Holiday patterns
    if (lowerCase.includes('christmas')) return new Date(year, 11, 25)
    if (lowerCase.includes('new year')) return new Date(year, 0, 1)
    if (lowerCase.includes('thanksgiving')) return new Date(year, 10, 25)
    if (lowerCase.includes('halloween')) return new Date(year, 9, 31)

    // Year patterns
    if (lowerCase.includes('beginning') || lowerCase.includes('early')) {
      return new Date(year, 0, 15) // Mid January
    }
    if (lowerCase.includes('end') || lowerCase.includes('late')) {
      return new Date(year, 11, 15) // Mid December
    }
    if (lowerCase.includes('middle') || lowerCase.includes('mid')) {
      return new Date(year, 5, 15) // Mid June
    }

    // Default: use the year if found, otherwise current year, mid year
    return new Date(year, 5, 15)
  }
  
  const eventTypes = [
    { value: "harassment", label: "Harassment/Discrimination" },
    { value: "wrongful-termination", label: "Wrongful Termination" },
    { value: "wage-violation", label: "Wage/Hour Violation" },
    { value: "safety-violation", label: "Safety Violation" },
    { value: "retaliation", label: "Retaliation" },
    { value: "policy-violation", label: "Policy Violation" },
    { value: "other", label: "Other" }
  ]

  // Sort events based on mode
  const displayEvents = isChronological 
    ? [...allEvents].sort((a, b) => 
        parseApproximateDate(a.approximateDate).getTime() - parseApproximateDate(b.approximateDate).getTime()
      )
    : [...allEvents]

  const toggleSortMode = () => {
    if (isChronological) {
      // When switching to custom mode, update the events array to match the chronological order
      // Only update regular events, not complaint events (they're read-only)
      const sortedEvents = [...events].sort((a, b) => 
        parseApproximateDate(a.approximateDate).getTime() - parseApproximateDate(b.approximateDate).getTime()
      )
      setEvents(sortedEvents)
    }
    setIsChronological(!isChronological)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML)
    const target = e.currentTarget as HTMLElement
    target.style.opacity = "0.5"
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDraggedOver(index)
  }

  const handleDragLeave = () => {
    setDraggedOver(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null) return
    
    const newEvents = [...events]
    const draggedEvent = newEvents[draggedIndex]
    
    // Remove the dragged event from its original position
    newEvents.splice(draggedIndex, 1)
    
    // Insert it at the new position
    newEvents.splice(dropIndex, 0, draggedEvent)
    
    setEvents(newEvents)
    setDraggedIndex(null)
    setDraggedOver(null)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = "1"
    setDraggedIndex(null)
    setDraggedOver(null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review Your Information</h3>
        <p className="text-muted-foreground">
          Please review all information before submitting. You can go back to make changes if needed.
        </p>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{contactInfo.firstName} {contactInfo.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{contactInfo.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{contactInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Birthday</p>
              <p>{formatBirthday(contactInfo.birthday)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{contactInfo.address}</p>
            </div>
          </div>
          
          {/* Emergency Contact Information */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-4">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Name</p>
                <p>{contactInfo.emergencyContactName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Phone</p>
                <p>{contactInfo.emergencyContactPhone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Employer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company</p>
              <p>{employerInfo.companyName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p>{employerInfo.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Job Title</p>
              <p>{employerInfo.jobTitle}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
              <p className="capitalize">{employerInfo.employmentType.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p>{formatEmployerDate(employerInfo.startDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p>{employerInfo.endDate ? formatEmployerDate(employerInfo.endDate) : 'Current'}</p>
            </div>
            {employerInfo.payRate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pay Rate</p>
                <p>{employerInfo.payRate}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Timeline Events ({allEvents.length})
            </CardTitle>
            {allEvents.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortMode}
                className="flex items-center gap-2"
              >
                {isChronological ? (
                  <>
                    <ArrowUpDown className="h-4 w-4" />
                    Custom Order
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Chronological
                  </>
                )}
              </Button>
            )}
          </div>
          {allEvents.length > 1 && (
            <p className="text-sm text-muted-foreground">
              {isChronological 
                ? "Events are sorted chronologically. Click 'Custom Order' to manually arrange them."
                : "Drag and drop events to reorder them in your timeline. Click 'Chronological' to auto-sort by date."
              }
            </p>
          )}
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No events have been added to your timeline.
            </p>
          ) : (
            <div className="space-y-4">
              {displayEvents.map((event, index) => (
                <div
                  key={event.id}
                  draggable={events.length > 1 && !isChronological && !('isComplaint' in event && event.isComplaint)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-l-2 ${('isComplaint' in event && event.isComplaint) ? 'border-orange-500/30' : 'border-primary/30'} pl-4 pb-4 relative transition-all duration-200 ${
                    events.length > 1 && !isChronological && !('isComplaint' in event && event.isComplaint) ? 'cursor-move hover:bg-muted/50' : ''
                  } ${
                    draggedOver === index && draggedIndex !== index && !isChronological
                      ? 'bg-primary/10 border-l-primary' 
                      : ''
                  } ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`absolute -left-2 top-0 w-4 h-4 ${('isComplaint' in event && event.isComplaint) ? 'bg-orange-600 dark:bg-orange-500' : 'bg-primary'} rounded-full`}></div>
                  <div className="flex items-start gap-3">
                    {events.length > 1 && !isChronological && !('isComplaint' in event && event.isComplaint) && (
                      <GripVertical className="h-4 w-4 mt-1 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing" />
                    )}
                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${('isComplaint' in event && event.isComplaint) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : 'bg-primary/10 text-primary'}`}>
                          {('isComplaint' in event && event.isComplaint) ? 'Complaint' : (eventTypes.find(t => t.value === event.type)?.label || event.type)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          <strong>{('isComplaint' in event && event.isComplaint) ? 'Complaint Date:' : 'Event Date:'}</strong> {formatEventDate(event.approximateDate)}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1 text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      
                      {/* Complaint Event Details */}
                      {('isComplaint' in event && event.isComplaint) && (
                        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Complained to:</strong> {event.details.complaintTo}</p>
                            <p><strong>Incident Date:</strong> {formatEventDate(event.details.incidentDate)}</p>
                            <p><strong>Related Events:</strong> {event.details.relatedEventIds.length} incident(s)</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Complaint Information */}
                      {('didComplain' in event && event.didComplain) && (
                        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">📢 Complaint Filed</span>
                          </div>
                          {(() => {
                            // If event is linked to a complaint, show complaint data
                            if (event.complaintId) {
                              const linkedComplaint = complaints.find(c => c.id === event.complaintId);
                              if (linkedComplaint) {
                                return (
                                  <>
                                    <p><strong>Complaint Title:</strong> {linkedComplaint.title}</p>
                                    <p><strong>Complained to:</strong> {linkedComplaint.complaintTo}</p>
                                    <p><strong>When Complained:</strong> {formatEventDate(linkedComplaint.complaintDate)}</p>
                                  </>
                                );
                              }
                            }
                            // Fallback to event's own complaint data if no linked complaint found
                            return (
                              <>
                                <p><strong>Complained to:</strong> {('complaintTo' in event ? event.complaintTo : 'Not specified') || 'Not specified'}</p>
                                <p><strong>When Complained:</strong> {('complaintDate' in event && event.complaintDate) ? formatEventDate(event.complaintDate) : 'Not specified'}</p>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Company Response Information */}
                      {('companyDidRespond' in event && event.companyDidRespond) && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-600 dark:text-green-400 font-medium">🏢 Company Response</span>
                          </div>
                          <div className="space-y-1 text-foreground">
                            <p><strong>Company Responded:</strong> Yes</p>
                            {event.companyResponseDate && (
                              <p><strong>Response Date:</strong> {formatEventDate(event.companyResponseDate)}</p>
                            )}
                            {event.companyResponseDetails && (
                              <div>
                                <p><strong>What the company did:</strong></p>
                                <p className="text-muted-foreground italic pl-2">{event.companyResponseDetails}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Company Did Not Respond */}
                      {('companyDidRespond' in event && event.companyDidRespond === false) && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-600 dark:text-red-400 font-medium">🏢 Company Response</span>
                          </div>
                          <p className="text-foreground"><strong>Company Responded:</strong> No</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
        <h4 className="font-semibold mb-2 text-foreground">Next Steps</h4>
        <p className="text-sm text-muted-foreground">
          After submitting this form, our legal team will review your case and contact you within 2-3 business days 
          to discuss your situation and potential legal options. All information provided will be kept strictly confidential.
        </p>
      </div>
    </div>
  )
}