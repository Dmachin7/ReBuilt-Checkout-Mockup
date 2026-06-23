export default function ConfirmationScreen({ orderDetails, onReset }) {
  const { total, deliveryMode, location } = orderDetails || {};

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">

        {/* Success animation */}
        <div className="w-24 h-24 rounded-full bg-brand-green mx-auto mb-6 flex items-center justify-center shadow-lg">
          <span className="text-5xl">✓</span>
        </div>

        <h1 className="font-display text-3xl text-gray-900 mb-3">You're all set!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your first order is confirmed. We'll start prepping your meals and have them ready for{' '}
          {deliveryMode === 'pickup' && location
            ? `pickup at ${location.name} on ${location.pickupDay}`
            : 'delivery'}.
        </p>

        {/* Summary card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Order total</span>
            <span className="font-bold text-gray-900 text-lg">${total?.toFixed(2)}/week</span>
          </div>

          {deliveryMode === 'pickup' && location && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pickup Details</p>
              <p className="text-sm font-medium text-gray-900">{location.name}</p>
              <p className="text-xs text-gray-500">{location.address}</p>
              <p className="text-xs text-brand-green font-medium mt-1">{location.pickupDay} · {location.pickupWindow}</p>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Skip / Cancel Deadline</p>
            <p className="text-sm text-gray-900">Tuesday at 11:59 PM each week</p>
            <p className="text-xs text-gray-500 mt-0.5">Log into your account to manage your subscription</p>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirmation sent to</p>
            <p className="text-sm text-gray-900">Your email inbox</p>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-brand-mint rounded-2xl p-5 mb-6 text-left">
          <p className="font-semibold text-gray-900 mb-3 text-sm">What happens next?</p>
          <ol className="space-y-2 text-sm text-gray-700">
            {[
              'Confirmation email sent immediately',
              'Meals prep begins Monday morning',
              'Ready for pickup / delivery as scheduled',
              'Skip or cancel anytime before Tuesday',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={onReset}
          className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          Start a New Order
        </button>
      </div>
    </div>
  );
}
