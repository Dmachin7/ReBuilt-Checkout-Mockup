import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];

export default function StepCheckout({ singles, doubles, onBack, onConfirm }) {
  const cartItems = [];
  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: false, price: meal.basePrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: true, price: (meal.basePrice + (meal.doubleProteinPrice || 0)) * qty });
    }
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  function handleCheckout() {
    onConfirm({ total });
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-16">
      <h2 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">Order Summary</h2>
      <p className="text-gray-500 text-sm mb-8">Review your selection, then head to checkout.</p>

      {/* Subscription clarity */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-xl flex-shrink-0">📋</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm mb-1">Weekly subscription — pause or cancel anytime</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              You'll be charged <strong>${total.toFixed(2)}</strong> for this week's order. After that, the same amount each week until you skip or cancel.{' '}
              <strong>Skip deadline: Thursday 11:59 PM.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Item list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="bg-brand-charcoal px-5 py-4">
          <h3 className="font-display text-white text-lg">Your Meals</h3>
        </div>

        {cartItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <div className="text-4xl mb-2">🛒</div>
            No items — go back and add some meals!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cartItems.map((item, i) => (
              <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-5 py-3.5 flex items-center gap-3">
                {item.meal.image ? (
                  <img
                    src={item.meal.image}
                    alt={item.meal.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📸</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.meal.name}</p>
                  <p className="text-xs text-gray-500">{item.isDouble ? 'Double Protein' : 'Single'} · qty {item.qty}</p>
                </div>
                <span className="text-sm font-bold text-gray-800">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">Calculated at checkout</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Est. Tax (8%)</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Weekly total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <button
          onClick={handleCheckout}
          className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Go to Checkout
          <span className="text-xl">→</span>
        </button>
        <p className="text-center text-xs text-gray-400">
          128-bit SSL encrypted · Powered by Shopify
        </p>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
        >
          ← Back to Allergies
        </button>
      </div>
    </div>
  );
}
