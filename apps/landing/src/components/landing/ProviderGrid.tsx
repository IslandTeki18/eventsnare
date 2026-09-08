import { PROVIDERS } from './providers'
import { SectionHeading } from './SectionHeading'

export function ProviderGrid() {
  return (
    <section aria-labelledby="heading-providers" className="border-b border-border bg-panel">
      <div className="mx-auto max-w-[1080px] px-6 py-[72px]">
        <SectionHeading
          id="heading-providers"
          eyebrow="Providers"
          title="Works with the providers you already use"
          sub="More providers added before and after launch."
        />

        <div className="mt-[30px] overflow-hidden rounded-[7px] border border-border">
          <div className="-ml-px -mt-px grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            {PROVIDERS.map(({ name, descriptor, Icon }) => (
              <div key={name} className="border-l border-t border-border p-5">
                <Icon size={24} className="mb-3.5 block text-muted-foreground" />
                <p className="text-lg font-semibold">{name}</p>
                <p className="mt-1.5 text-sm leading-[18px] text-muted-foreground">{descriptor}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-base text-subtle">
          Using a provider not listed? Custom adapters are on the roadmap.
        </p>
      </div>
    </section>
  )
}
