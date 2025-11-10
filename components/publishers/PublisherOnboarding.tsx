'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, User } from 'lucide-react'
import { usePublishers } from '@/lib/hooks/useEverflowData'

interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'completed' | 'current'
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Company details and contact information',
    status: 'current'
  },
  {
    id: 'verification',
    title: 'Identity Verification',
    description: 'Document verification and compliance check',
    status: 'pending'
  },
  {
    id: 'approval',
    title: 'Approval Process',
    description: 'Review and approval by admin team',
    status: 'pending'
  },
  {
    id: 'activation',
    title: 'Account Activation',
    description: 'Final setup and account activation',
    status: 'pending'
  }
]

export default function PublisherOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    businessType: '',
    monthlyTraffic: '',
    experience: '',
    description: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    offerId: '',
    creativeType: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { mutate } = usePublishers()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Map form data to API schema
      const apiPayload = {
        publisherName: formData.contactName || formData.companyName,
        email: formData.email,
        companyName: formData.companyName,
        telegramId: formData.phone || null,
        offerId: formData.offerId || 'pending-assignment',
        creativeType: formData.creativeType || formData.businessType || 'other',
        priority: 'medium' as const,
        additionalNotes: formData.description,
        // Include all extra form fields in the payload (passthrough allows this)
        phone: formData.phone,
        website: formData.website,
        businessType: formData.businessType,
        monthlyTraffic: formData.monthlyTraffic,
        experience: formData.experience,
        taxId: formData.taxId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      }

      const res = await fetch('/api/publishers/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed')
      }

      setSuccess(true)
      
      // Update publishers list if using SWR/React Query
      if (mutate) {
        mutate()
      }
      
      // Reset form after successful submission
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        businessType: '',
        monthlyTraffic: '',
        experience: '',
        description: '',
        taxId: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        offerId: '',
        creativeType: ''
      })
      setCurrentStep(0)
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affiliate-network">Affiliate Network</SelectItem>
                    <SelectItem value="content-creator">Content Creator</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="publisher">Publisher</SelectItem>
                    <SelectItem value="agency">Marketing Agency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="offerId">Offer ID *</Label>
                <Input
                  id="offerId"
                  value={formData.offerId}
                  onChange={(e) => handleInputChange('offerId', e.target.value)}
                  placeholder="Enter offer ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="creativeType">Creative Type *</Label>
                <Select value={formData.creativeType} onValueChange={(value) => handleInputChange('creativeType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select creative type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="native">Native</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyTraffic">Monthly Website Traffic</Label>
                <Select value={formData.monthlyTraffic} onValueChange={(value) => handleInputChange('monthlyTraffic', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select traffic range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1k">0 - 1,000 visitors</SelectItem>
                    <SelectItem value="1k-10k">1,000 - 10,000 visitors</SelectItem>
                    <SelectItem value="10k-100k">10,000 - 100,000 visitors</SelectItem>
                    <SelectItem value="100k-1m">100,000 - 1,000,000 visitors</SelectItem>
                    <SelectItem value="1m+">1,000,000+ visitors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Affiliate Marketing Experience</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="expert">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business and how you plan to promote our offers..."
                rows={4}
              />
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="Enter tax identification number"
                />
              </div>
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state or province"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter ZIP or postal code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review Your Application</h3>
              <p className="text-gray-600 mb-6">
                Please review all information before submitting your application.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Company Information</h4>
                  <p className="text-sm text-gray-600">{formData.companyName}</p>
                  <p className="text-sm text-gray-600">{formData.contactName}</p>
                  <p className="text-sm text-gray-600">{formData.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Business Details</h4>
                  <p className="text-sm text-gray-600">{formData.businessType}</p>
                  <p className="text-sm text-gray-600">{formData.monthlyTraffic} monthly traffic</p>
                  <p className="text-sm text-gray-600">{formData.experience} experience</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Publisher Onboarding</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < onboardingSteps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
              Application submitted successfully! We'll review your request and get back to you soon.
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep === onboardingSteps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
