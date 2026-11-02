import { posthog } from 'posthog-js';

const ALLOWED_HOST_SUFFIXES = ['.posthog.com', '.i.posthog.com', '.posthog.co'];

function isAllowedHost(host: string): boolean {
  try {
    const url = new URL(host.includes('://') ? host : `https://${host}`);
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export function initPostHog(): void {
  if (typeof window === 'undefined' || window === window.parent) return;

  const params = new URLSearchParams(window.location.search);
  const key = params.get('__ph_key');
  const host = params.get('__ph_host');
  if (!key || !host) return;
  if (!isAllowedHost(host)) return;

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
    },
  });
}
