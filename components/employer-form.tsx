import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { EmployerInfo } from "@/app/page"
import { useState, useEffect } from "react"

interface EmployerFormProps {
  employerInfo: EmployerInfo
  setEmployerInfo: (info: EmployerInfo) => void
}

export function EmployerForm({ employerInfo, setEmployerInfo }: EmployerFormProps) {
  const [useExactStartDate, setUseExactStartDate] = useState(true)
  const [useExactEndDate, setUseExactEndDate] = useState(true)

  // Ensure all values are defined to prevent controlled/uncontrolled input errors
  const safeEmployerInfo = {
    companyName: employerInfo.companyName || "",
    location: employerInfo.location || "",
    jobTitle: employerInfo.jobTitle || "",
    startDate: employerInfo.startDate || "",
    endDate: employerInfo.endDate || "",
    payRate: employerInfo.payRate || "",
    employmentType: employerInfo.employmentType || "",
    useExactStartDate: employerInfo.useExactStartDate ?? true,
    useExactEndDate: employerInfo.useExactEndDate ?? true,
  }

  // Initialize date type preferences based on existing data
  useEffect(() => {
    if (safeEmployerInfo.startDate) {
      const parsedDate = new Date(safeEmployerInfo.startDate)
      const isExactDate = !isNaN(parsedDate.getTime()) && safeEmployerInfo.startDate.includes('-')
      setUseExactStartDate(isExactDate)
    }
    if (safeEmployerInfo.endDate) {
      const parsedDate = new Date(safeEmployerInfo.endDate)
      const isExactDate = !isNaN(parsedDate.getTime()) && safeEmployerInfo.endDate.includes('-')
      setUseExactEndDate(isExactDate)
    }
  }, [safeEmployerInfo.startDate, safeEmployerInfo.endDate])

  const handleChange = (field: keyof EmployerInfo, value: string | boolean) => {
    setEmployerInfo({ ...employerInfo, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={safeEmployerInfo.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          placeholder="Enter company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Company Location *</Label>
        <Input
          id="location"
          value={safeEmployerInfo.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="Enter company location (city, state)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title *</Label>
        <Input
          id="jobTitle"
          value={safeEmployerInfo.jobTitle}
          onChange={(e) => handleChange("jobTitle", e.target.value)}
          placeholder="Enter your job title"
        />
      </div>

      {/* Start Date Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="startDateType"
                checked={useExactStartDate}
                onChange={() => {
                  setUseExactStartDate(true)
                  handleChange("startDate", "")
                }}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm text-foreground">I know the exact date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="startDateType"
                checked={!useExactStartDate}
                onChange={() => {
                  setUseExactStartDate(false)
                  handleChange("startDate", "")
                }}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm text-foreground">I only remember approximately</span>
            </label>
          </div>
        </div>

        {useExactStartDate ? (
          <div className="space-y-2">
            <Label htmlFor="startDate">Exact Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={safeEmployerInfo.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="startApproxDate">Approximate Start Date *</Label>
            <Input
              id="startApproxDate"
              type="text"
              value={safeEmployerInfo.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              placeholder="e.g., 'Summer 2023', 'Early March 2024', 'Around Christmas 2022'"
            />
            <p className="text-xs text-muted-foreground">
              Examples: "Summer 2023", "Early March 2024", "Around Christmas 2022", "Late 2023", "Beginning of this year"
            </p>
          </div>
        )}
      </div>

      {/* End Date Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>End Date</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="endDateType"
                checked={useExactEndDate}
                onChange={() => {
                  setUseExactEndDate(true)
                  handleChange("endDate", "")
                }}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm text-foreground">I know the exact date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="endDateType"
                checked={!useExactEndDate}
                onChange={() => {
                  setUseExactEndDate(false)
                  handleChange("endDate", "")
                }}
                className="w-4 h-4 text-primary accent-primary"
              />
              <span className="text-sm text-foreground">I only remember approximately</span>
            </label>
          </div>
        </div>

        {useExactEndDate ? (
          <div className="space-y-2">
            <Label htmlFor="endDate">Exact End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={safeEmployerInfo.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              placeholder="Leave blank if still employed"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="endApproxDate">Approximate End Date</Label>
            <Input
              id="endApproxDate"
              type="text"
              value={safeEmployerInfo.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              placeholder="e.g., 'Summer 2023', 'Early March 2024', 'Still employed'"
            />
            <p className="text-xs text-muted-foreground">
              Examples: "Summer 2023", "Early March 2024", "Still employed", "Late 2023", "Beginning of this year"
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payRate">Pay Rate</Label>
          <Input
            id="payRate"
            value={safeEmployerInfo.payRate}
            onChange={(e) => handleChange("payRate", e.target.value)}
            placeholder="e.g., $20/hour, $50k/year"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type *</Label>
          <Select
            id="employmentType"
            value={safeEmployerInfo.employmentType}
            onChange={(e) => handleChange("employmentType", e.target.value)}
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