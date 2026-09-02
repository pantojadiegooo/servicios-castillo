import test from 'node:test';
import assert from 'node:assert/strict';
import { CARE_PLANS, formatCarePrice, getCareCheckoutConfig } from '../src/lib/care-checkout.js';

// Synthetic URLs, never used to charge customers or committed to a deployment.
function configuration(mode = 'live') {
  const prefix = mode === 'test' ? 'test_' : '';
  return {
    PUBLIC_CARE_CHECKOUT_ENABLED: 'true',
    PUBLIC_CARE_STRIPE_MODE: mode,
    PUBLIC_STRIPE_CARE_BASIC_URL: `https://buy.stripe.com/${prefix}BasicFixture`,
    PUBLIC_STRIPE_CARE_PRO_URL: `https://buy.stripe.com/${prefix}ProFixture`,
    PUBLIC_STRIPE_CARE_ENTERPRISE_URL: `https://buy.stripe.com/${prefix}EnterpriseFixture`,
    PUBLIC_STRIPE_CARE_PORTAL_URL: `https://billing.stripe.com/p/login/${prefix}PortalFixture`,
  };
}

test('default production checkout uses official Stripe Payment Links', () => {
  const result = getCareCheckoutConfig();
  assert.equal(result.enabled, true);
  assert.equal(result.mode, 'live');
  assert.equal(result.plans.basic.href, 'https://buy.stripe.com/9B614pfk1exq0xh3b1cZa00');
  assert.equal(result.plans.pro.href, 'https://buy.stripe.com/6oU9AVfk1cpieo7fXNcZa01');
  assert.equal(result.plans.enterprise.href, 'https://buy.stripe.com/eVqeVf8VD1KE4NxaDtcZa02');
  assert.equal(result.portalUrl, null);
});

test('disabled checkout keeps distinct, working contact routes without public Stripe links', () => {
  const result = getCareCheckoutConfig({ PUBLIC_CARE_CHECKOUT_ENABLED: 'false' });
  assert.equal(result.enabled, false);
  assert.equal(result.portalUrl, null);
  for (const [id, plan] of Object.entries(result.plans)) {
    const url = new URL(plan.href, 'https://grupocastillo.lat');
    assert.equal(url.pathname, '/contacto');
    assert.equal(url.searchParams.get('necesidad'), 'cuidado');
    assert.equal(url.searchParams.get('paquete'), CARE_PLANS[id].name);
  }
});

test('approved MXN amounts are converted to cents without changing price', () => {
  assert.deepEqual(Object.values(CARE_PLANS).map(plan => plan.amountMinor), [59000, 99000, 189000]);
  assert.equal(formatCarePrice('enterprise'), '$1,890 MXN');
});

test('live checkout maps all three plans and the customer portal independently', () => {
  const env = configuration();
  const result = getCareCheckoutConfig(env);
  assert.equal(result.enabled, true);
  assert.equal(result.plans.basic.href, env.PUBLIC_STRIPE_CARE_BASIC_URL);
  assert.equal(result.plans.pro.href, env.PUBLIC_STRIPE_CARE_PRO_URL);
  assert.equal(result.plans.enterprise.href, env.PUBLIC_STRIPE_CARE_ENTERPRISE_URL);
  assert.equal(result.portalUrl, env.PUBLIC_STRIPE_CARE_PORTAL_URL);
});

