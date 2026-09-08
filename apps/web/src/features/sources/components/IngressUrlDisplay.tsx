import { useState } from 'react';
import { Button } from '@/components/ui/Button';

// Read-only ingress URL with a copy button. The URL is what the customer pastes into the
// provider dashboard. If HOOKS_BASE_URL is unset on the backend, ingressUrl is empty and we
// show the path so the value is still discoverable.

interface IngressUrlDisplayProps {
  url: string;
  path: string;
}

export function IngressUrlDisplay({ url, path }: IngressUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const value = url || path;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <code className="min-w-0 flex-1 basis-[280px] overflow-x-auto whitespace-nowrap rounded-md border border-border bg-panel px-[11px] py-2 font-mono text-xs">
        {value}
      </code>
      <Button onClick={() => void handleCopy()}>{copied ? 'Copied' : 'Copy'}</Button>
    </div>
  );
}
