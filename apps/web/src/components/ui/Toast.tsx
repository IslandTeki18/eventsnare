import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error';

interface ToastInput {
  title: string;
  body?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface Toast extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 5000;

// ponytail: minimal queue — no stacking cap, no swipe-to-dismiss, no entry animation.
// Add those if toasts ever pile up or product asks for them.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { ...input, id }]);
      setTimeout(() => dismiss(id), input.durationMs ?? DEFAULT_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="flex items-start gap-2 rounded-lg border border-border bg-background px-4 py-3 shadow-lg"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    t.variant === 'error' && 'text-rose-400',
                    t.variant === 'success' && 'text-emerald-400',
                  )}
                >
                  {t.title}
                </p>
                {t.body ? (
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">{t.body}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
