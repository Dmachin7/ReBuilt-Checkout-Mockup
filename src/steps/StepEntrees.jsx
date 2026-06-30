import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { MEALS_WEEK1, MEALS_WEEK2, MEALS_WEEK3, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ENTREE_ALL_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2, ...MEALS_WEEK3].map(m => m.id));

const WEEKS = [
  { id: 'w1', label: 'Week of Jun 29' },
  { id: 'w2', label: 'Week of Jul 6' },
  { id: 'w3', label: 'Week of Jul 13' },
];

const CATEGORIES = [
  { id: 'ALL',         label: 'All' },
  { id: 'CHEF',        label: "Chef's Choice" },
  { id: 'LIFESTYLE',   label: 'Lifestyle' },
  { id: 'PERFORMANCE', label: 'Performance' },
  { id: 'KETO',        label: 'Keto' },
  { id: 'PLANT-BASED', label: 'Plant-Based' },
];

export default function StepEntrees({
  singles, doubles,
  onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  entreeCount, mealCount, mealMode,
  onNext, onBack, onClear, selectedPlan, onClearEntrees, onRechefWeek,
}) {
  const [activeWeek, setActiveWeek] = useState('w1');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [modalMeal, setModalMeal] = useState(null);
  const [chefBannerDismissed, setChefBannerDismissed] = useState(false);
  const [pendingWeek, setPendingWeek] = useState(null);

  const weekMeals = activeWeek === 'w1' ? MEALS_WEEK1 : activeWeek === 'w2' ? MEALS_WEEK2 : MEALS_WEEK3;

  function handleWeekTabClick(weekId) {
    if (weekId === activeWeek) return;
    const hasEntrees =
      Object.entries(singles).some(([id, qty]) => qty > 0 && ENTREE_ALL_IDS.has(Number(id))) ||
      Object.entries(doubles).some(([id, qty]) => qty > 0 && ENTREE_ALL_IDS.has(Number(id)));
    if (hasEntrees) {
      setPendingWeek(weekId);
    } else {
      setActiveWeek(weekId);
    }
  }

  function confirmWeekChange() {
    if (mealMode === 'chef') {
      onRechefWeek?.(pendingWeek);
    } else {
      onClearEntrees?.();
    }
    setActiveWeek(pendingWeek);
    setPendingWeek(null);
  }

  function getMeals() {
    if (activeCategory === 'ALL') return weekMeals;
    if (activeCategory === 'CHEF') {
      if (selectedPlan === 'chefs_choice') {
        return weekMeals.filter(m => m.category === 'PERFORMANCE' || m.category === 'LIFESTYLE');
      }
      const planCategoryMap = { lifestyle: 'LIFESTYLE', performance: 'PERFORMANCE', keto: 'KETO', plant_based: 'PLANT-BASED' };
      const planCat = selectedPlan ? planCategoryMap[selectedPlan] : null;
      return weekMeals.filter(m => m.badge === 'Best Seller' || (planCat && m.category === planCat));
    }
    return weekMeals.filter(m => m.category === activeCategory);
  }

  const meals = getMeals();
  const isAtLimit = mealCount !== null && entreeCount >= mealCount;

  return (
    <div className="flex gap-6 px-4 sm:px-6 lg:px-10 py-6 max-w-[1800px] mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-4">

        {/* Header */}
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 leading-tight">
            Choose your {mealCount} entrées
          </h2>
        </div>

        {/* Chef-chosen banner */}
        {mealMode === 'chef' && !chefBannerDismissed && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 animate-reveal">
            <span className="text-xl flex-shrink-0">👨‍🍳</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Chef pre-selected your meals</p>
              <p className="text-amber-700 text-xs mt-0.5">Swap any meal you don't love using the − and + buttons.</p>
            </div>
            <button
              onClick={() => setChefBannerDismissed(true)}
              className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Week selector — above filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {WEEKS.map(w => (
            <button
              key={w.id}
              onClick={() => handleWeekTabClick(w.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeWeek === w.id
                  ? 'bg-white text-gray-900 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Category filter — wrap on mobile, no color */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Meal grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-16 sm:gap-y-20">
          {meals.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm">No meals found for this filter</p>
              <button onClick={() => setActiveCategory('ALL')} className="text-xs text-brand-green mt-1.5 hover:underline">
                View all meals
              </button>
            </div>
          )}
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              singleQty={singles[meal.id] || 0}
              doubleQty={doubles[meal.id] || 0}
              onAddSingle={onAddSingle}
              onRemoveSingle={onRemoveSingle}
              onAddDouble={onAddDouble}
              onRemoveDouble={onRemoveDouble}
              atLimit={isAtLimit}
              onCardClick={() => setModalMeal(meal)}
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
      />

      <MobileCartBar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel="Continue →"
        continueDisabled={!isAtLimit}
        visible
        onClear={onClear}
        onAddSingle={onAddSingle}
        onRemoveSingle={onRemoveSingle}
        onAddDouble={onAddDouble}
        onRemoveDouble={onRemoveDouble}
        onBack={onBack}
        onBackLabel="Back"
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
          atLimit={isAtLimit}
        />
      )}

      {/* Week-change confirmation */}
      {pendingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-reveal">
            <div className="text-3xl mb-3 text-center">📅</div>
            <h3 className="font-display text-xl text-gray-900 mb-2 text-center">Switch weeks?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              {mealMode === 'chef' ? (
                <>Switching to <strong>{WEEKS.find(w => w.id === pendingWeek)?.label}</strong> will pick a fresh chef's mix for that week.</>
              ) : (
                <>Switching to <strong>{WEEKS.find(w => w.id === pendingWeek)?.label}</strong> will clear your current meal selections.</>
              )}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={confirmWeekChange}
                className="w-full py-3 rounded-xl bg-brand-charcoal text-white font-bold text-sm hover:bg-gray-800 transition-colors"
              >
                Yes, switch weeks
              </button>
              <button
                onClick={() => setPendingWeek(null)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Keep current week
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
