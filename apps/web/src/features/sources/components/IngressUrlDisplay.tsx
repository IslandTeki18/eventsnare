import { useState } from 'react';

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
    <div className="flex items-center gap-2">
      <code className="flex-1 overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs">
        {value}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
