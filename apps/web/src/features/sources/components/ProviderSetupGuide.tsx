import { getProviderMeta } from '@/features/sources/lib/providers';
import { IngressUrlDisplay } from '@/features/sources/components/IngressUrlDisplay';

// Numbered, copyable connection guide for a provider (P1). Rendered on the source create form,
// the source detail page, and the onboarding verify step. When ingress identifiers are passed,
// the relevant step shows the live ingress URL with a copy button; otherwise it shows a
// placeholder (the URL only exists once the source is created).

interface ProviderSetupGuideProps {
  provider: string;
  ingressUrl?: string;
  ingressPath?: string;
}

export function ProviderSetupGuide({ provider, ingressUrl, ingressPath }: ProviderSetupGuideProps) {
  const meta = getProviderMeta(provider);
  if (!meta) return null;

  const hasIngress = ingressUrl !== undefined && ingressPath !== undefined;

  return (
    <>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">How to connect {meta.name}</span>
        <a
          href={meta.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {meta.name}&rsquo;s guide ↗
        </a>
      </div>

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {meta.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-full border border-border text-2xs text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 pt-px">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="mt-0.5 text-sm leading-[18px] text-muted-foreground">
                {step.detail}
              </div>
              {step.showIngressUrl ? (
                hasIngress ? (
                  <div className="mt-2">
                    <IngressUrlDisplay url={ingressUrl ?? ''} path={ingressPath ?? ''} />
                  </div>
                ) : (
                  <p className="mt-1 text-xs italic text-subtle">
                    Your ingress URL appears here once the source is created.
                  </p>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
