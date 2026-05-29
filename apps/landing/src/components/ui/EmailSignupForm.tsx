import { useState } from 'react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function EmailSignupForm({ className, id }: { className?: string; id?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [fieldError, setFieldError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError('')

    if (!isValidEmail(email)) {
      setFieldError('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`${import.meta.env.VITE_CONVEX_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={cn('py-4 text-center', className)}>
        <p className="font-medium text-primary">You're on the list.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll email you when Eventsnare launches.
        </p>
      </div>
    )
  }

  return (
    <form id={id} onSubmit={handleSubmit} className={cn('flex flex-col gap-3', className)}>
      <div className="flex gap-2">
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining...' : 'Get early access'}
        </button>
      </div>
      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
      {status === 'error' && (
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      )}
      <p className="text-center text-xs text-muted-foreground">No spam. Launch updates only.</p>
    </form>
  )
}
