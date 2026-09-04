/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  gtag?: (
    command: 'event' | 'config' | 'js' | 'consent' | 'set',
    actionOrDateOrTarget: string | Date,
    params?: Record<string, unknown>
  ) => void;
}

