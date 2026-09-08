import { EmailSignupForm } from '@/components/ui/EmailSignupForm'
import { PROVIDERS } from './providers'

export function Hero() {
  return (
    <section aria-label="Hero" className="border-b border-border">
      <div className="mx-auto max-w-[1080px] px-6 pb-[72px] pt-[88px]">
        <h1 className="max-w-[16em] text-[clamp(38px,6vw,60px)] font-semibold leading-[1.04] tracking-[-0.035em]">
          Webhooks break.
          <br />
          Your events shouldn&apos;t.
        </h1>

        <p className="mt-[22px] max-w-[640px] text-[16.5px] leading-[27px] text-muted-foreground">
          Eventsnare sits between your webhook providers and your app. It verifies every
          signature, durably stores every event, and delivers it to your endpoint — with retries,
          deduplication, and one-click replay. So a missed Stripe payment never silently vanishes
          again.
        </p>

        <EmailSignupForm id="email-signup" className="mt-[30px] max-w-[440px]" />

        <div className="mt-11">
          <p className="text-sm text-subtle">Works with the tools you already use</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-[26px] gap-y-3">
            {PROVIDERS.map(({ name, Icon }) => (
              <span key={name} className="inline-flex items-center gap-2 text-muted-foreground">
                <Icon size={20} />
                <span className="text-base">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
