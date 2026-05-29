import { EmailSignupForm } from '@/components/ui/EmailSignupForm'

export function FooterCta() {
  return (
    <section aria-labelledby="heading-cta" className="border-t border-border bg-muted/40 px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <h2 id="heading-cta" className="text-4xl font-bold text-foreground">
          Don&apos;t lose another webhook event.
        </h2>
        <p className="max-w-xl text-xl text-muted-foreground">
          Join the early access list. We&apos;ll email you when Eventsnare launches — and only then.
        </p>
        <EmailSignupForm className="w-full max-w-md" />
      </div>
    </section>
  )
}