test('legacy PUBLIC_CARE_*_PAYMENT_LINK variables are supported as fallback', () => {
  const legacyEnv = {
    PUBLIC_CARE_CHECKOUT_ENABLED: 'true',
    PUBLIC_CARE_STRIPE_MODE: 'live',
    PUBLIC_CARE_BASIC_PAYMENT_LINK: 'https://buy.stripe.com/LegacyBasic',
    PUBLIC_CARE_PRO_PAYMENT_LINK: 'https://buy.stripe.com/LegacyPro',
    PUBLIC_CARE_ENTERPRISE_PAYMENT_LINK: 'https://buy.stripe.com/LegacyEnterprise',
    PUBLIC_CARE_CUSTOMER_PORTAL_URL: 'https://billing.stripe.com/p/login/LegacyPortal',
  };
  const result = getCareCheckoutConfig(legacyEnv);
  assert.equal(result.enabled, true);
  assert.equal(result.plans.basic.href, legacyEnv.PUBLIC_CARE_BASIC_PAYMENT_LINK);
  assert.equal(result.plans.pro.href, legacyEnv.PUBLIC_CARE_PRO_PAYMENT_LINK);
  assert.equal(result.plans.enterprise.href, legacyEnv.PUBLIC_CARE_ENTERPRISE_PAYMENT_LINK);
  assert.equal(result.portalUrl, legacyEnv.PUBLIC_CARE_CUSTOMER_PORTAL_URL);
});

test('all custom links are mandatory when running in test mode', () => {
  for (const key of Object.keys(configuration('test')).filter(key => /URL/.test(key) && !/PORTAL/.test(key))) {
    const env = configuration('test');
    delete env[key];
    assert.throws(() => getCareCheckoutConfig(env, { deployment: 'preview' }), new RegExp(key));
  }
});

test('rejects unsafe or noncanonical payment destinations without echoing their values', () => {
  for (const url of [
    'javascript:alert(1)', 'http://buy.stripe.com/fixture',
    'https://buy.stripe.com.evil.example/fixture', 'https://evil.example/fixture',
    'https://secret@buy.stripe.com/fixture', 'https://buy.stripe.com:443/fixture',
    'https://buy.stripe.com/fixture?redirect=evil', 'https://buy.stripe.com/fixture#extra',
    'https://buy.stripe.com/%2Ffixture', ' https://buy.stripe.com/fixture',
    'https://buy.stripe.com/fixture\n', 'https://billing.stripe.com/p/login/fixture',
  ]) {
    const env = { ...configuration(), PUBLIC_STRIPE_CARE_BASIC_URL: url };
    assert.throws(() => getCareCheckoutConfig(env), error => {
      assert.ok(!error.message.includes(url));
      return /PUBLIC_STRIPE_CARE_BASIC_URL/.test(error.message);
    });
  }
});

test('rejects wrong-host portal and duplicate plan links', () => {
  assert.throws(() => getCareCheckoutConfig({
    ...configuration(), PUBLIC_STRIPE_CARE_PORTAL_URL: 'https://evil.example/portal',
  }), /PORTAL/);
  const env = configuration();
  env.PUBLIC_STRIPE_CARE_PRO_URL = env.PUBLIC_STRIPE_CARE_BASIC_URL;
  assert.throws(() => getCareCheckoutConfig(env), /own Stripe Payment Link/);
});

test('sandbox links never enter a production or unspecified deployment', () => {
  assert.throws(() => getCareCheckoutConfig(configuration('test')), /forbidden in production/);
  assert.equal(getCareCheckoutConfig(configuration('test'), { deployment: 'preview' }).mode, 'test');
});

test('mixed live/test links, including the portal, stop the build', () => {
  for (const key of Object.keys(configuration()).filter(key => /URL/.test(key))) {
    const env = { ...configuration(), [key]: configuration('test')[key] };
    assert.throws(() => getCareCheckoutConfig(env), /does not match/);
  }
});

test('misspelled switches fail visibly and explicitly disabled checkout ignores staged links', () => {
  assert.throws(() => getCareCheckoutConfig({ PUBLIC_CARE_CHECKOUT_ENABLED: 'yes' }), /true or false/);
  assert.throws(() => getCareCheckoutConfig({ ...configuration(), PUBLIC_CARE_STRIPE_MODE: 'sandbox' }), /test or live/);
  assert.equal(getCareCheckoutConfig({ ...configuration(), PUBLIC_CARE_CHECKOUT_ENABLED: 'false' }).enabled, false);
});
