import { EmailSignupForm } from '@/components/ui/EmailSignupForm'

export function FooterCta() {
  return (
    <section aria-labelledby="heading-cta" className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center px-6 py-20 text-center">
        <h2
          id="heading-cta"
          className="max-w-[22em] text-[clamp(26px,4vw,34px)] font-semibold tracking-[-0.03em]"
        >
          Don&apos;t lose another webhook event.
        </h2>
        <p className="mt-3.5 max-w-[36em] text-[15.5px] leading-6 text-muted-foreground">
          Join the early access list. We&apos;ll email you when Eventsnare launches — and only then.
        </p>
        <EmailSignupForm className="mt-[26px] w-full max-w-[440px]" />
      </div>
    </section>
  )
}
