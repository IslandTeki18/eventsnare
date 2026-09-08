import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme'

function scrollToSignup() {
  document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })
}

export function Navbar() {
  const [theme, setTheme] = useTheme()

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 border-b border-border bg-background"
    >
      <div className="mx-auto flex h-[57px] max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="h-[7px] w-[7px] bg-foreground" aria-hidden />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Eventsnare</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-[18px]">
          <Link to="/blog" className="text-base text-muted-foreground hover:text-foreground">
            Blog
          </Link>
          <a href="/#pricing" className="text-base text-muted-foreground hover:text-foreground">
            Pricing
          </a>

          <div
            role="group"
            aria-label="Color theme"
            className="hidden overflow-hidden rounded-[5px] border border-border sm:flex"
          >
            {(['dark', 'light'] as const).map((option, i) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={cn(
                  'px-[9px] py-1 text-xs capitalize',
                  i > 0 && 'border-l border-border',
                  theme === option
                    ? 'bg-foreground text-background'
                    : 'text-subtle hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollToSignup}
            className="shrink-0 rounded-[5px] bg-foreground px-[13px] py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get early access
          </button>
        </div>
      </div>
    </nav>
  )
}
