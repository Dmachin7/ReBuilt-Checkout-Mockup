import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];

function findMeal(id) {
  return ALL_MEALS.find(m => m.id === id);
}

export default function CartSidebar({ cart, doubleProteins, mealCount, onClear }) {
  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const entreeCount = cartEntries
    .filter(([id]) => {
      const meal = findMeal(Number(id));
      return meal && (MEALS_WEEK1.includes(meal) || MEALS_WEEK2.includes(meal));
    })
    .reduce((sum, [, qty]) => sum + qty, 0);

  const subtotal = cartEntries.reduce((sum, [id, qty]) => {
    const meal = findMeal(Number(id));
    if (!meal) return sum;
    const dp = doubleProteins[Number(id)] && meal.doubleProtein ? meal.doubleProteinPrice : 0;
    return sum + (meal.basePrice + dp) * qty;
  }, 0);

  const shipping = 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0">
      <div className="sticky top-32 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-24">
        {/* Header */}
        <div className="bg-brand-charcoal px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-white text-lg">Your Order</h3>
            <div className="flex items-center gap-3">
              {cartEntries.length > 0 && (
                <button
                  onClick={onClear}
                  className="text-xs text-red-300 hover:text-red-200 transition-colors font-medium"
                >
                  Clear
                </button>
              )}
              <span className="text-sm text-gray-300">
                {entreeCount} / {mealCount} entrées
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (entreeCount / mealCount) * 100)}%` }}
            />
          </div>
        </div>

        {/* Items list */}
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {cartEntries.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🛒</div>
              Add meals to see your order here
            </div>
          ) : (
            cartEntries.map(([id, qty]) => {
              const meal = findMeal(Number(id));
              if (!meal) return null;
              const dp = doubleProteins[Number(id)] && meal.doubleProtein;
              const price = (meal.basePrice + (dp ? meal.doubleProteinPrice : 0)) * qty;
              return (
                <div key={id} className="px-4 py-3 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qty}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
                    {dp && (
                      <p className="text-[11px] text-green-600">+ Double Protein</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">${price.toFixed(2)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Totals */}
        {cartEntries.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free pickup</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Est. Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total / week</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Recurring weekly · Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
