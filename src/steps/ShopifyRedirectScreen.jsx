import { useEffect, useState } from 'react';

// Purely cosmetic pause (lets the spinner render a beat before the tab
// navigates away) -- not a real loading wait, so keep it short.
const HANDOFF_DELAY_MS = 300;

// How long to wait for the embedding storefront to take over the navigation
// before giving up and trying it from in here. Comfortably inside the browser's
// transient-activation window (~5s in Chrome) from the customer's Checkout
// click, which the top-level navigation below depends on.
const EMBED_FALLBACK_MS = 3000;

// This app runs in two places: standalone at rebuiltcheckout.netlify.app, and
// framed into the ReBuilt storefront's /mealplan page. The hand-off has to work
// differently in each, so detect which one we're in.
function isEmbedded() {
  try {
    return window.parent !== window;
  } catch {
    // A cross-origin parent that won't even answer the comparison means we're
    // definitely framed.
    return true;
  }
}

// The storefront origin that framed us. The embedding page sends
// strict-origin-when-cross-origin, so the referrer is the bare origin -- exactly
// what postMessage needs, without hardcoding a list of storefront URLs that
// differ across localhost, Oxygen previews, and production.
function embedderOrigin() {
  try {
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch {
    return null;
  }
}

export default function ShopifyRedirectScreen({ onBuildCheckoutUrl, onBack }) {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [buildFailed, setBuildFailed] = useState(false);

  // Building now creates a real Shopify Storefront Cart (see
  // buildCartCheckoutUrl), so it's an async network call instead of pure
  // string assembly -- run it once on mount rather than inline in render.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(onBuildCheckoutUrl())
      .then(url => { if (!cancelled) { if (url) setCheckoutUrl(url); else setBuildFailed(true); } })
      .catch(() => { if (!cancelled) setBuildFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!checkoutUrl) return;

    if (!isEmbedded()) {
      const timer = setTimeout(() => {
        window.location.href = checkoutUrl;
      }, HANDOFF_DELAY_MS);
      return () => clearTimeout(timer);
    }

    // Shopify serves the cart and checkout with `frame-ancestors 'none'` (and
    // X-Frame-Options: DENY), so navigating this frame to the hand-off URL just
    // gets refused and strands the customer on this spinner. Hand the URL up to
    // the storefront page instead and let it navigate at the top level -- see
    // the 'rebuilt:checkout' listener in the storefront's mealplan route. The
    // URL carries no secrets (it's built from public Storefront API data plus a
    // discount code the customer typed), so falling back to '*' when the
    // referrer is unavailable is acceptable.
    const handoff = setTimeout(() => {
      window.parent.postMessage(
        { type: 'rebuilt:checkout', url: checkoutUrl },
        embedderOrigin() || '*',
      );
    }, HANDOFF_DELAY_MS);

    // If the embedder is an older build with no listener for that message,
    // nothing happens and the customer waits here forever. Escape the frame
    // ourselves as a last resort. Best-effort: browsers may refuse a
    // cross-origin top-level navigation without throwing, in which case the
    // frame-level navigation below is the final (visibly failing) attempt.
    const fallback = setTimeout(() => {
      try {
        window.top.location.href = checkoutUrl;
      } catch {
        window.location.href = checkoutUrl;
      }
    }, EMBED_FALLBACK_MS);

    return () => {
      clearTimeout(handoff);
      clearTimeout(fallback);
    };
  }, [checkoutUrl]);

  // When a customer hits the browser's physical back button from Shopify's
  // real checkout page, the browser restores this exact frozen screen from
  // bfcache (pageshow fires with persisted:true) rather than reloading the
  // app fresh -- left alone, that strands them on a static "Heading to
  // checkout..." spinner that looks like it's mid-navigation. Forward them
  // straight into an editable step instead.
  useEffect(() => {
    function handlePageShow(e) {
      if (e.persisted) onBack();
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [onBack]);

  if (buildFailed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="font-display text-2xl text-gray-900 mb-2">Couldn't build your order</h1>
          <p className="text-gray-500 text-sm mb-8">
            Something's missing from your selections, or we couldn't reach Shopify just now. Go back and double-check your order, then try again.
          </p>
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            ← Back to Order Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">

        {/* Logo ringed by a spinning loader */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-green border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2.5 rounded-full bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="ReBuilt Meals" className="w-full h-full object-contain p-2.5" />
          </div>
        </div>

        <h1 className="font-display text-2xl text-gray-900">Heading to checkout</h1>

        <button
          onClick={onBack}
          className="mt-6 text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← Back to Order Summary
        </button>
      </div>
    </div>
  );
}
