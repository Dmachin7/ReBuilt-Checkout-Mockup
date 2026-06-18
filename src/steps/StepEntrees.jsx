import { useState } from 'react';
import MealCard from '../components/MealCard';
import MealModal from '../components/MealModal';
import CartSidebar from '../components/CartSidebar';
import MobileCartBar from '../components/MobileCartBar';
import { MEALS_WEEK1, MEALS_WEEK2, PLANS, MEAL_COUNTS } from '../data/meals';

// Price per meal drops as you order more
const PRICING = {
  5:  { perMeal: 13.99 },
  7:  { perMeal: 13.49 },
  9:  { perMeal: 12.99 },
  10: { perMeal: 12.99 },
  12: { perMeal: 12.49 },
  14: { perMeal: 11.99 },
  16: { perMeal: 11.49 },
  18: { perMeal: 10.99 },
};

const WEEKS = [
  { id: 'w1', label: 'Week of Jun 15' },
  { id: 'w2', label: 'Week of Jun 22' },
];

const ALL_ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));

export default function StepEntrees({ cart, doubleProteins, onAdd, onRemove, onDoubleProteinToggle, onNext, mealCount, setMealCount, selectedPlan, setSelectedPlan }) {
  const [showMoreCounts, setShowMoreCounts] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [activeWeek, setActiveWeek] = useState('w1');
  const [modalMeal, setModalMeal] = useState(null);

  const visibleCounts = showMoreCounts ? MEAL_COUNTS : MEAL_COUNTS.slice(0, 4);
  const meals = activeWeek === 'w1' ? MEALS_WEEK1 : MEALS_WEEK2;

  // Track total entrée count and enforce limit
  const entreeCount = Object.entries(cart)
    .filter(([id]) => ALL_ENTREE_IDS.has(Number(id)))
    .reduce((sum, [, qty]) => sum + qty, 0);

  const isAtLimit = mealCount !== null && entreeCount >= mealCount;

  // Gate onAdd for entrées — hard cap at mealCount
  function handleEntreeAdd(id) {
    if (mealCount !== null && entreeCount >= mealCount) return;
    onAdd(id);
  }

  const hasPicked = mealCount !== null;
  const pricing = mealCount ? PRICING[mealCount] : null;
  const weeklyTotal = pricing ? (pricing.perMeal * mealCount).toFixed(2) : null;

  return (
    <div className="flex gap-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6 pb-32">

        {/* ── SECTION 1: Meal count (always visible) ── */}
        <section>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">
            How many meals per week?
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            More meals = lower price per meal. You can change this anytime.
          </p>

          <div className="flex flex-wrap gap-2">
            {visibleCounts.map(n => {
              const p = PRICING[n];
              const weekly = (p.perMeal * n).toFixed(2);
              const isSelected = mealCount === n;
              return (
                <button
                  key={n}
                  onClick={() => setMealCount(n)}
                  className={`px-4 py-3 rounded-xl text-left border-2 transition-all min-w-[108px] ${
                    isSelected
                      ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  <p className="font-bold text-sm leading-tight">{n} meals</p>
                  <p className={`text-[11px] mt-1 leading-tight ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    ${p.perMeal}/meal
                  </p>
                  <p className={`text-[10px] leading-tight ${isSelected ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                    ${weekly}/week
                  </p>
                </button>
              );
            })}
            {!showMoreCounts && (
              <button
                onClick={() => setShowMoreCounts(true)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500 transition-colors min-w-[108px]"
              >
                More options ↓
              </button>
            )}
          </div>

          {/* Confirmation chip */}
          {hasPicked && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-3 py-1.5 rounded-xl animate-reveal">
              <span className="text-green-500 text-base">✓</span>
              {mealCount} meals · ${pricing.perMeal}/meal · ${weeklyTotal}/week
            </div>
          )}
        </section>

        {/* ── SECTION 2: Backup plan (appears after count chosen) ── */}
        {hasPicked && (
          <section className="bg-white rounded-2xl p-5 shadow-sm animate-reveal">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                🛡️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-lg text-gray-900">Just-in-case plan</h2>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Optional
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  You'll pick your own meals every week — this is only used if you ever <em>forget</em> to choose before the deadline.
                </p>
              </div>
            </div>

            {/* Plan grid — equal height cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANS.map(plan => (
                <div key={plan.id} className="flex flex-col">
                  <button
                    onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                    className={`w-full h-[76px] text-left p-3 rounded-xl border-2 transition-all flex flex-col justify-between flex-shrink-0 ${
                      selectedPlan === plan.id
                        ? 'border-brand-green bg-green-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: plan.color }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{plan.name}</p>
                      <p className="text-[10px] text-gray-500 leading-tight line-clamp-1 mt-0.5">{plan.tagline}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="text-[10px] text-brand-green font-medium text-center mt-1 py-0.5 hover:underline"
                  >
                    {expandedPlan === plan.id ? 'Hide ▲' : 'What is this? ▼'}
                  </button>
                  {expandedPlan === plan.id && (
                    <div className="mt-1 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 animate-reveal">
                      <p className="mb-1.5">{plan.description}</p>
                      <ul className="space-y-0.5">
                        {plan.highlights.map(h => (
                          <li key={h} className="flex items-start gap-1">
                            <span className="text-brand-green flex-shrink-0">✓</span> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION 3: Meal grid (appears after count chosen, slightly delayed) ── */}
        {hasPicked && (
          <section className="animate-reveal-delayed">
            {/* Header */}
            <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
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

            {/* At-limit banner */}
            {isAtLimit && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-green-800 text-sm animate-reveal">
                <span>🎉</span>
                <span>Plan complete! Use − to swap a meal, or continue below.</span>
              </div>
            )}

            {/* Next-step hint — plain text, not a button */}
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
              <span>🍳</span> Breakfast add-ons available in the next step
            </p>

            {/* Week selector */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
              {WEEKS.map(w => (
                <button
                  key={w.id}
                  onClick={() => setActiveWeek(w.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeWeek === w.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            {/* Meal cards — extra vertical gap for ribbon badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-7">
              {meals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  qty={cart[meal.id] || 0}
                  onAdd={handleEntreeAdd}
                  onRemove={onRemove}
                  onDoubleProteinToggle={onDoubleProteinToggle}
                  doubleProtein={!!doubleProteins[meal.id]}
                  atLimit={isAtLimit}
                  onCardClick={() => setModalMeal(meal)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Desktop sidebar — only once count is picked */}
      {hasPicked && (
        <CartSidebar cart={cart} doubleProteins={doubleProteins} mealCount={mealCount} />
      )}

      {/* Floating bottom bar — all screens */}
      <MobileCartBar
        cart={cart}
        doubleProteins={doubleProteins}
        mealCount={mealCount || 5}
        onContinue={onNext}
        continueLabel="Continue to Breakfast →"
        visible={hasPicked}
      />

      {/* Meal detail modal */}
      {modalMeal && (
        <MealModal
          meal={modalMeal}
          onClose={() => setModalMeal(null)}
          qty={cart[modalMeal.id] || 0}
          onAdd={handleEntreeAdd}
          onRemove={onRemove}
          doubleProtein={!!doubleProteins[modalMeal.id]}
          onDoubleProteinToggle={onDoubleProteinToggle}
          atLimit={isAtLimit}
        />
      )}
    </div>
  );
}
