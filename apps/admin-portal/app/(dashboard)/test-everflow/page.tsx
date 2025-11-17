'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui'
import { Alert, AlertDescription } from '@repo/ui'

interface TestResult {
  success: boolean
  data?: any
  error?: string
  status?: number
  endpoint?: string
}

export default function TestEverflowPage() {
  const [testType, setTestType] = useState('advertisers')
  const [advertiserId, setAdvertiserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testEndpoints: Record<string, string> = {
    advertisers: '/api/everflow/advertisers',
    'advertiser-single': '/api/everflow/advertisers',
    publishers: '/api/everflow/publishers',
    offers: '/api/everflow/offers',
    analytics: '/api/everflow/analytics',
  }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      let url = testEndpoints[testType]
      
      if (testType === 'advertiser-single') {
        if (!advertiserId) {
          setResult({
            success: false,
            error: 'Advertiser ID is required',
            endpoint: testEndpoints[testType],
          })
          setLoading(false)
          return
        }
        url = `/api/everflow/advertisers/${advertiserId}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          data: data,
          status: response.status,
          endpoint: url,
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Unknown error',
          status: response.status,
          endpoint: url,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to test API',
        endpoint: testEndpoints[testType],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Everflow API Test</h1>
          <p className="text-gray-600">
            Test Everflow API endpoints to verify configuration and connectivity.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Select an endpoint to test and view the response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="testType">Endpoint to Test</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertisers">Get All Advertisers</SelectItem>
                    <SelectItem value="advertiser-single">Get Single Advertiser</SelectItem>
                    <SelectItem value="publishers">Get Publishers</SelectItem>
                    <SelectItem value="offers">Get Offers</SelectItem>
                    <SelectItem value="analytics">Get Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testType === 'advertiser-single' && (
                <div className="grid gap-2">
                  <Label htmlFor="advertiserId">Advertiser ID</Label>
                  <Input
                    id="advertiserId"
                    value={advertiserId}
                    onChange={(e) => setAdvertiserId(e.target.value)}
                    placeholder="Enter advertiser ID"
                  />
                </div>
              )}

              <Button onClick={handleTest} disabled={loading}>
                {loading ? 'Testing...' : 'Test API'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                {result.success ? '✅ Success' : '❌ Error'}
              </CardTitle>
              <CardDescription>
                Endpoint: {result.endpoint}
                {result.status && ` | Status: ${result.status}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      API call successful! Data received.
                    </AlertDescription>
                  </Alert>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Base URL:</strong> {process.env.NEXT_PUBLIC_EVERFLOW_API_URL || 'Not set (using default)'}
              </p>
              <p>
                <strong>API Key:</strong> {process.env.NEXT_PUBLIC_EVERFLOW_API_KEY ? '✅ Configured' : '❌ Not configured (server-side only)'}
              </p>
              <p className="text-gray-600 text-xs mt-4">
                Note: API key is stored server-side only for security. 
                All API calls are made through Next.js API routes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

