import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to dashboard (will be protected by middleware)
  redirect('/dashboard')
}
