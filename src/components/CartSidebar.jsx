import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];
const ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));

function findMeal(id) { return ALL_MEALS.find(m => m.id === id); }

export default function CartSidebar({ singles, doubles, mealCount, onClear }) {
  const cartItems = [];

  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = findMeal(Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: false, price: meal.basePrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = findMeal(Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: true, price: (meal.basePrice + (meal.doubleProteinPrice || 0)) * qty });
    }
  });

  const entreeCount = cartItems
    .filter(item => ENTREE_IDS.has(item.meal.id))
    .reduce((sum, item) => sum + item.qty, 0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="hidden lg:flex flex-col w-96 xl:w-[28rem] flex-shrink-0">
      <div className="sticky top-32 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-24">
        <div className="bg-brand-charcoal px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-white text-lg">Your Order</h3>
            <div className="flex items-center gap-3">
              {cartItems.length > 0 && (
                <button onClick={onClear} className="text-xs text-red-300 hover:text-red-200 transition-colors font-medium">
                  Clear
                </button>
              )}
              <span className="text-sm text-gray-300">{entreeCount} / {mealCount} entrées</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (entreeCount / mealCount) * 100)}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50 max-h-[32rem] overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🛒</div>
              Add meals to see your order here
            </div>
          ) : (
            cartItems.map((item, i) => (
              <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-4 py-3 flex items-center gap-3">
                {item.meal.image ? (
                  <img
                    src={item.meal.image}
                    alt={item.meal.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{item.meal.name}</p>
                  {item.isDouble && <p className="text-[11px] text-green-600">2× Protein</p>}
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-800">${item.price.toFixed(2)}</span>
                  <span className="text-[11px] text-gray-400">qty {item.qty}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free pickup</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Est. Tax (8%)</span><span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total / week</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Recurring weekly · Cancel anytime</p>
          </div>
        )}
      </div>
    </div>
  );
}
