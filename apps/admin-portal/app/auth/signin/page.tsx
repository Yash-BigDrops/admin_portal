'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Alert, AlertDescription } from '@repo/ui'

function SignInForm() {
  const [email, setEmail] = useState('admin@bigdrops.com')
  const [password, setPassword] = useState('AdminPortal@2025')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  // Get CSRF token on mount
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf')
        const data = await response.json()
        setCsrfToken(data.csrfToken)
      } catch (error) {
        console.error('Failed to get CSRF token:', error)
      }
    }
    getCsrfToken()
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (!csrfToken) {
      setError('CSRF token not loaded. Please refresh the page.')
      setLoading(false)
      return
    }
    
    try {
      console.log('Attempting sign in with:', { email, password: '***' })
      
      // Use NextAuth v5 signin endpoint with CSRF token
      const formData = new URLSearchParams()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('redirect', 'false')
      formData.append('json', 'true')
      formData.append('csrfToken', csrfToken)
      
      let response: Response | null = null
      try {
        response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
          redirect: 'manual', // Don't follow redirects automatically
        })
        
        console.log('Response status:', response.status)
        console.log('Response type:', response.type)
        
        // Check if it's a redirect (302) or success - both mean login worked
        // Status 0 can occur with opaque redirects
        if (response.status === 302 || response.status === 200 || response.status === 0) {
          // Login successful - redirect immediately
          console.log('✅ Login successful, redirecting to:', callbackUrl)
          window.location.href = callbackUrl
          return // Exit early - don't set loading to false, let redirect happen
        }
      } catch (fetchError) {
        // If fetch itself fails, it might be a network error
        console.error('Fetch error:', fetchError)
        // But if login was successful on server, try redirect anyway
        // Check if we got a response before the error
        if (response && (response.status === 302 || response.status === 0)) {
          console.log('✅ Login successful despite fetch error, redirecting')
          window.location.href = callbackUrl
          return
        }
        setError('Network error. Please check your connection and try again.')
        setLoading(false)
        return
      }
      
      // If no response, something went wrong
      if (!response) {
        setError('No response from server. Please try again.')
        setLoading(false)
        return
      }
      
      // If we get here, login failed - handle error response
      let errorMessage = 'Invalid credentials'
      try {
        // Try to read the response as text first
        const text = await response.text()
        console.log('Error response text:', text)
        
        // Try to parse as JSON
        if (text) {
          try {
            const result = JSON.parse(text)
            errorMessage = result.error || result.message || 'Invalid credentials'
          } catch {
            // Not JSON, check status code
            if (response.status === 401 || response.status === 403) {
              errorMessage = 'Invalid credentials'
            } else if (response.status >= 500) {
              errorMessage = 'Server error. Please try again.'
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        // If we can't parse, use status-based error
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid credentials'
        } else {
          errorMessage = 'An error occurred during signin'
        }
      }
      
      setError(errorMessage)
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during signin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in to Admin Portal</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@bigdrops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
          
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}
