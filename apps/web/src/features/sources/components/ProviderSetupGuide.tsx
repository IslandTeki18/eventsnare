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
    <div className="rounded-md border border-border bg-muted/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Connect {meta.name}</h3>
        <a
          href={meta.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {meta.name} docs ↗
        </a>
      </div>

      <ol className="flex flex-col gap-3">
        {meta.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
              {step.showIngressUrl ? (
                hasIngress ? (
                  <div className="mt-2">
                    <IngressUrlDisplay url={ingressUrl ?? ''} path={ingressPath ?? ''} />
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] italic text-muted-foreground">
                    Your ingress URL appears here once the source is created.
                  </p>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
