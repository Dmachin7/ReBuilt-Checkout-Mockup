import { useEffect } from 'react';

export default function ShopifyRedirectScreen({ checkoutUrl, onBack }) {
  useEffect(() => {
    if (!checkoutUrl) return;
    // Purely cosmetic pause (lets the spinner render a beat before the tab
    // navigates away) -- not a real loading wait, so keep it short.
    const timer = setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 300);
    return () => clearTimeout(timer);
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

  if (!checkoutUrl) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="font-display text-2xl text-gray-900 mb-2">Couldn't build your order</h1>
          <p className="text-gray-500 text-sm mb-8">
            Something's missing from your selections (meal count or meals). Go back and double-check your order.
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

        {/* Animated ring */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-green border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🛍️</span>
          </div>
        </div>

        <h1 className="font-display text-3xl text-gray-900 mb-2">Heading to checkout…</h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          We're handing off your order to complete payment securely.
          You'll be redirected in just a moment.
        </p>

        {/* Secure checkout badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm mb-8">
          <svg className="w-4 h-4 text-brand-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 5v6c0 5.25 3.4 10.16 8 11.5 4.6-1.34 8-6.25 8-11.5V5l-8-3z" fill="currentColor"/>
            <path d="M9.5 12.5l1.8 1.8L15 10.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm font-semibold text-gray-700">Secure checkout</span>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-8 text-left space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What to expect</p>
          {[
            'Enter your payment details at checkout',
            'Subscription starts after your first payment',
            'Manage or cancel anytime from your account',
          ].map((line, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700">{line}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← Back to Order Summary
        </button>
      </div>
    </div>
  );
}
