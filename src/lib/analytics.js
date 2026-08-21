// GA4 event names/params match what the other ReBuilt checkout already
// sends -- this is what lets both flows show up in the same funnel report
// without extra GA4 configuration. Don't rename these.
export function rbStep(name, params) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, Object.assign({ checkout_version: 'new' }, params || {}));
}

export const GA_MEASUREMENT_ID = 'G-C3MM8Z4V9Y';

// Defers `fn` (a navigation/handoff to Shopify) until gtag's client_id
// round-trip resolves, so the queued rb_checkout_clicked hit -- and GA's
// own cross-domain linker decoration -- has a chance to complete before the
// page unloads. A bare `window.location.href = url` can abort a
// just-queued analytics beacon before it's actually sent.
export function afterAnalyticsFlush(fn) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('get', GA_MEASUREMENT_ID, 'client_id', fn);
  } else {
    fn();
  }
}
