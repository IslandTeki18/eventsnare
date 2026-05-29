/** Serialized push subscription shape expected by the Convex saveSubscription mutation. */
export interface SerializedSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Decode a base64url VAPID public key into the Uint8Array that
 * PushManager.subscribe expects as applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Read the VAPID public key from the Vite env, throwing a clear error if absent. */
function getApplicationServerKey(): Uint8Array<ArrayBuffer> {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('Missing VITE_VAPID_PUBLIC_KEY in .env.local');
  }
  return urlBase64ToUint8Array(key);
}

/** Normalize a PushSubscription into the plain shape Convex stores. */
export function serializeSubscription(subscription: PushSubscription): SerializedSubscription {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  if (!keys.p256dh || !keys.auth) {
    throw new Error('Push subscription is missing encryption keys');
  }
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  };
}

/** Return the existing push subscription for a registration, if any. */
export async function getExistingSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  return await registration.pushManager.getSubscription();
}

/** Subscribe this browser to push using the configured VAPID public key. */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: getApplicationServerKey(),
  });
}
