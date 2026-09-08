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
    const trimmedEmail = email.trim()

    if (!isValidEmail(trimmedEmail)) {
      setFieldError('Please enter a valid email address.')
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`${import.meta.env.VITE_CONVEX_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
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
      <div id={id} className={cn('py-4', className)}>
        <p className="text-lg font-medium">You're on the list.</p>
        <p className="mt-1 text-base text-muted-foreground">
          We'll email you when Eventsnare launches.
        </p>
      </div>
    )
  }

  return (
    <form
      id={id}
      noValidate
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-[9px]', className)}
    >
      <div className="flex gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-label="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          className="min-w-0 flex-1 rounded-[5px] border border-border bg-transparent px-[11px] py-2 text-[13.5px] text-foreground outline-none focus:border-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-[5px] bg-foreground px-[15px] py-2 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining...' : 'Get early access'}
        </button>
      </div>
      {fieldError && <p role="alert" className="text-base text-destructive">{fieldError}</p>}
      {status === 'error' && (
        <p role="alert" className="text-base text-destructive">
          Something went wrong. Please try again.
        </p>
      )}
      <p className="text-xs text-subtle">No spam. Launch updates only.</p>
    </form>
  )
}
