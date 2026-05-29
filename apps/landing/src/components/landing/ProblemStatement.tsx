import { Zap, ShieldX, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReveal } from '@/lib/useReveal'

interface ProblemCardProps {
  Icon: LucideIcon
  title: string
  body: string
}

function ProblemCard({ Icon, title, body }: ProblemCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-6">
      <Icon className="text-primary" size={24} />
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

const PROBLEMS = [
  {
    Icon: ShieldX,
    title: 'Signature verification is error-prone',
    body: "Every provider signs payloads differently. One missed header check or wrong secret and you're processing forged events — or silently dropping real ones.",
  },
  {
    Icon: Zap,
    title: "Providers don't retry reliably",
    body: 'Stripe retries for 3 days. GitHub gives you 3 attempts. Shopify retries 19 times over 48 hours. When your endpoint is down for 10 minutes at the wrong moment, you lose events permanently.',
  },
  {
    Icon: RotateCcw,
    title: 'Debugging failures is painful',
    body: "Which event failed? Was it a timeout or a 500? Can you replay it? Without structured delivery history, every incident is a grep through logs.",
  },
] as const

export function ProblemStatement() {
  const heading = useReveal()
  const grid = useReveal()

  return (
    <section aria-labelledby="heading-problems" className="mx-auto max-w-6xl px-6 py-24">
      <div ref={heading.ref} className={heading.className}>
        <h2 id="heading-problems" className="mb-10 text-3xl font-bold text-foreground">
          The problem with webhooks
        </h2>
      </div>
      <div ref={grid.ref} className={grid.className}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROBLEMS.map(p => (
            <ProblemCard key={p.title} {...p} />
          ))}
        </div>
      </div>
    </section>
  )
}
