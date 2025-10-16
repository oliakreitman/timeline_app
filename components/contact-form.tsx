import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContactInfo } from "@/app/page"

interface ContactFormProps {
  contactInfo: ContactInfo
  setContactInfo: (info: ContactInfo) => void
}

export function ContactForm({ contactInfo, setContactInfo }: ContactFormProps) {
  const handleChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo({ ...contactInfo, [field]: value })
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (field: keyof ContactInfo, value: string) => {
    const formatted = formatPhoneNumber(value)
    setContactInfo({ ...contactInfo, [field]: formatted })
  }

  // Ensure all values are defined to prevent controlled/uncontrolled input errors
  const safeContactInfo = {
    firstName: contactInfo.firstName || "",
    lastName: contactInfo.lastName || "",
    email: contactInfo.email || "",
    phone: contactInfo.phone || "",
    address: contactInfo.address || "",
    birthday: contactInfo.birthday || "",
    emergencyContactName: contactInfo.emergencyContactName || "",
    emergencyContactPhone: contactInfo.emergencyContactPhone || "",
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={safeContactInfo.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={safeContactInfo.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={safeContactInfo.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="Enter your email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={safeContactInfo.phone}
          onChange={(e) => handlePhoneChange("phone", e.target.value)}
          placeholder="(555) 123-4567"
          maxLength={14}
        />
        <p className="text-xs text-muted-foreground">Format: (555) 123-4567</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={safeContactInfo.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter your full address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthday">Birthday *</Label>
        <Input
          id="birthday"
          type="date"
          value={safeContactInfo.birthday}
          onChange={(e) => handleChange("birthday", e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
            <Input
              id="emergencyContactName"
              value={safeContactInfo.emergencyContactName}
              onChange={(e) => handleChange("emergencyContactName", e.target.value)}
              placeholder="Enter emergency contact's full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              value={safeContactInfo.emergencyContactPhone}
              onChange={(e) => handlePhoneChange("emergencyContactPhone", e.target.value)}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            <p className="text-xs text-muted-foreground">Format: (555) 123-4567</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Required fields. Your information will be kept confidential and used only for legal representation purposes.
      </p>
    </div>
  )
}