"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ContactForm } from "@/components/contact-form"
import { EmployerForm } from "@/components/employer-form"
import { EventBuilder } from "@/components/event-builder"
import { TimelineReview } from "@/components/timeline-review"
import { AuthDemo } from "@/components/auth/auth-demo"
import { SuccessModal } from "@/components/ui/success-modal"
import { useAuth } from "@/lib/auth-context"
import { saveTimelineSubmission, getUserTimelineSubmission, TimelineSubmission } from "@/lib/database"
import { sortTimelineEvents } from "@/lib/utils"
import { isUserAuthenticated } from "@/lib/auth"
import { FormCache, CACHE_KEYS } from "@/lib/cache"
import { Scale } from "lucide-react"
import Image from "next/image"

export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  birthday: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export interface EmployerInfo {
  companyName: string
  location: string
  jobTitle: string
  startDate: string
  endDate: string
  payRate: string
  employmentType: string
  useExactStartDate?: boolean
  useExactEndDate?: boolean
}

export interface TimelineEvent {
  id: string
  type: string
  title: string
  description: string
  approximateDate: string
  details: Record<string, any>
  attachments?: Array<{
    id: string
    name: string
    type: string
    size: number
    url?: string
  }>
  complaintId?: string // Link to complaint if this event was part of a complaint
  didComplain?: boolean // Whether user complained about this incident
  complaintTo?: string // Who they complained to
  complaintDate?: string // When they complained
}

export interface Complaint {
  id?: string
  userId: string
  title: string
  description: string
  approximateDate: string
  complaintTo: string
  complaintDate: string
  relatedEventIds: string[]
  createdAt: string
  updatedAt: string
}

interface Step {
  id: number
  title: string
  description?: string
}

const steps: Step[] = [
  { id: 1, title: "Contact Information", description: "Your personal details" },
  { id: 2, title: "Employer Information", description: "Workplace details" },
  { id: 3, title: "Timeline Events", description: "Add workplace incidents" },
  { id: 4, title: "Review & Submit" },
]

