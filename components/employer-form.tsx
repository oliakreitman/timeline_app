import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { EmployerInfo } from "@/app/page"

interface EmployerFormProps {
  employerInfo: EmployerInfo
  setEmployerInfo: (info: EmployerInfo) => void
}

export function EmployerForm({ employerInfo, setEmployerInfo }: EmployerFormProps) {
  const handleChange = (field: keyof EmployerInfo, value: string) => {
    setEmployerInfo({ ...employerInfo, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={employerInfo.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          placeholder="Enter company name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Company Location *</Label>
        <Input
          id="location"
          value={employerInfo.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="Enter company location (city, state)"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title *</Label>
        <Input
          id="jobTitle"
          value={employerInfo.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          placeholder="Enter your job title"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={employerInfo.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={employerInfo.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            placeholder="Leave blank if still employed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payRate">Pay Rate</Label>
          <Input
            id="payRate"
            value={employerInfo.payRate}
            onChange={(e) => handleChange("payRate", e.target.value)}
            placeholder="e.g., $20/hour, $50k/year"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type *</Label>
          <Select
            id="employmentType"
            value={employerInfo.employmentType}
            onChange={(e) => handleChange("employmentType", e.target.value)}
            required
          >
            <option value="">Select employment type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
            <option value="internship">Internship</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * Required fields. This information helps us understand your employment context.
      </p>
    </div>
  )
}