import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { register as registerUser, fetchMe } from '@/lib/auth-client'
import { Lightbulb } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'
import { toast } from 'sonner'
import { Loader } from '@/components/loader'

export const Route = createFileRoute('/(auth)/register')({
  component: SignupPage,
})

function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!isChecking && session?.user) {
      console.log('User already authenticated, redirecting to dashboard')
      navigate({ to: '/dashboard' })
    }
  }, [session, isChecking, navigate])

  useEffect(() => {
    fetchMe()
      .then((s) => setSession(s))
      .finally(() => setIsChecking(false))
  }, [])

  // Show loading while checking auth status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  const handleRegister = async (email: string, name: string, password: string) => {
    setIsLoading(true)
    
    try {
      await registerUser(name, email, password)
      toast.success('Registration successful!')
      navigate({ to: '/dashboard' })
    } catch (error) {
      // Handle unexpected errors
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Lightbulb className="size-4" />
            </div>
            Voltig
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm onRegister={handleRegister} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div> 
  )
} 