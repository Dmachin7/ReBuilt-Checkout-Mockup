import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { MEALS_WEEK1, MEALS_WEEK2 } from '../data/meals';

const WEEKS = [
  { id: 'w1', label: 'Week of Jun 15' },
  { id: 'w2', label: 'Week of Jun 22' },
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
  onNext, onClear, selectedPlan,
}) {
  const [activeWeek, setActiveWeek] = useState('w1');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [modalMeal, setModalMeal] = useState(null);
  const [chefBannerDismissed, setChefBannerDismissed] = useState(false);

  const weekMeals = activeWeek === 'w1' ? MEALS_WEEK1 : MEALS_WEEK2;

  function getMeals() {
    if (activeCategory === 'ALL') return weekMeals;
    if (activeCategory === 'CHEF') {
      // Show Best Seller meals + any that match the selected plan category
      const planCategoryMap = { lifestyle: 'LIFESTYLE', performance: 'PERFORMANCE', keto: 'KETO', plant_based: 'PLANT-BASED' };
      const planCat = selectedPlan ? planCategoryMap[selectedPlan] : null;
      return weekMeals.filter(m => m.badge === 'Best Seller' || (planCat && m.category === planCat));
    }
    return weekMeals.filter(m => m.category === activeCategory);
  }

  const meals = getMeals();
  const isAtLimit = mealCount !== null && entreeCount >= mealCount;

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
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
              onClick={() => setActiveWeek(w.id)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
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
    </div>
  );
}
