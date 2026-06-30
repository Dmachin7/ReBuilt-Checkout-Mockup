import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { BREAKFAST_ITEMS } from '../data/meals';

const BREAKFAST_IDS = new Set(BREAKFAST_ITEMS.map(m => m.id));

const BREAKFAST_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const PRICING = {
  1:  { perMeal: 9.99 },
  2:  { perMeal: 9.49 },
  3:  { perMeal: 9.49 },
  4:  { perMeal: 8.99 },
  5:  { perMeal: 8.99 },
  6:  { perMeal: 8.49 },
  7:  { perMeal: 8.49 },
  8:  { perMeal: 7.99 },
  9:  { perMeal: 7.99 },
  10: { perMeal: 7.49 },
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
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [countPromptOpen, setCountPromptOpen] = useState(false);

  function guardCount(fn) {
    return (id) => {
      if (!breakfastCount) { setCountPromptOpen(true); return; }
      fn(id);
    };
  }

  const selectedBreakfastNames = BREAKFAST_ITEMS
    .filter(m => (singles[m.id] || 0) + (doubles[m.id] || 0) > 0)
    .map(m => m.name);

  const breakfastSelected = BREAKFAST_ITEMS.reduce(
    (sum, m) => sum + (singles[m.id] || 0) + (doubles[m.id] || 0), 0
  );
  const breakfastComplete = !breakfastCount || breakfastSelected >= breakfastCount;
  const breakfastRemaining = breakfastCount ? Math.max(0, breakfastCount - breakfastSelected) : 0;
  const breakfastAtLimit = breakfastCount !== null && breakfastSelected >= breakfastCount;

  function handleSkipClick() {
    if (breakfastCount || selectedBreakfastNames.length > 0) {
      setSkipConfirmOpen(true);
    } else {
      onSkipBreakfast();
    }
  }

  return (
    <div className="flex gap-6 px-3 sm:px-6 lg:px-10 py-6 max-w-[1800px] mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-6">

        {/* Header */}
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Choose your breakfast</h2>
          {breakfastCount && !breakfastComplete ? (
            <p className="text-sm text-amber-600 font-medium">
              {breakfastRemaining} more breakfast item{breakfastRemaining !== 1 ? 's' : ''} needed
            </p>
          ) : breakfastCount && breakfastComplete ? (
            <p className="text-sm text-brand-green font-semibold">All {breakfastCount} breakfast slots filled ✓</p>
          ) : (
            <p className="text-gray-500 text-sm">Completely optional — your entrées are already saved.</p>
          )}
        </div>

        {/* Count picker */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-3">
            {BREAKFAST_COUNTS.map((n, idx) => {
              const p = PRICING[n];
              const isSelected = breakfastCount === n;
              return (
                <button
                  key={n}
                  onClick={() => onSetBreakfastCount(breakfastCount === n ? null : n)}
                  className={`px-4 py-3 rounded-xl text-left border-2 transition-all min-w-[90px] ${
                    isSelected
                      ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  } ${idx >= 5 ? 'hidden sm:inline-block' : ''}`}
                >
                  <p className="font-bold text-sm">{n}</p>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    ${p.perMeal}/ea
                  </p>
                </button>
              );
            })}
          </div>

          {breakfastCount && (
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-3 py-1.5 rounded-xl animate-reveal">
              <span className="text-green-500">✓</span>
              {breakfastCount} breakfast plates selected
            </div>
          )}

          {/* No breakfast — outlined, not dark */}
          <button
            onClick={handleSkipClick}
            className="mt-3 w-full flex items-center justify-between gap-4 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 rounded-2xl px-5 py-4 transition-colors group"
          >
            <div className="text-left">
              <p className="font-bold text-base leading-tight">No breakfast for me</p>
              <p className="text-gray-400 text-xs mt-0.5">Skip ahead → your entrées are already saved</p>
            </div>
            <div className="w-9 h-9 rounded-full border-2 border-gray-300 group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white flex items-center justify-center text-gray-400 text-lg transition-all flex-shrink-0">
              →
            </div>
          </button>
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

        {/* Breakfast grid */}
        <div className="pt-10 sm:pt-14 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 sm:gap-y-12">
          {BREAKFAST_ITEMS.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              singleQty={singles[meal.id] || 0}
              doubleQty={doubles[meal.id] || 0}
              onAddSingle={guardCount(onAddSingle)}
              onRemoveSingle={onRemoveSingle}
              onAddDouble={guardCount(onAddDouble)}
              onRemoveDouble={onRemoveDouble}
              atLimit={breakfastAtLimit}
              onCardClick={() => setModalMeal(meal)}
              singleLabel="Select"
            />
          ))}
        </div>
      </div>

      <CartSidebar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onClear={onClear}
        onAddSingle={onAddSingle}
        onRemoveSingle={onRemoveSingle}
        onAddDouble={onAddDouble}
        onRemoveDouble={onRemoveDouble}
        onBack={onBack}
        onBackLabel="Back to Entrées"
        breakfastCount={breakfastCount}
        lockEntrees
      />

      <MobileCartBar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel={breakfastComplete ? 'Continue →' : `${breakfastRemaining} more needed`}
        continueDisabled={!breakfastComplete}
        visible
        onClear={onClear}
        onAddSingle={onAddSingle}
        onRemoveSingle={onRemoveSingle}
        onAddDouble={onAddDouble}
        onRemoveDouble={onRemoveDouble}
        onBack={onBack}
        onBackLabel="Back to Entrées"
        lockEntrees
        breakfastCount={breakfastCount}
      />

      {modalMeal && (
        <MealModal
          meal={modalMeal}
          onClose={() => setModalMeal(null)}
          singleQty={singles[modalMeal.id] || 0}
          doubleQty={doubles[modalMeal.id] || 0}
          onAddSingle={guardCount(onAddSingle)}
          onRemoveSingle={onRemoveSingle}
          onAddDouble={guardCount(onAddDouble)}
          onRemoveDouble={onRemoveDouble}
          atLimit={breakfastAtLimit}
        />
      )}

      {/* Plate count required prompt */}
      {countPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-reveal">
            <div className="text-3xl mb-3 text-center">🍳</div>
            <h3 className="font-display text-xl text-gray-900 mb-2 text-center">Choose your plate count first</h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              Select how many breakfast plates you'd like above, then pick your meals.
            </p>
            <button
              onClick={() => setCountPromptOpen(false)}
              className="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-brand-green-dark transition-colors"
            >
              Got it — I'll choose a count
            </button>
          </div>
        </div>
      )}

      {/* Skip confirmation dialog */}
      {skipConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-reveal">
            <h3 className="font-display text-xl text-gray-900 mb-1">Skip breakfast?</h3>
            <p className="text-gray-600 text-sm mb-3">
              You had selected:
            </p>
            <ul className="mb-4 space-y-1">
              {breakfastCount && (
                <li className="text-sm text-gray-500 flex items-start gap-1.5">
                  <span className="text-brand-green mt-0.5 flex-shrink-0">•</span>
                  {breakfastCount} breakfast plate{breakfastCount > 1 ? 's' : ''}
                </li>
              )}
              {selectedBreakfastNames.map(name => (
                <li key={name} className="text-sm text-gray-500 flex items-start gap-1.5">
                  <span className="text-brand-green mt-0.5 flex-shrink-0">•</span>{name}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => { onSkipBreakfast(); setSkipConfirmOpen(false); }}
                className="w-full py-3 rounded-xl bg-brand-charcoal text-white font-bold text-sm hover:bg-gray-800 transition-colors"
              >
                Yes, skip breakfast
              </button>
              <button
                onClick={() => setSkipConfirmOpen(false)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Keep my breakfast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
