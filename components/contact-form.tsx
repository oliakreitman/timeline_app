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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={contactInfo.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={contactInfo.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={contactInfo.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="Enter your email address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={contactInfo.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={contactInfo.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Enter your full address"
          required
        />
      </div>

      <p className="text-sm text-muted-foreground">
        * Required fields. Your information will be kept confidential and used only for legal representation purposes.
      </p>
    </div>
  )
}