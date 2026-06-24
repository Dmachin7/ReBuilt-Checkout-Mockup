import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { SNACK_ITEMS } from '../data/meals';

const SNACK_IDS = new Set(SNACK_ITEMS.map(m => m.id));

export default function StepSnacks({
  singles, doubles,
  onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  onNext, onSkipSnacks, onBack, mealCount, onClear,
}) {
  const [modalMeal, setModalMeal] = useState(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

  const selectedSnackCount = [
    ...Object.entries(singles),
    ...Object.entries(doubles),
  ].filter(([id]) => SNACK_IDS.has(Number(id))).reduce((sum, [, qty]) => sum + qty, 0);

  const selectedSnackNames = SNACK_ITEMS
    .filter(m => (singles[m.id] || 0) + (doubles[m.id] || 0) > 0)
    .map(m => m.name);

  function handleSkipClick() {
    if (selectedSnackCount > 0) {
      setSkipConfirmOpen(true);
    } else {
      onSkipSnacks();
    }
  }

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-5">

        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Snack Add-ons</h2>
          <p className="text-gray-500 text-sm">Keep momentum between meals. Completely optional.</p>
        </div>

        <button
          onClick={handleSkipClick}
          className="w-full flex items-center justify-between gap-4 bg-brand-charcoal hover:bg-gray-800 text-white rounded-2xl px-6 py-5 transition-colors shadow-md group"
        >
          <div className="text-left">
            <p className="font-bold text-lg leading-tight">No snacks for me</p>
            <p className="text-gray-400 text-sm mt-0.5">Jump to Allergies → your selections are safe</p>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-gray-600 group-hover:border-brand-green group-hover:bg-brand-green flex items-center justify-center text-xl transition-all flex-shrink-0">
            →
          </div>
        </button>

        <p className="text-center text-xs text-gray-400">— or browse snack options below —</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-10">
          {SNACK_ITEMS.map(meal => (
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
            ← Back to Breakfast
          </button>
        </div>
      </div>

      <CartSidebar singles={singles} doubles={doubles} mealCount={mealCount} onClear={onClear} />

      <MobileCartBar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel="Continue →"
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

      {/* Skip confirmation dialog */}
      {skipConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-reveal">
            <h3 className="font-display text-xl text-gray-900 mb-1">Skip snacks?</h3>
            <p className="text-gray-600 text-sm mb-3">
              You added {selectedSnackCount} snack{selectedSnackCount > 1 ? 's' : ''}:
            </p>
            <ul className="mb-4 space-y-1">
              {selectedSnackNames.map(name => (
                <li key={name} className="text-sm text-gray-500 flex items-start gap-1.5">
                  <span className="text-brand-green mt-0.5 flex-shrink-0">•</span>{name}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => { onSkipSnacks(); setSkipConfirmOpen(false); }}
                className="w-full py-3 rounded-xl bg-brand-charcoal text-white font-bold text-sm hover:bg-gray-800 transition-colors"
              >
                Yes, skip snacks
              </button>
              <button
                onClick={() => setSkipConfirmOpen(false)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Keep my snacks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
