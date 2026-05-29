import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

const PORTAL_ID = 'notifications-portal';

function mount() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PORTAL_ID)) return;
  const host = document.createElement('div');
  host.id = PORTAL_ID;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(createElement(StrictMode, null, createElement(NotificationBell)));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}
