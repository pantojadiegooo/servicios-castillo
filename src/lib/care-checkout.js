import { SPECIALIZED_SERVICES } from '../commercial/core/pricing.js';

export const OFFICIAL_STRIPE_CARE_LINKS = Object.freeze({
  basic: 'https://buy.stripe.com/9B614pfk1exq0xh3b1cZa00',
  pro: 'https://buy.stripe.com/6oU9AVfk1cpieo7fXNcZa01',
  enterprise: 'https://buy.stripe.com/eVqeVf8VD1KE4NxaDtcZa02',
});

// Prices stay in the existing commercial source of truth. Only public Stripe
// URLs belong here; this integration never needs a secret key in the frontend.
export const CARE_PLANS = Object.freeze(Object.fromEntries(
  Object.entries(SPECIALIZED_SERVICES.CARE.plans).map(([id, plan]) => [id, Object.freeze({
    id,
    name: plan.name,
    amountMxn: plan.priceMxnMonthly,
    amountMinor: Math.round(plan.priceMxnMonthly * 100),
    stripeUrl: OFFICIAL_STRIPE_CARE_LINKS[id],
    envKey: `PUBLIC_STRIPE_CARE_${id.toUpperCase()}_URL`,
    legacyEnvKey: `PUBLIC_CARE_${id.toUpperCase()}_PAYMENT_LINK`,
  })]),
));

export function formatCarePrice(planId) {
  const plan = CARE_PLANS[planId];
  if (!plan) throw new Error('Unknown Castle Care plan');
  return `$${plan.amountMxn.toLocaleString('es-MX')} MXN`;
}

function validateStripeUrl(value, kind, mode, key) {
  // Match the complete canonical URL, rejecting credentials, extra hosts,
  // ports, query strings, fragments, encoded separators and accidental spaces.
  const pattern = kind === 'payment'
    ? /^https:\/\/buy\.stripe\.com\/(?:test_)?[A-Za-z0-9]+$/
    : /^https:\/\/billing\.stripe\.com\/p\/login\/(?:test_)?[A-Za-z0-9]+$/;
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`Castle Care: ${key} must be a canonical Stripe ${kind} URL`);
  }
  const isTest = new URL(value).pathname.split('/').at(-1).startsWith('test_');
  if (isTest !== (mode === 'test')) {
    throw new Error(`Castle Care: ${key} does not match PUBLIC_CARE_STRIPE_MODE`);
  }
  return value;
}

/**
 * SSG configuration. Enabled with official production Stripe Payment Links by default.
 * Passing PUBLIC_CARE_CHECKOUT_ENABLED='false' keeps fallback contact routes.
 * URL validation rejects non-canonical or mixed-mode payment destinations.
 */
export function getCareCheckoutConfig(env = {}, { deployment = 'production' } = {}) {
  const enabledValue = env.PUBLIC_CARE_CHECKOUT_ENABLED;
  if (![undefined, '', 'false', 'true'].includes(enabledValue)) {
    throw new Error('Castle Care: PUBLIC_CARE_CHECKOUT_ENABLED must be true or false');
  }
  const enabled = enabledValue !== 'false';
  const fallbackPlans = Object.fromEntries(Object.entries(CARE_PLANS).map(([id, plan]) => [id, {
    ...plan,
    href: `/contacto?necesidad=cuidado&paquete=${encodeURIComponent(plan.name)}`,
  }]));
  if (!enabled) return { enabled: false, mode: null, plans: fallbackPlans, portalUrl: null };

  const mode = env.PUBLIC_CARE_STRIPE_MODE || 'live';
  if (!['test', 'live'].includes(mode)) {
    throw new Error('Castle Care: PUBLIC_CARE_STRIPE_MODE must be test or live');
  }
  if (mode === 'test' && !['preview', 'development'].includes(deployment)) {
    throw new Error('Castle Care: test payment links are forbidden in production');
  }

  const plans = Object.fromEntries(Object.entries(CARE_PLANS).map(([id, plan]) => {
    const rawUrl = env[plan.envKey] || env[plan.legacyEnvKey] || (mode === 'live' ? OFFICIAL_STRIPE_CARE_LINKS[id] : null);
    const href = validateStripeUrl(rawUrl, 'payment', mode, plan.envKey);
    return [id, { ...plan, href }];
  }));

  if (new Set(Object.values(plans).map(plan => plan.href)).size !== 3) {
    throw new Error('Castle Care: each plan must have its own Stripe Payment Link');
  }

  const rawPortal = env.PUBLIC_STRIPE_CARE_PORTAL_URL || env.PUBLIC_CARE_CUSTOMER_PORTAL_URL;
  const portalUrl = rawPortal
    ? validateStripeUrl(rawPortal, 'portal', mode, 'PUBLIC_STRIPE_CARE_PORTAL_URL')
    : null;

  return { enabled: true, mode, plans, portalUrl };
}
