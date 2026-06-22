import { useState } from 'react';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];
const ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));

export default function MobileCartBar({ singles, doubles, mealCount, onContinue, continueLabel, visible = true, onClear }) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

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

  const entreeCount = cartItems.filter(item => ENTREE_IDS.has(item.meal.id)).reduce((sum, item) => sum + item.qty, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      {/* Overlay backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Expanded cart modal — centered on screen */}
      {expanded && (
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-40 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto max-h-[70vh] flex flex-col">
          {/* Modal header */}
          <div className="bg-brand-charcoal px-5 py-4 flex items-center justify-between flex-shrink-0">
            <h3 className="font-display text-white text-lg">Your Order</h3>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Item list */}
          <div className="overflow-y-auto flex-1">
            {cartItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cartItems.map((item, i) => (
                  <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-4 py-3 flex items-center gap-3">
                    {/* Meal image thumbnail */}
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
                      <p className="text-xs text-gray-500">{item.isDouble ? '2× Protein' : 'Single'} · qty {item.qty}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800 flex-shrink-0">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => { onClear?.(); setExpanded(false); }}
                className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear cart
              </button>
              <span className="font-bold text-gray-900">Subtotal ${subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => { setExpanded(false); onContinue(); }}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm"
            >
              {continueLabel || 'Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Floating pill bar — always visible */}
      <div className="fixed bottom-4 z-40 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[460px]">
        <div className="bg-brand-charcoal rounded-2xl shadow-2xl flex items-center gap-2 px-3 py-2.5">
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

          <button
            onClick={onContinue}
            className="flex-shrink-0 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors shadow-sm"
          >
            {continueLabel || 'Continue →'}
          </button>
        </div>
      </div>
    </>
  );
}
