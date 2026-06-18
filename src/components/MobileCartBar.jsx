import { useState } from 'react';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];

// Floating pill bar — visible on ALL screen sizes
export default function MobileCartBar({ cart, doubleProteins, mealCount, onContinue, continueLabel, visible = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);

  const entreeCount = cartEntries
    .filter(([id]) => {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      return meal && (MEALS_WEEK1.includes(meal) || MEALS_WEEK2.includes(meal));
    })
    .reduce((sum, [, qty]) => sum + qty, 0);

  const totalItems = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

  const subtotal = cartEntries.reduce((sum, [id, qty]) => {
    const meal = ALL_MEALS.find(m => m.id === Number(id));
    if (!meal) return sum;
    const dp = doubleProteins[Number(id)] && meal.doubleProtein ? meal.doubleProteinPrice : 0;
    return sum + (meal.basePrice + dp) * qty;
  }, 0);

  return (
    // Mobile: full-width floating bar · Desktop: compact centered pill
    <div className="fixed bottom-4 z-40 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[460px]">

      {/* Expanded cart tray */}
      {expanded && (
        <div className="bg-white rounded-t-2xl border border-gray-200 shadow-xl mb-1 max-h-56 overflow-y-auto">
          {cartEntries.length === 0 ? (
            <div className="px-4 py-5 text-center text-gray-400 text-sm">No items yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cartEntries.map(([id, qty]) => {
                const meal = ALL_MEALS.find(m => m.id === Number(id));
                if (!meal) return null;
                const dp = doubleProteins[Number(id)] && meal.doubleProtein;
                const price = (meal.basePrice + (dp ? meal.doubleProteinPrice : 0)) * qty;
                return (
                  <div key={id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {qty}
                    </span>
                    <span className="flex-1 text-sm text-gray-800 truncate">
                      {meal.name}{dp ? ' · 2× Protein' : ''}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">${price.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="px-4 py-3 flex justify-between font-bold text-gray-900 bg-gray-50 text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main pill bar */}
      <div className="bg-brand-charcoal rounded-2xl shadow-2xl flex items-center gap-2 px-3 py-2.5">
        {/* Cart summary — tappable to expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-base">
              🛒
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>

          <div className="text-left min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">
              {entreeCount} of {mealCount} entrées
            </p>
            <p className="text-gray-400 text-xs leading-tight">
              ${subtotal.toFixed(2)} · {expanded ? 'tap to close ▼' : 'tap to view ▲'}
            </p>
          </div>
        </button>

        {/* Continue — prominent pill button */}
        <button
          onClick={onContinue}
          className="flex-shrink-0 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors shadow-sm"
        >
          {continueLabel || 'Continue →'}
        </button>
      </div>
    </div>
  );
}
