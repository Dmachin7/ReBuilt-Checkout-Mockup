import { useState } from 'react';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];
const ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));
const BREAKFAST_IDS = new Set(BREAKFAST_ITEMS.map(m => m.id));
const SNACK_IDS = new Set(SNACK_ITEMS.map(m => m.id));

function QtyControl({ item, onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble }) {
  const handler = item.isDouble
    ? { add: () => onAddDouble(item.meal.id), remove: () => onRemoveDouble(item.meal.id) }
    : { add: () => onAddSingle(item.meal.id), remove: () => onRemoveSingle(item.meal.id) };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={handler.remove}
        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center transition-colors"
      >
        −
      </button>
      <span className="text-sm font-semibold text-gray-800 min-w-[18px] text-center">{item.qty}</span>
      <button
        onClick={handler.add}
        className="w-6 h-6 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm flex items-center justify-center transition-colors"
      >
        +
      </button>
    </div>
  );
}

function MobileCartSection({ title, items, onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2 bg-gray-50 border-b border-gray-100">
        {title}
      </p>
      {items.map((item, i) => (
        <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-4 py-2.5 flex items-center gap-3 border-b border-gray-50">
          {item.meal.image ? (
            <img
              src={item.meal.image}
              alt={item.meal.name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📸</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.meal.name}</p>
            <p className="text-xs text-gray-500">{item.isDouble ? 'Double Protein' : 'Single'}</p>
          </div>
          <QtyControl
            item={item}
            onAddSingle={onAddSingle}
            onRemoveSingle={onRemoveSingle}
            onAddDouble={onAddDouble}
            onRemoveDouble={onRemoveDouble}
          />
        </div>
      ))}
    </div>
  );
}

export default function MobileCartBar({
  singles, doubles, mealCount, onContinue, continueLabel, visible = true, onClear,
  continueDisabled = false, onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  onBack, onBackLabel,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const allItems = [];
  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) allItems.push({ meal, qty, isDouble: false, price: meal.basePrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) allItems.push({ meal, qty, isDouble: true, price: (meal.basePrice + (meal.doubleProteinPrice || 0)) * qty });
    }
  });

  const entreeItems    = allItems.filter(item => ENTREE_IDS.has(item.meal.id));
  const breakfastItems = allItems.filter(item => BREAKFAST_IDS.has(item.meal.id));
  const snackItems     = allItems.filter(item => SNACK_IDS.has(item.meal.id));

  const entreeCount = entreeItems.reduce((sum, item) => sum + item.qty, 0);
  const totalItems  = allItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal    = allItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

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
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-40 bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto max-h-[75vh] flex flex-col">
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
            {allItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              <>
                <MobileCartSection
                  title="Entrées"
                  items={entreeItems}
                  onAddSingle={onAddSingle}
                  onRemoveSingle={onRemoveSingle}
                  onAddDouble={onAddDouble}
                  onRemoveDouble={onRemoveDouble}
                />
                <MobileCartSection
                  title="Breakfast"
                  items={breakfastItems}
                  onAddSingle={onAddSingle}
                  onRemoveSingle={onRemoveSingle}
                  onAddDouble={onAddDouble}
                  onRemoveDouble={onRemoveDouble}
                />
                <MobileCartSection
                  title="Snacks"
                  items={snackItems}
                  onAddSingle={onAddSingle}
                  onRemoveSingle={onRemoveSingle}
                  onAddDouble={onAddDouble}
                  onRemoveDouble={onRemoveDouble}
                />
              </>
            )}
          </div>

          {/* Modal footer */}
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex-shrink-0">
            <div className="space-y-1 mb-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-green-600 font-medium text-xs">Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Tax (8%)</span><span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200 text-base">
                <span>Total / week</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={continueDisabled ? undefined : () => { setExpanded(false); onContinue(); }}
              disabled={continueDisabled}
              className={`w-full font-bold py-3 rounded-xl text-sm transition-colors shadow-sm ${
                continueDisabled
                  ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-green hover:bg-brand-green-dark text-white'
              }`}
            >
              {continueLabel || 'Continue →'}
            </button>
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => { onClear?.(); setExpanded(false); }}
                className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Clear cart
              </button>
              {onBack && (
                <button
                  onClick={() => { setExpanded(false); onBack(); }}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  ← {onBackLabel || 'Back'}
                </button>
              )}
            </div>
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
            onClick={continueDisabled ? undefined : onContinue}
            disabled={continueDisabled}
            className={`flex-shrink-0 font-bold text-sm px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors shadow-sm ${
              continueDisabled
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-60'
                : 'bg-brand-green hover:bg-brand-green-dark text-white'
            }`}
          >
            {continueLabel || 'Continue →'}
          </button>
        </div>
      </div>
    </>
  );
}
