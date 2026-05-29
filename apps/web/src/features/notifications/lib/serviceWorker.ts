const SERVICE_WORKER_URL = '/sw.js';

/**
 * Register the push service worker and resolve once it is active and ready.
 * Idempotent: the browser reuses an existing registration for the same URL.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }
  await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  return await navigator.serviceWorker.ready;
}
