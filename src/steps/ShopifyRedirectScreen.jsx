export default function ShopifyRedirectScreen({ onBack }) {
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

        <h1 className="font-display text-3xl text-gray-900 mb-2">Heading to Shopify…</h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          We're handing off your order to Shopify to complete payment securely.
          You'll be redirected in just a moment.
        </p>

        {/* Shopify badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm mb-8">
          <svg className="w-4 h-4" viewBox="0 0 109 124" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M95.2 24c-.1-.8-.8-1.2-1.3-1.3-.5-.1-11.1-.8-11.1-.8s-7.4-7.3-8.2-8.1c-.8-.8-2.4-.5-3 -.3-.1 0-1.6.5-4.1 1.3C65.3 9 61.9 6.5 57.5 6.5c-.1 0-.2 0-.3 0C56 4.7 54.1 3.7 51.9 3.7c-16.9 0-25 21.1-27.6 31.9-6.6 2-11.3 3.5-11.9 3.7-3.7 1.2-3.8 1.2-4.3 4.7C7.7 46.6 0 104.4 0 104.4l75.7 13.1 32.6-8.1S95.3 24.8 95.2 24zM66.7 17.3c-1.9.6-4.1 1.3-6.4 2-.1-3.2-.5-7.6-2-11.3 4.9.9 7.2 6 8.4 9.3zM54.4 9.2c1.4 3.3 1.9 7.9 2 10.9-2.5.8-5.2 1.6-8 2.5.5-2 1.2-4 2-5.8 1.6-3.5 3.7-6 6-7.6-.1 0-.1 0 0 0zM46.5 5.8c.5 0 1 .2 1.4.4-2.6 1.8-5.3 4.7-7.2 9.1-.7 1.7-1.3 3.4-1.8 5.2-2.9.9-5.8 1.8-8.4 2.6 2.3-8.8 8.1-17.3 16-17.3z" fill="#95BF47"/>
            <path d="M93.9 22.7c-.5-.1-11.1-.8-11.1-.8s-7.4-7.3-8.2-8.1c-.3-.3-.7-.4-1.1-.5l-5.8 117.8 32.6-8.1S95.3 24.8 95.2 24c-.1-.8-.8-1.2-1.3-1.3z" fill="#5E8E3E"/>
            <path d="M57.5 44.8l-4 12.1s-3.5-1.9-7.7-1.9c-6.2 0-6.5 3.9-6.5 4.9 0 5.4 14 7.4 14 20.2 0 10-6.3 16.4-14.8 16.4-10.2 0-15.4-6.4-15.4-6.4l2.7-9s5.4 4.6 9.9 4.6c3 0 4.2-2.3 4.2-4 0-7-11.5-7.3-11.5-19.1 0-9.8 7-19.4 21.2-19.4 5.5 0 8.2 1.5 8.2 1.5l-.3.1z" fill="white"/>
          </svg>
          <span className="text-sm font-semibold text-gray-700">Secured by Shopify</span>
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-8 text-left space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What to expect</p>
          {[
            'Enter your payment details on Shopify's checkout',
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
          ← Back to Allergies
        </button>
      </div>
    </div>
  );
}
