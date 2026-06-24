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
  { id: 'ALL',         label: 'All',         dot: null },
  { id: 'LIFESTYLE',   label: 'Lifestyle',   dot: 'bg-green-500' },
  { id: 'PERFORMANCE', label: 'Performance', dot: 'bg-blue-500' },
  { id: 'KETO',        label: 'Keto',        dot: 'bg-pink-500' },
  { id: 'PLANT-BASED', label: 'Plant-Based', dot: 'bg-orange-400' },
];

const ALL_ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));

export default function StepEntrees({
  singles, doubles,
  onAddSingle, onRemoveSingle, onAddDouble, onRemoveDouble,
  entreeCount, mealCount, mealMode,
  onNext, onClear,
}) {
  const [activeWeek, setActiveWeek] = useState('w1');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [modalMeal, setModalMeal] = useState(null);
  const [chefBannerDismissed, setChefBannerDismissed] = useState(false);

  const weekMeals = activeWeek === 'w1' ? MEALS_WEEK1 : MEALS_WEEK2;
  const meals = activeCategory === 'ALL'
    ? weekMeals
    : weekMeals.filter(m => m.category === activeCategory);

  const isAtLimit = mealCount !== null && entreeCount >= mealCount;

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
      <div className="flex-1 min-w-0 pb-32 space-y-5">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-gray-900 leading-tight">
              Choose your {mealCount} entrées
            </h2>
            <p className={`text-sm mt-0.5 ${isAtLimit ? 'text-brand-green font-semibold' : 'text-gray-500'}`}>
              {isAtLimit
                ? `✓ All ${mealCount} slots filled — tap − to swap a meal`
                : `${entreeCount} of ${mealCount} selected`}
            </p>
          </div>
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

        {/* At-limit banner */}
        {isAtLimit && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-green-800 text-sm animate-reveal">
            <span>🎉</span>
            <span>Plan complete! Use − to swap a meal, or continue below.</span>
          </div>
        )}

        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>🍳</span> Breakfast add-ons available in the next step
        </p>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const count = cat.id === 'ALL'
              ? weekMeals.length
              : weekMeals.filter(m => m.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />}
                {cat.label}
                <span className="text-[10px] text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Week selector */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {WEEKS.map(w => (
            <button
              key={w.id}
              onClick={() => setActiveWeek(w.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeWeek === w.id
                  ? 'bg-brand-green text-white font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Meal grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-10">
          {meals.length === 0 && (
            <div className="col-span-2 py-10 text-center text-gray-400">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm">No {activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase()} meals this week</p>
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

      <CartSidebar singles={singles} doubles={doubles} mealCount={mealCount} onClear={onClear} />

      <MobileCartBar
        singles={singles}
        doubles={doubles}
        mealCount={mealCount}
        onContinue={onNext}
        continueLabel="Continue →"
        continueDisabled={!isAtLimit}
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
          atLimit={isAtLimit}
        />
      )}
    </div>
  );
}
