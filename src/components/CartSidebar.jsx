import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];
const ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));
const BREAKFAST_IDS = new Set(BREAKFAST_ITEMS.map(m => m.id));
const SNACK_IDS = new Set(SNACK_ITEMS.map(m => m.id));

function findMeal(id) { return ALL_MEALS.find(m => m.id === id); }

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

function CartSection({ title, items, onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2 bg-gray-50 border-b border-gray-100">
        {title}
      </p>
      {items.map((item, i) => (
        <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-4 py-2.5 flex items-center gap-2.5 border-b border-gray-50">
          {item.meal.image ? (
            <img
              src={item.meal.image}
              alt={item.meal.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
              🍽️
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 leading-snug truncate">{item.meal.name}</p>
            {item.isDouble && <p className="text-[10px] text-green-600">2× Protein</p>}
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

export default function CartSidebar({
  singles, doubles, mealCount, onClear,
  onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  onBack, onBackLabel,
}) {
  const allItems = [];

  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = findMeal(Number(id));
      if (meal) allItems.push({ meal, qty, isDouble: false, price: meal.basePrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = findMeal(Number(id));
      if (meal) allItems.push({ meal, qty, isDouble: true, price: (meal.basePrice + (meal.doubleProteinPrice || 0)) * qty });
    }
  });

  const entreeItems    = allItems.filter(item => ENTREE_IDS.has(item.meal.id));
  const breakfastItems = allItems.filter(item => BREAKFAST_IDS.has(item.meal.id));
  const snackItems     = allItems.filter(item => SNACK_IDS.has(item.meal.id));

  const entreeCount = entreeItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = allItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="hidden lg:flex flex-col w-96 xl:w-[28rem] flex-shrink-0">
      <div className="sticky top-32 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 9rem)' }}>
        {/* Header */}
        <div className="bg-brand-charcoal px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-white text-lg">Your Order</h3>
            <div className="flex items-center gap-3">
              {allItems.length > 0 && (
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

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {allItems.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🛒</div>
              Add meals to see your order here
            </div>
          ) : (
            <>
              <CartSection
                title="Entrées"
                items={entreeItems}
                onAddSingle={onAddSingle}
                onRemoveSingle={onRemoveSingle}
                onAddDouble={onAddDouble}
                onRemoveDouble={onRemoveDouble}
              />
              <CartSection
                title="Breakfast"
                items={breakfastItems}
                onAddSingle={onAddSingle}
                onRemoveSingle={onRemoveSingle}
                onAddDouble={onAddDouble}
                onRemoveDouble={onRemoveDouble}
              />
              <CartSection
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

        {/* Always-visible totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery</span>
              <span className="text-green-600 font-medium">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Est. Tax (8%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total / week</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Recurring weekly · Cancel anytime</p>

          {onBack && (
            <button
              onClick={onBack}
              className="mt-3 w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-1.5 transition-colors text-center border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              ← {onBackLabel || 'Back'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
