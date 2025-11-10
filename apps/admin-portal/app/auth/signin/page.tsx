'use client'
import { signIn, getCsrfToken, useSession } from 'next-auth/react'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Alert, AlertDescription } from '@repo/ui'

function SignInForm() {
  const [email, setEmail] = useState('admin@bigdrops.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    const getToken = async () => {
      const token = await getCsrfToken()
      setCsrfToken(token || '')
    }
    getToken()
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      console.log('Attempting sign in with:', { email, password: '***' })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't use NextAuth's redirect
      })
      
      console.log('Sign in result:', result)
      
      if (result?.error) {
        setError('Invalid credentials')
      } else if (result?.ok) {
        // Manual redirect after successful signin
        router.replace(callbackUrl)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during signin')
    } finally {
      setLoading(false)
    }
  }

  // Show loading if checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }
  
  // Don't show signin form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting to dashboard...</div>
      </div>
    )
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
                  
                  <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
                  
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
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn('google', { callbackUrl })}
                    disabled={loading}
                  >
                    Sign in with Google
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
