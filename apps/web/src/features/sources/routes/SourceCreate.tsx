import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ProviderGrid } from '@/features/sources/components/ProviderGrid';
import { SourceForm } from '@/features/sources/components/SourceForm';

export function SourceCreate() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<string>();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add a source</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">1. Choose a provider</h2>
        <ProviderGrid selected={provider} onSelect={setProvider} />
      </section>

      {provider ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            2. Configure the source
          </h2>
          <SourceForm
            provider={provider}
            onCreated={(result) => navigate(`/sources/${result.sourceId}`)}
          />
        </section>
      ) : null}
    </div>
  );
}
