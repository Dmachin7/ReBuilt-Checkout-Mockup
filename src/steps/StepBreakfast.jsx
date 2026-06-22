import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { BREAKFAST_ITEMS } from '../data/meals';

const BREAKFAST_COUNTS_DEFAULT = [5, 7, 9, 10, 12];
const BREAKFAST_COUNTS_MORE    = [14, 16, 18];

const PRICING = {
  5:  { perMeal: 8.99 },
  7:  { perMeal: 8.49 },
  9:  { perMeal: 7.99 },
  10: { perMeal: 7.99 },
  12: { perMeal: 7.49 },
  14: { perMeal: 6.99 },
  16: { perMeal: 6.49 },
  18: { perMeal: 5.99 },
};

export default function StepBreakfast({
  singles, doubles,
  onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  mealCount, mealMode, breakfastCount,
  onSetBreakfastCount, onSkipBreakfast,
  onNext, onBack, onClear,
}) {
  const [modalMeal, setModalMeal] = useState(null);
  const [chefBannerDismissed, setChefBannerDismissed] = useState(false);
  const [showMoreCounts, setShowMoreCounts] = useState(false);
  const visibleCounts = showMoreCounts
    ? [...BREAKFAST_COUNTS_DEFAULT, ...BREAKFAST_COUNTS_MORE]
    : BREAKFAST_COUNTS_DEFAULT;

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-6">

        {/* Header */}
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Breakfast Add-ons</h2>
          <p className="text-gray-500 text-sm">Completely optional — your entrées are already saved.</p>
        </div>

        {/* Count picker */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">How many breakfast plates?</h3>
          <p className="text-gray-400 text-xs mb-4">Each delivered fresh with your weekly order.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {visibleCounts.map(n => {
              const p = PRICING[n];
              const isSelected = breakfastCount === n;
              return (
                <button
                  key={n}
                  onClick={() => onSetBreakfastCount(n)}
                  className={`px-4 py-3 rounded-xl text-left border-2 transition-all min-w-[90px] ${
                    isSelected
                      ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  <p className="font-bold text-sm">{n}</p>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    ${p.perMeal}/ea
                  </p>
                </button>
              );
            })}
            {!showMoreCounts && (
              <button
                onClick={() => setShowMoreCounts(true)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500 transition-colors min-w-[90px]"
              >
                More ↓
              </button>
            )}
          </div>

          {breakfastCount && (
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1.5 rounded-xl animate-reveal">
              <span className="text-green-500">✓</span>
              {breakfastCount} breakfast plates selected
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">No breakfast for me</p>
            <button
              onClick={onSkipBreakfast}
              className="text-sm text-gray-500 hover:text-gray-800 font-semibold border border-gray-300 hover:border-gray-400 bg-white rounded-full px-4 py-1.5 transition-all"
            >
              Skip breakfast →
            </button>
          </div>
        </section>

        {/* Chef-chosen auto-select banner */}
        {mealMode === 'chef' && breakfastCount && !chefBannerDismissed && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 animate-reveal">
            <span className="text-xl flex-shrink-0">👨‍🍳</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Chef picked your breakfast plates</p>
              <p className="text-amber-700 text-xs mt-0.5">Swap any item you don't love below.</p>
            </div>
            <button
              onClick={() => setChefBannerDismissed(true)}
              className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">— browse breakfast options below —</p>

        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>🍎</span> Snack options available after this step
        </p>

        {/* Breakfast grid — always visible for browsing / enticing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-7">
          {BREAKFAST_ITEMS.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              singleQty={singles[meal.id] || 0}
              doubleQty={doubles[meal.id] || 0}
              onAddSingle={onAddSingle}
              onRemoveSingle={onRemoveSingle}
              onAddDouble={onAddDouble}
              onRemoveDouble={onRemoveDouble}
              atLimit={false}
              onCardClick={() => setModalMeal(meal)}
            />
          ))}
        </div>

        <div className="pt-2">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← Back to Entrées
          </button>
        </div>
      </div>

      <CartSidebar singles={singles} doubles={doubles} mealCount={mealCount} onClear={onClear} />

      <MobileCartBar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel="Continue to Snacks →"
        visible
        onClear={onClear}
      />

      {modalMeal && (
        <MealModal
          meal={modalMeal}
          onClose={() => setModalMeal(null)}
          singleQty={singles[modalMeal.id] || 0}
          doubleQty={doubles[modalMeal.id] || 0}
          onAddSingle={onAddSingle}
          onRemoveSingle={onRemoveSingle}
          onAddDouble={onAddDouble}
          onRemoveDouble={onRemoveDouble}
          atLimit={false}
        />
      )}
    </div>
  );
}
