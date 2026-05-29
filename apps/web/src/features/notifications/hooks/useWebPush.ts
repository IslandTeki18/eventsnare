import { useCallback, useEffect, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { registerServiceWorker } from '@/features/notifications/lib/serviceWorker';
import {
  getExistingSubscription,
  serializeSubscription,
  subscribeToPush,
} from '@/features/notifications/lib/push';

export interface PushSupport {
  serviceWorker: boolean;
  pushManager: boolean;
  notification: boolean;
  isSupported: boolean;
}

export interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

type ActionStatus = 'idle' | 'working';

function detectSupport(): PushSupport {
  const serviceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const pushManager = typeof window !== 'undefined' && 'PushManager' in window;
  const notification = typeof window !== 'undefined' && 'Notification' in window;
  return {
    serviceWorker,
    pushManager,
    notification,
    isSupported: serviceWorker && pushManager && notification,
  };
}

export function useWebPush() {
  const [support] = useState<PushSupport>(detectSupport);
  const [permission, setPermission] = useState<NotificationPermission>(
    support.notification ? Notification.permission : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState<ActionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSend, setLastSend] = useState<SendResult | null>(null);

  const subscriptionCount = useQuery(api.pushSubscriptions.getMySubscriptionCount);
  const saveSubscription = useMutation(api.pushSubscriptions.saveSubscription);
  const deleteSubscription = useMutation(api.pushSubscriptions.deleteSubscription);
  const sendTestPush = useAction(api.push.sendTestPush);

  // Reflect any subscription that already exists in this browser.
  useEffect(() => {
    if (!support.isSupported) return;
    let cancelled = false;
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      if (!registration || cancelled) return;
      const existing = await getExistingSubscription(registration);
      if (!cancelled) setIsSubscribed(existing !== null);
    });
    return () => {
      cancelled = true;
    };
  }, [support.isSupported]);

  const enable = useCallback(async () => {
    setError(null);
    setStatus('working');
    try {
      const registration = await registerServiceWorker();

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        throw new Error(
          result === 'denied'
            ? 'Permission denied. Reset notifications for this site in your browser settings to try again.'
            : 'Permission was dismissed. Click Enable and accept the prompt.',
        );
      }

      const existing = await getExistingSubscription(registration);
      const subscription = existing ?? (await subscribeToPush(registration));
      await saveSubscription({
        ...serializeSubscription(subscription),
        userAgent: navigator.userAgent,
      });
      setIsSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable push');
    } finally {
      setStatus('idle');
    }
  }, [saveSubscription]);

  const disable = useCallback(async () => {
    setError(null);
    setStatus('working');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration ? await getExistingSubscription(registration) : null;
      if (subscription) {
        const { endpoint } = subscription;
        await subscription.unsubscribe();
        await deleteSubscription({ endpoint });
      }
      setIsSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable push');
    } finally {
      setStatus('idle');
    }
  }, [deleteSubscription]);

  const sendTest = useCallback(async () => {
    setError(null);
    setStatus('working');
    try {
      const result = await sendTestPush({});
      setLastSend(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send push');
    } finally {
      setStatus('idle');
    }
  }, [sendTestPush]);

  return {
    support,
    permission,
    isSubscribed,
    subscriptionCount: subscriptionCount ?? 0,
    isBusy: status === 'working',
    error,
    lastSend,
    enable,
    disable,
    sendTest,
  };
}
