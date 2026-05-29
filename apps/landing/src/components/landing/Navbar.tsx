import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function scrollToSignup() {
    document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-200',
        scrolled && 'border-b border-border bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="text-lg font-semibold text-foreground">Eventsnare</span>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <button
            onClick={scrollToSignup}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get early access
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-border bg-background px-6 py-4 md:hidden">
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </a>
          <button
            onClick={scrollToSignup}
            className="rounded-lg bg-primary px-4 py-2 text-left text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get early access
          </button>
        </div>
      )}
    </nav>
  )
}