export default function IntakeForm() {
  const { user, userProfile } = useAuth()
  const [showAuthDemo, setShowAuthDemo] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  })
  const [employerInfo, setEmployerInfo] = useState<EmployerInfo>({
    companyName: "",
    location: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    payRate: "",
    employmentType: "",
  })
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [existingSubmission, setExistingSubmission] = useState<TimelineSubmission | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const progress = (currentStep / steps.length) * 100

  // Load existing timeline data when user signs in
  useEffect(() => {
    const loadExistingTimeline = async () => {
      if (user && !loading) {
        setLoading(true);
        try {
          const submission = await getUserTimelineSubmission(user.uid);
          if (submission) {
            setExistingSubmission(submission);
            // Ensure all contact info fields are defined to prevent controlled/uncontrolled input errors
            setContactInfo({
              firstName: submission.contactInfo.firstName || "",
              lastName: submission.contactInfo.lastName || "",
              email: submission.contactInfo.email || "",
              phone: submission.contactInfo.phone || "",
              address: submission.contactInfo.address || "",
              birthday: submission.contactInfo.birthday || "",
              emergencyContactName: submission.contactInfo.emergencyContactName || "",
              emergencyContactPhone: submission.contactInfo.emergencyContactPhone || "",
            });
            setEmployerInfo(submission.employerInfo);
            // Sort events before setting them in state
            const sortedEvents = sortTimelineEvents([...submission.events]);
            setEvents(sortedEvents);
            // Load complaints if they exist
            if (submission.complaints) {
              setComplaints(submission.complaints);
            }
          }
        } catch (error) {
          console.error("Error loading existing timeline:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadExistingTimeline();
  }, [user]);

  // Auto-save form data to cache
  useEffect(() => {
    if (user) {
      FormCache.set(CACHE_KEYS.CONTACT_INFO, contactInfo, user.uid);
    }
  }, [contactInfo, user]);

  useEffect(() => {
    if (user) {
      FormCache.set(CACHE_KEYS.EMPLOYER_INFO, employerInfo, user.uid);
    }
  }, [employerInfo, user]);

  useEffect(() => {
    if (user) {
      FormCache.set(CACHE_KEYS.EVENTS, events, user.uid);
    }
  }, [events, user]);

  useEffect(() => {
    if (user) {
      FormCache.set(CACHE_KEYS.COMPLAINTS, complaints, user.uid);
    }
  }, [complaints, user]);

  useEffect(() => {
    if (user) {
      FormCache.set(CACHE_KEYS.CURRENT_STEP, currentStep, user.uid);
    }
  }, [currentStep, user]);

  // Load cached data on component mount
  useEffect(() => {
    if (user && !existingSubmission) {
      const cachedContactInfo = FormCache.get<ContactInfo>(CACHE_KEYS.CONTACT_INFO, user.uid);
      const cachedEmployerInfo = FormCache.get<EmployerInfo>(CACHE_KEYS.EMPLOYER_INFO, user.uid);
      const cachedEvents = FormCache.get<TimelineEvent[]>(CACHE_KEYS.EVENTS, user.uid);
      const cachedComplaints = FormCache.get<Complaint[]>(CACHE_KEYS.COMPLAINTS, user.uid);
      const cachedStep = FormCache.get<number>(CACHE_KEYS.CURRENT_STEP, user.uid);

      if (cachedContactInfo) {
        setContactInfo(cachedContactInfo);
      }
      if (cachedEmployerInfo) {
        setEmployerInfo(cachedEmployerInfo);
      }
      if (cachedEvents) {
        setEvents(cachedEvents);
      }
      if (cachedComplaints) {
        setComplaints(cachedComplaints);
      }
      if (cachedStep) {
        setCurrentStep(cachedStep);
      }
    }
  }, [user, existingSubmission]);

  // Show auth demo when no user, hide when user logs in
  useEffect(() => {
    if (!user) {
      setShowAuthDemo(true);
      // Clear any cached data when user signs out
      FormCache.clear();
    } else {
      setShowAuthDemo(false);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      alert("Please sign in to submit your timeline");
      return;
    }

    // Check if user's authentication is still valid
    const isAuthenticated = await isUserAuthenticated();
    if (!isAuthenticated) {
      alert("Your session has expired. Please sign in again.");
      setShowAuthDemo(true);
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        userId: user.uid,
        contactInfo,
        employerInfo,
        events,
        complaints,
        status: 'submitted' as const
      };

      const submissionId = await saveTimelineSubmission(submissionData);
      
      // Update the existing submission state
      setExistingSubmission({
        id: submissionId,
        ...submissionData,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send email notification
      try {
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timelineData: submissionData,
            userEmail: user.email,
            userName: userProfile?.firstName && userProfile?.lastName 
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : userProfile?.displayName || user.email
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok && emailResult.success) {
          console.log('Email notification sent successfully');
        } else {
          console.warn(`Email notification failed: ${emailResult.message}`);
          alert(`Timeline saved successfully, but email notification failed: ${emailResult.message}`);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        alert('Timeline saved successfully, but email notification failed. Please check the console for details.');
      }

      // Clear cache after successful submission
      FormCache.clear(user.uid);
      
      // Show success modal
      setSuccessMessage(existingSubmission ? "Timeline updated successfully! You can review or change it under \"Account\" page" : "Timeline submitted successfully! You can review or change it under \"Account\" page");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting timeline:", error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('auth/invalid-credential')) {
        alert("Your session has expired. Please sign in again.");
        // Force re-authentication
        setShowAuthDemo(true);
      } else {
        alert("Error submitting timeline. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }


  // Show authentication demo if user is not signed in or if showAuthDemo is true
  if (showAuthDemo) {
    return <AuthDemo onBackToApp={() => setShowAuthDemo(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* User info if signed in */}
          {user && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Welcome, {userProfile?.firstName && userProfile?.lastName 
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : userProfile?.displayName || user.email}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthDemo(true)}
                >
                  Account
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image
                src="/kreitman-law-logo.png"
                alt="Kreitman Law, LLC Logo"
                width={96}
                height={96}
                quality={100}
                priority
                className="h-16 w-auto"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${step.id <= currentStep ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step.id}
                </div>
                <div className="text-xs font-medium">{step.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{steps[currentStep - 1].title}</CardTitle>
            {steps[currentStep - 1].description && (
              <p className="text-gray-600">{steps[currentStep - 1].description}</p>
            )}
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <ContactForm contactInfo={contactInfo} setContactInfo={setContactInfo} />}

            {currentStep === 2 && <EmployerForm employerInfo={employerInfo} setEmployerInfo={setEmployerInfo} />}

            {currentStep === 3 && <EventBuilder events={events} setEvents={setEvents} complaints={complaints} setComplaints={setComplaints} userId={user?.uid || ''} />}

            {currentStep === 4 && (
              <TimelineReview
                contactInfo={contactInfo}
                employerInfo={employerInfo}
                events={events}
                setEvents={setEvents}
                complaints={complaints}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Next Page
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : existingSubmission ? "Update Timeline" : "Submit Timeline"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={existingSubmission ? "Timeline Updated!" : "Timeline Submitted!"}
        message={successMessage}
        isUpdate={!!existingSubmission}
      />
    </div>
  )
}